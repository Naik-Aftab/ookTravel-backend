const commissionService = require('../services/commission.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { agent_id, status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await commissionService.getAllCommissions({ agent_id, status, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Commissions retrieved');
  } catch (e) { next(e); }
}

async function getAgentLedger(req, res, next) {
  try {
    const ledger = await commissionService.getAgentLedger(+req.params.agentId);
    successResponse(res, ledger, 'Agent ledger retrieved');
  } catch (e) { next(e); }
}

async function getMonthlyLedgers(req, res, next) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const { rows, total } = await commissionService.getMonthlyLedgers({ page: +page, limit: +limit, search, status });
    paginatedResponse(res, rows, total, page, limit, 'Monthly ledgers retrieved');
  } catch (e) { next(e); }
}

async function updateStatus(req, res, next) {
  try {
    const { agent_id, month_key, month_label, commission_amount, status } = req.body;
    await commissionService.updateMonthStatus(
      +agent_id, month_key, month_label, commission_amount, status,
      req.user.id, req.user.full_name || req.user.email, req.ip
    );
    successResponse(res, null, 'Commission status updated');
  } catch (e) { next(e); }
}

async function getStats(req, res, next) {
  try {
    const stats = await commissionService.getSummaryStats();
    successResponse(res, stats, 'Commission stats retrieved');
  } catch (e) { next(e); }
}

module.exports = { getAll, getAgentLedger, getMonthlyLedgers, updateStatus, getStats };
