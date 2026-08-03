const reportService = require('../services/report.service');
const { generatePerformanceReportPdf } = require('../utils/performance-report-pdf');
const { successResponse } = require('../utils/response');

const VALID_PERIODS = ['this_month', 'last_month', 'this_quarter', 'this_year'];

function resolvePeriod(period) {
  return VALID_PERIODS.includes(period) ? period : 'this_month';
}

async function loadReportData(period) {
  const [summary, rmRows, agentRows] = await Promise.all([
    reportService.summary(period),
    reportService.rmPerformanceReport(period),
    reportService.agentPerformanceReport(period),
  ]);
  return { summary, rmRows, agentRows };
}

async function getPerformanceReport(req, res, next) {
  try {
    const period = resolvePeriod(req.query.period);
    const { summary, rmRows, agentRows } = await loadReportData(period);
    successResponse(res, { summary, rm_performance: rmRows, agent_performance: agentRows }, 'Performance report retrieved');
  } catch (e) { next(e); }
}

async function downloadPerformanceReportPdf(req, res, next) {
  try {
    const period = resolvePeriod(req.query.period);
    const { summary, rmRows, agentRows } = await loadReportData(period);
    const pdfBuffer = await generatePerformanceReportPdf({ summary, rmRows, agentRows });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="performance-report-${period}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) { next(e); }
}

module.exports = { getPerformanceReport, downloadPerformanceReportPdf };
