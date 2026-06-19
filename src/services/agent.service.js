const agentRepo  = require('../repositories/agent.repository');
const rmRepo     = require('../repositories/rm.repository');
const notifRepo  = require('../repositories/notification.repository');
const auditRepo  = require('../repositories/audit.repository');

async function getAllAgents(filters) {
  return agentRepo.findAll(filters);
}

async function getAgentById(id) {
  const agent = await agentRepo.findById(id);
  if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });
  return agent;
}

async function assignRm(agentId, rmId, adminId, adminName, ip) {
  const agent  = await agentRepo.findById(agentId);
  if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });

  const rm = await rmRepo.findById(rmId);
  if (!rm || rm.status !== 'active') throw Object.assign(new Error('RM not found or not active'), { statusCode: 404 });

  const oldRmId = agent.assigned_rm_id;
  await agentRepo.assignRm(agentId, rmId);

  // Notify RM of new agent assignment
  await notifRepo.create({
    user_type: 'rm', user_id: rmId,
    title: 'New Agent Assigned',
    message: `Agent ${agent.full_name} has been assigned to you.`,
    type: 'assignment', entity_type: 'agent', entity_id: agentId,
  });

  await auditRepo.log({
    user_type: 'admin', user_id: adminId, user_name: adminName,
    action: 'AGENT_RM_ASSIGNED', entity_type: 'agent', entity_id: agentId,
    old_values: { rm_id: oldRmId }, new_values: { rm_id: rmId }, ip_address: ip,
  });
}

async function transferAgent(agentId, newRmId, adminId, adminName, ip) {
  return assignRm(agentId, newRmId, adminId, adminName, ip);
}

async function activateAgent(id, adminId, adminName, ip) {
  await agentRepo.updateStatus(id, 'active');
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'AGENT_ACTIVATED', entity_type: 'agent', entity_id: id, ip_address: ip });
}

async function suspendAgent(id, adminId, adminName, ip) {
  await agentRepo.updateStatus(id, 'suspended');
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'AGENT_SUSPENDED', entity_type: 'agent', entity_id: id, ip_address: ip });
}

async function updateKyc(id, status, adminId, adminName, ip) {
  if (!['verified', 'rejected'].includes(status)) throw Object.assign(new Error('Invalid KYC status'), { statusCode: 400 });
  await agentRepo.updateKycStatus(id, status);
  await auditRepo.log({ user_type: 'admin', user_id: adminId, user_name: adminName, action: 'AGENT_KYC_UPDATED', entity_type: 'agent', entity_id: id, new_values: { kyc_status: status }, ip_address: ip });
}

async function getAgentsByRm(rmId) {
  return agentRepo.findByRmId(rmId);
}

module.exports = { getAllAgents, getAgentById, assignRm, transferAgent, activateAgent, suspendAgent, updateKyc, getAgentsByRm };
