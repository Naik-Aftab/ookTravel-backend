const commRepo            = require('../repositories/commission.repository');
const { successResponse } = require('../utils/response');

async function getAgentSummary(req, res, next) {
  try {
    const agent_id = parseInt(req.query.agent_id, 10);
    if (!agent_id || isNaN(agent_id)) {
      return res.status(400).json({ success: false, message: 'agent_id is required' });
    }
    const summary = await commRepo.agentLedger(agent_id);
    return successResponse(res, summary ?? {
      agent_id,
      full_name: null,
      email: null,
      total_premium: 0,
      commission_earned: 0,
    });
  } catch (e) { next(e); }
}

module.exports = { getAgentSummary };
