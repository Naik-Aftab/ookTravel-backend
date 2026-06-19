const { query, queryOne } = require('../config/database');

const COMMISSION_RATE = 25;

async function createCommission(policyId, agentId, premiumAmount) {
  const commissionAmount = (premiumAmount * COMMISSION_RATE) / 100;
  const result = await query(
    `INSERT INTO ooktravel_commissions
       (policy_id, agent_id, premium_amount, commission_rate, commission_amount, pending_amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [policyId, agentId, premiumAmount, COMMISSION_RATE, commissionAmount, commissionAmount]
  );
  return result.insertId;
}

async function findById(id) {
  return queryOne(
    `SELECT c.*, a.full_name AS agent_name, a.email AS agent_email,
       p.policy_number, p.provider_name
     FROM ooktravel_commissions c
     LEFT JOIN ooktravel_agents   a ON a.id = c.agent_id
     LEFT JOIN ooktravel_policies p ON p.id = c.policy_id
     WHERE c.id = ?`, [id]
  );
}

async function findAll({ agent_id, status, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (agent_id) { where += ' AND c.agent_id = ?'; params.push(agent_id); }
  if (status)   { where += ' AND c.status = ?';   params.push(status); }

  const countRow = await queryOne(
    `SELECT COUNT(*) AS total FROM ooktravel_commissions c WHERE ${where}`, params
  );
  const rows = await query(
    `SELECT c.id, c.premium_amount, c.commission_rate, c.commission_amount,
       c.paid_amount, c.pending_amount, c.status, c.created_at,
       a.full_name AS agent_name, p.policy_number
     FROM ooktravel_commissions c
     LEFT JOIN ooktravel_agents   a ON a.id = c.agent_id
     LEFT JOIN ooktravel_policies p ON p.id = c.policy_id
     WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function agentLedger(agentId) {
  return queryOne(
    `SELECT
       a.id AS agent_id, a.full_name, a.email,
       COALESCE(SUM(c.premium_amount),    0) AS total_premium,
       COALESCE(SUM(c.commission_amount), 0) AS commission_earned,
       COALESCE(SUM(c.paid_amount),       0) AS paid_amount,
       COALESCE(SUM(c.pending_amount),    0) AS pending_amount
     FROM ooktravel_agents a
     LEFT JOIN ooktravel_commissions c ON c.agent_id = a.id
     WHERE a.id = ?
     GROUP BY a.id`, [agentId]
  );
}

async function allAgentLedgers({ page = 1, limit = 20, search } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (a.full_name LIKE ? OR a.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countRow = await queryOne(
    `SELECT COUNT(*) AS total FROM ooktravel_agents a WHERE ${where}`, params
  );
  const rows = await query(
    `SELECT a.id, a.full_name, a.email, a.agency_name,
       COALESCE(SUM(c.premium_amount),    0) AS total_premium,
       COALESCE(SUM(c.commission_amount), 0) AS commission_earned,
       COALESCE(SUM(c.paid_amount),       0) AS paid_amount,
       COALESCE(SUM(c.pending_amount),    0) AS pending_amount
     FROM ooktravel_agents a
     LEFT JOIN ooktravel_commissions c ON c.agent_id = a.id
     WHERE ${where}
     GROUP BY a.id ORDER BY a.full_name LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function createPayment(data) {
  const result = await query(
    `INSERT INTO ooktravel_commission_payments
       (commission_id, agent_id, payment_amount, utr_number, payment_date, payment_proof, remarks, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.commission_id, data.agent_id, data.payment_amount,
     data.utr_number || null, data.payment_date, data.payment_proof || null,
     data.remarks || null, data.created_by]
  );

  // Update commission paid/pending amounts
  await query(
    `UPDATE ooktravel_commissions
     SET paid_amount    = paid_amount    + ?,
         pending_amount = pending_amount - ?,
         status = CASE
           WHEN (pending_amount - ?) <= 0 THEN 'paid'
           ELSE 'partial'
         END
     WHERE id = ?`,
    [data.payment_amount, data.payment_amount, data.payment_amount, data.commission_id]
  );

  return result.insertId;
}

async function getPaymentsByCommission(commissionId) {
  return query(
    `SELECT cp.*, adm.full_name AS created_by_name
     FROM ooktravel_commission_payments cp
     LEFT JOIN ooktravel_admins adm ON adm.id = cp.created_by
     WHERE cp.commission_id = ? ORDER BY cp.created_at DESC`,
    [commissionId]
  );
}

async function summaryStats() {
  return queryOne(
    `SELECT
       COALESCE(SUM(commission_amount), 0) AS total_payable,
       COALESCE(SUM(paid_amount),       0) AS total_paid,
       COALESCE(SUM(pending_amount),    0) AS total_pending
     FROM ooktravel_commissions`
  );
}

async function currentMonthCommission() {
  return queryOne(
    `SELECT COALESCE(SUM(commission_amount), 0) AS current_month
     FROM ooktravel_commissions
     WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`
  );
}

module.exports = {
  createCommission, findById, findAll, agentLedger, allAgentLedgers,
  createPayment, getPaymentsByCommission, summaryStats, currentMonthCommission,
};
