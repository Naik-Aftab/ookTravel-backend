const policyService       = require('../services/policy.service');
const { successResponse } = require('../utils/response');

async function createRequest(req, res, next) {
  try {
    const result = await policyService.createRequest(req.body, req.ip);
    successResponse(res, result, 'Policy request submitted', 201);
  } catch (e) { next(e); }
}

async function getAgentRequests(req, res, next) {
  try {
    const agent_id = parseInt(req.query.agent_id, 10);
    if (!agent_id || isNaN(agent_id)) {
      return res.status(400).json({ success: false, message: 'agent_id is required' });
    }
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 50;
    const status = req.query.status || undefined;
    const { rows, total } = await policyService.getAllRequests({ agent_id, status, page, limit });
    return successResponse(res, { requests: rows, total, page, limit });
  } catch (e) { next(e); }
}

module.exports = { createRequest, getAgentRequests };
