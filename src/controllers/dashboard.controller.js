const dashboardService = require('../services/dashboard.service');
const { successResponse, paginatedResponse } = require('../utils/response');

async function adminStats(req, res, next) {
  try {
    const stats = await dashboardService.adminStats();
    successResponse(res, stats, 'Dashboard stats retrieved');
  } catch (e) { next(e); }
}

async function charts(req, res, next) {
  try {
    const [revenue, policies, agents, rmPerf, commission] = await Promise.all([
      dashboardService.monthlyRevenue(),
      dashboardService.monthlyPolicies(),
      dashboardService.agentGrowth(),
      dashboardService.rmPerformance(),
      dashboardService.commissionTrend(),
    ]);
    successResponse(res, { revenue, policies, agents, rm_performance: rmPerf, commission }, 'Chart data retrieved');
  } catch (e) { next(e); }
}

async function rmStats(req, res, next) {
  try {
    const stats = await dashboardService.rmStats(req.user.id);
    successResponse(res, stats, 'RM stats retrieved');
  } catch (e) { next(e); }
}

async function auditLogs(req, res, next) {
  try {
    const { user_type, action, entity_type, page = 1, limit = 50 } = req.query;
    const { rows, total } = await dashboardService.auditLogs({ user_type, action, entity_type, page: +page, limit: +limit });
    paginatedResponse(res, rows, total, page, limit, 'Audit logs retrieved');
  } catch (e) { next(e); }
}

module.exports = { adminStats, charts, rmStats, auditLogs };
