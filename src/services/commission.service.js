const commRepo   = require('../repositories/commission.repository');
const notifRepo  = require('../repositories/notification.repository');
const auditRepo  = require('../repositories/audit.repository');
const agentRepo  = require('../repositories/agent.repository');
const { sendEmail, commissionPaidEmail } = require('../utils/email');
const logger     = require('../utils/logger');

async function getAllCommissions(filters) {
  return commRepo.findAll(filters);
}

async function getCommissionById(id) {
  const comm = await commRepo.findById(id);
  if (!comm) throw Object.assign(new Error('Commission not found'), { statusCode: 404 });
  return comm;
}

async function getAgentLedger(agentId) {
  const ledger = await commRepo.agentLedger(agentId);
  if (!ledger) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });
  return ledger;
}

async function getMonthlyLedgers(filters) {
  return commRepo.agentMonthlyLedgers(filters);
}

async function updateMonthStatus(agentId, monthKey, monthLabel, commissionAmount, status, adminId, adminName, ip) {
  await commRepo.updateAgentMonthStatus(agentId, monthKey, status);

  if (status === 'paid') {
    const agent = await agentRepo.findById(agentId);
    if (agent) {
      await notifRepo.create({
        user_type: 'agent', user_id: agentId,
        title: 'Commission Paid',
        message: `Your commission of Rs. ${commissionAmount} for ${monthLabel} has been marked as paid.`,
        type: 'commission_paid', entity_type: 'commission', entity_id: agentId,
      });
      await sendEmail(commissionPaidEmail(agent, monthLabel, commissionAmount)).catch(err => {
        logger.error(`Commission paid email failed for ${agent.email}: ${err.message}`);
      });
    }
  }

  await auditRepo.log({
    user_type: 'admin', user_id: adminId, user_name: adminName,
    action: 'COMMISSION_STATUS_UPDATED', entity_type: 'commission', entity_id: agentId,
    new_values: { agent_id: agentId, month_key: monthKey, status }, ip_address: ip,
  });
}

async function getSummaryStats() {
  const [stats, monthly] = await Promise.all([
    commRepo.summaryStats(),
    commRepo.currentMonthCommission(),
  ]);
  return { ...stats, current_month: monthly.current_month };
}

module.exports = {
  getAllCommissions, getCommissionById, getAgentLedger,
  getMonthlyLedgers, updateMonthStatus, getSummaryStats,
};
