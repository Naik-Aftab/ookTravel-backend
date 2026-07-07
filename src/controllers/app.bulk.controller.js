const policyRepo = require('../repositories/policy.repository');
const agentRepo  = require('../repositories/agent.repository');
const notifRepo  = require('../repositories/notification.repository');
const { successResponse } = require('../utils/response');

function safeStr(val) {
  if (val === undefined || val === null) return '';
  const s = String(val).trim();
  return (s === 'null' || s === 'undefined') ? '' : s;
}

function safeDate(val) {
  const s = safeStr(val);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

async function submitBulkUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV or Excel file is required' });
    }

    // All non-file fields arrive as a single JSON string in req.body.data
    let meta = {};
    if (req.body.data) {
      try { meta = JSON.parse(req.body.data); } catch (_) {}
    }

    const agent_id = parseInt(meta.agent_id, 10);
    if (!agent_id || isNaN(agent_id)) {
      return res.status(400).json({ success: false, message: 'agent_id is required' });
    }

    const today = new Date().toISOString().split('T')[0];

    let proposalResponse = null;
    if (meta.proposal_response) {
      try { proposalResponse = JSON.parse(meta.proposal_response); } catch (_) {}
    }

    const traveller_details = {
      panNo:          safeStr(meta.pan_no),
      dob:            safeStr(meta.dob),
      phone:          safeStr(meta.phone),
      name:           safeStr(meta.name),
      email:          safeStr(meta.email),
      bulk_file:      req.file.filename,
      bulk_file_path: req.file.path,
      proposalResponse,
    };

    const result = await policyRepo.createRequest({
      agent_id,
      plan_type:         'bulk',
      travel_date:       safeDate(meta.travel_date)  || today,
      return_date:       safeDate(meta.return_date)  || today,
      num_travelers:     parseInt(meta.num_travelers, 10) || 1,
      estimated_premium: parseFloat(meta.estimated_premium) || null,
      payment_amount:    parseFloat(meta.payment_amount)    || null,
      payment_reference: safeStr(meta.payment_reference) || null,
      traveller_details,
    });

    console.log('Bulk request created:', result);

    const agent = await agentRepo.findById(agent_id);
    if (agent && agent.assigned_rm_id) {
      await notifRepo.create({
        user_type:   'rm',
        user_id:     agent.assigned_rm_id,
        title:       'Bulk Policy Request',
        message:     `Agent ${agent.full_name} submitted a bulk policy request (${req.file.originalname}).`,
        type:        'new_request',
        entity_type: 'policy_request',
        entity_id:   result.insertId || null,
      });
      // Auto-assign RM exactly like individual flow does
      await policyRepo.updateRequestStatus(result.insertId, 'assigned', agent.assigned_rm_id);
    }

    return successResponse(
      res,
      { request_number: result.request_number, file: req.file.filename },
      'Bulk policy request submitted successfully',
      201
    );
  } catch (e) {
    next(e);
  }
}

module.exports = { submitBulkUpload };
