const commRepo     = require('../repositories/commission.repository');
const notifRepo    = require('../repositories/notification.repository');
const auditRepo    = require('../repositories/audit.repository');
const agentRepo    = require('../repositories/agent.repository');
const { sendEmail, commissionPaidEmail } = require('../utils/email');

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

async function getAllAgentLedgers(filters) {
  return commRepo.allAgentLedgers(filters);
}

async function createPayment(data, adminId, adminName, ip) {
  const comm = await commRepo.findById(data.commission_id);
  if (!comm) throw Object.assign(new Error('Commission not found'), { statusCode: 404 });

  if (data.payment_amount > comm.pending_amount) {
    throw Object.assign(new Error(`Payment amount exceeds pending amount of ₹${comm.pending_amount}`), { statusCode: 400 });
  }

  const paymentId = await commRepo.createPayment({ ...data, agent_id: comm.agent_id, created_by: adminId });

  // Notify agent
  const agent = await agentRepo.findById(comm.agent_id);
  if (agent) {
    await notifRepo.create({
      user_type: 'agent', user_id: comm.agent_id,
      title: 'Commission Payment',
      message: `₹${data.payment_amount} commission has been paid to your account.`,
      type: 'commission_paid', entity_type: 'commission', entity_id: data.commission_id,
    });
    await sendEmail(commissionPaidEmail(agent, data.payment_amount)).catch(() => {});
  }

  await auditRepo.log({
    user_type: 'admin', user_id: adminId, user_name: adminName,
    action: 'COMMISSION_PAYMENT_CREATED', entity_type: 'commission', entity_id: data.commission_id,
    new_values: { payment_amount: data.payment_amount, utr_number: data.utr_number }, ip_address: ip,
  });

  return paymentId;
}

async function getPaymentHistory(commissionId) {
  return commRepo.getPaymentsByCommission(commissionId);
}

async function getSummaryStats() {
  const [stats, monthly] = await Promise.all([
    commRepo.summaryStats(),
    commRepo.currentMonthCommission(),
  ]);
  return { ...stats, current_month: monthly.current_month };
}

module.exports = { getAllCommissions, getCommissionById, getAgentLedger, getAllAgentLedgers, createPayment, getPaymentHistory, getSummaryStats };
