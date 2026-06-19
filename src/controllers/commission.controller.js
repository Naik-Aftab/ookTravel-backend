const commissionService = require('../services/commission.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { agent_id, status, page = 1, limit = 20 } = req.query;
    const { rows, total } = await commissionService.getAllCommissions({ agent_id, status, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Commissions retrieved');
  } catch (e) { next(e); }
}

async function getOne(req, res, next) {
  try {
    const comm = await commissionService.getCommissionById(+req.params.id);
    successResponse(res, comm, 'Commission retrieved');
  } catch (e) { next(e); }
}

async function getAgentLedger(req, res, next) {
  try {
    const ledger = await commissionService.getAgentLedger(+req.params.agentId);
    successResponse(res, ledger, 'Agent ledger retrieved');
  } catch (e) { next(e); }
}

async function getAllAgentLedgers(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { rows, total } = await commissionService.getAllAgentLedgers({ page: +page, limit: +limit, search });
    paginatedResponse(res, rows, total, page, limit, 'Agent ledgers retrieved');
  } catch (e) { next(e); }
}

async function createPayment(req, res, next) {
  try {
    const paymentProof = req.file ? `/uploads/commission_proofs/${req.file.filename}` : null;
    const id = await commissionService.createPayment(
      { ...req.body, payment_proof: paymentProof },
      req.user.id, req.user.full_name || req.user.email, req.ip
    );
    successResponse(res, { id }, 'Payment recorded', 201);
  } catch (e) { next(e); }
}

async function getPaymentHistory(req, res, next) {
  try {
    const payments = await commissionService.getPaymentHistory(+req.params.id);
    successResponse(res, payments, 'Payment history retrieved');
  } catch (e) { next(e); }
}

async function getStats(req, res, next) {
  try {
    const stats = await commissionService.getSummaryStats();
    successResponse(res, stats, 'Commission stats retrieved');
  } catch (e) { next(e); }
}

module.exports = { getAll, getOne, getAgentLedger, getAllAgentLedgers, createPayment, getPaymentHistory, getStats };
