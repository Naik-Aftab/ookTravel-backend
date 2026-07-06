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
       COALESCE(SUM(c.commission_amount), 0) AS commission_earned
     FROM ooktravel_agents a
     LEFT JOIN ooktravel_commissions c ON c.agent_id = a.id
     WHERE a.id = ?
     GROUP BY a.id`, [agentId]
  );
}

async function agentMonthlyLedgers({ page = 1, limit = 20, search, status } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (a.full_name LIKE ? OR a.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  let havingClause = '';
  if (status === 'paid') {
    havingClause = 'HAVING month_status = \'paid\'';
  } else if (status === 'unpaid') {
    havingClause = 'HAVING month_status = \'unpaid\'';
  }

  const countRow = await queryOne(
    `SELECT COUNT(*) AS total FROM (
       SELECT a.id
       FROM ooktravel_agents a
       INNER JOIN ooktravel_commissions c ON c.agent_id = a.id
       WHERE ${where}
       GROUP BY a.id, DATE_FORMAT(c.created_at, '%Y-%m')
       ${havingClause}
     ) AS sub`,
    params
  );

  const rows = await query(
    `SELECT
       a.id AS agent_id,
       a.full_name,
       a.email,
       DATE_FORMAT(c.created_at, '%Y-%m') AS month_key,
       DATE_FORMAT(c.created_at, '%M %Y') AS month_label,
       COUNT(c.id) AS policy_count,
       COALESCE(SUM(c.premium_amount), 0) AS total_premium,
       COALESCE(SUM(c.commission_amount), 0) AS commission_amount,
       CASE
         WHEN COUNT(c.id) = SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END) THEN 'paid'
         ELSE 'unpaid'
       END AS month_status
     FROM ooktravel_agents a
     INNER JOIN ooktravel_commissions c ON c.agent_id = a.id
     WHERE ${where}
     GROUP BY a.id, DATE_FORMAT(c.created_at, '%Y-%m')
     ${havingClause}
     ORDER BY a.full_name ASC, month_key DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function updateAgentMonthStatus(agentId, monthKey, status) {
  const dbStatus  = status === 'paid' ? 'paid' : 'pending';
  await query(
    `UPDATE ooktravel_commissions
     SET
       status         = ?,
       paid_amount    = CASE WHEN ? = 'paid' THEN commission_amount ELSE 0 END,
       pending_amount = CASE WHEN ? = 'paid' THEN 0 ELSE commission_amount END
     WHERE agent_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
    [dbStatus, status, status, agentId, monthKey]
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
  createCommission, findById, findAll,
  agentLedger, agentMonthlyLedgers, updateAgentMonthStatus,
  summaryStats, currentMonthCommission,
};
