const policyRepo   = require('../repositories/policy.repository');
const commRepo     = require('../repositories/commission.repository');
const notifRepo    = require('../repositories/notification.repository');
const auditRepo    = require('../repositories/audit.repository');
const agentRepo    = require('../repositories/agent.repository');

async function createRequest(data, ip) {
  const { insertId, request_number } = await policyRepo.createRequest(data);

  // Notify agent's assigned RM if any
  const agent = await agentRepo.findById(data.agent_id);
  if (agent && agent.assigned_rm_id) {
    await notifRepo.create({
      user_type: 'rm', user_id: agent.assigned_rm_id,
      title: 'New Policy Request',
      message: `Agent ${agent.full_name} submitted request ${request_number}.`,
      type: 'new_request', entity_type: 'policy_request', entity_id: insertId,
    });
    // Auto-assign RM
    await policyRepo.updateRequestStatus(insertId, 'assigned', agent.assigned_rm_id);
  }

  return { id: insertId, request_number };
}

async function getRequestById(id) {
  const req = await policyRepo.findRequestById(id);
  if (!req) throw Object.assign(new Error('Request not found'), { statusCode: 404 });
  return req;
}

async function getAllRequests(filters) {
  return policyRepo.findAllRequests(filters);
}

async function updateRequestStatus(id, status, remarks, userId, userRole, ip) {
  const req = await policyRepo.findRequestById(id);
  if (!req) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  const old_status = req.status;
  await policyRepo.updateRequestStatus(id, status, null, remarks);

  await auditRepo.log({
    user_type: userRole, user_id: userId, action: 'REQUEST_STATUS_CHANGED',
    entity_type: 'policy_request', entity_id: id,
    old_values: { status: old_status }, new_values: { status, remarks }, ip_address: ip,
  });

  // When marked as issued from the status dropdown, auto-create a policy + commission
  if (status === 'issued') {
    const effectiveRmId = req.rm_id || (userRole === 'rm' ? userId : null);
    if (effectiveRmId && req.payment_amount) {
      const existing = await policyRepo.findPolicyByRequestId(id);
      if (!existing) {
        const { insertId, policy_number } = await policyRepo.createPolicy({
          request_id:     id,
          agent_id:       req.agent_id,
          rm_id:          effectiveRmId,
          provider_name:  'External Portal',
          plan_name:      req.plan_type || 'Travel Insurance',
          premium_amount: req.payment_amount,
          coverage_amount: null,
          issue_date:     new Date().toISOString().split('T')[0],
          expiry_date:    req.return_date,
          policy_pdf:     null,
        });
        await commRepo.createCommission(insertId, req.agent_id, req.payment_amount);
        await notifRepo.create({
          user_type: 'agent', user_id: req.agent_id,
          title: 'Policy Issued',
          message: `Your policy ${policy_number} has been issued.`,
          type: 'policy_issued', entity_type: 'policy', entity_id: insertId,
        });
        await auditRepo.log({
          user_type: userRole, user_id: userId, action: 'POLICY_AUTO_ISSUED',
          entity_type: 'policy', entity_id: insertId,
          new_values: { policy_number, premium_amount: req.payment_amount }, ip_address: ip,
        });
      }
    }
  }

  // Notify agent of status change
  await notifRepo.create({
    user_type: 'agent', user_id: req.agent_id,
    title: 'Policy Request Update',
    message: `Your request ${req.request_number} status changed to ${status}.`,
    type: 'status_update', entity_type: 'policy_request', entity_id: id,
  });
}

async function issuePolicy(requestId, policyData, pdfPath, userId, userRole, ip) {
  const req = await policyRepo.findRequestById(requestId);
  if (!req) throw Object.assign(new Error('Request not found'), { statusCode: 404 });

  const { insertId, policy_number } = await policyRepo.createPolicy({
    ...policyData,
    request_id:  requestId,
    agent_id:    req.agent_id,
    rm_id:       req.rm_id,
    policy_pdf:  pdfPath || null,
  });

  // Mark request as issued
  await policyRepo.updateRequestStatus(requestId, 'issued');

  // Auto-calculate commission
  await commRepo.createCommission(insertId, req.agent_id, policyData.premium_amount);

  // Notify agent
  await notifRepo.create({
    user_type: 'agent', user_id: req.agent_id,
    title: 'Policy Issued',
    message: `Your policy ${policy_number} has been issued.`,
    type: 'policy_issued', entity_type: 'policy', entity_id: insertId,
  });

  await auditRepo.log({
    user_type: userRole, user_id: userId, action: 'POLICY_ISSUED',
    entity_type: 'policy', entity_id: insertId,
    new_values: { policy_number, premium_amount: policyData.premium_amount }, ip_address: ip,
  });

  return { id: insertId, policy_number };
}

async function getAllPolicies(filters) {
  return policyRepo.findAllPolicies(filters);
}

async function getPolicyById(id) {
  const policy = await policyRepo.findPolicyById(id);
  if (!policy) throw Object.assign(new Error('Policy not found'), { statusCode: 404 });
  return policy;
}

module.exports = { createRequest, getRequestById, getAllRequests, updateRequestStatus, issuePolicy, getAllPolicies, getPolicyById };
