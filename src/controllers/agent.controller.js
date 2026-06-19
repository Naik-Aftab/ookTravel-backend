const agentService = require('../services/agent.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { status, rm_id, search, kyc_status, page = 1, limit = 20 } = req.query;
    // RM can only see their own agents
    const effectiveRmId = req.user.role === 'rm' ? req.user.id : rm_id;
    const { rows, total } = await agentService.getAllAgents({ status, rm_id: effectiveRmId, search, kyc_status, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Agents retrieved');
  } catch (e) { next(e); }
}

async function getOne(req, res, next) {
  try {
    const agent = await agentService.getAgentById(+req.params.id);
    successResponse(res, agent, 'Agent retrieved');
  } catch (e) { next(e); }
}

async function assignRm(req, res, next) {
  try {
    await agentService.assignRm(+req.params.id, +req.body.rm_id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'RM assigned to agent');
  } catch (e) { next(e); }
}

async function transferAgent(req, res, next) {
  try {
    await agentService.transferAgent(+req.params.id, +req.body.rm_id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'Agent transferred to new RM');
  } catch (e) { next(e); }
}

async function activate(req, res, next) {
  try {
    await agentService.activateAgent(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'Agent activated');
  } catch (e) { next(e); }
}

async function suspend(req, res, next) {
  try {
    await agentService.suspendAgent(+req.params.id, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'Agent suspended');
  } catch (e) { next(e); }
}

async function updateKyc(req, res, next) {
  try {
    await agentService.updateKyc(+req.params.id, req.body.kyc_status, req.user.id, req.user.full_name || req.user.email, req.ip);
    successResponse(res, null, 'KYC status updated');
  } catch (e) { next(e); }
}

module.exports = { getAll, getOne, assignRm, transferAgent, activate, suspend, updateKyc };
