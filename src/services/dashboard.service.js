const { query, queryOne } = require('../config/database');

async function adminStats() {
  const [agents, rms, policies, requests, commissions] = await Promise.all([
    queryOne('SELECT COUNT(*) AS total, SUM(status="active") AS active, SUM(status="pending") AS pending, SUM(status="suspended") AS suspended FROM ooktravel_agents'),
    queryOne('SELECT COUNT(*) AS total, SUM(status="active") AS active, SUM(status="pending") AS pending FROM ooktravel_rms'),
    queryOne('SELECT COUNT(*) AS total, COALESCE(SUM(premium_amount), 0) AS revenue FROM ooktravel_policies'),
    queryOne('SELECT COUNT(*) AS total, SUM(status="submitted") AS submitted, SUM(status="assigned") AS assigned, SUM(status="under_review") AS under_review, SUM(status="issued") AS issued, SUM(status="claimed") AS claimed, SUM(status="rejected") AS rejected FROM ooktravel_policy_requests'),
    queryOne('SELECT COALESCE(SUM(commission_amount), 0) AS total_payable, COALESCE(SUM(paid_amount), 0) AS total_paid, COALESCE(SUM(pending_amount), 0) AS total_pending FROM ooktravel_commissions'),
  ]);

  return {
    total_agents:      agents.total,
    active_agents:     agents.active,
    pending_agents:    agents.pending,
    suspended_agents:  agents.suspended,
    total_rms:         rms.total,
    active_rms:        rms.active,
    pending_rms:       rms.pending,
    total_policies:    policies.total,
    total_revenue:     policies.revenue,
    total_requests:    requests.total,
    pending_requests:  parseInt(requests.submitted) + parseInt(requests.assigned) + parseInt(requests.under_review),
    issued_policies:   requests.issued,
    claimed_policies:  requests.claimed,
    rejected_requests: requests.rejected,
    commission_payable: commissions.total_payable,
    commission_paid:   commissions.total_paid,
    commission_pending: commissions.total_pending,
  };
}

async function monthlyRevenue() {
  return query(
    `SELECT DATE_FORMAT(issue_date, '%Y-%m') AS month,
       COUNT(*) AS policies_count,
       COALESCE(SUM(premium_amount), 0) AS revenue
     FROM ooktravel_policies
     WHERE issue_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`
  );
}

async function monthlyPolicies() {
  return query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM ooktravel_policy_requests
     WHERE status = 'issued' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`
  );
}

async function agentGrowth() {
  return query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS new_agents
     FROM ooktravel_agents
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`
  );
}

async function rmPerformance() {
  return query(
    `SELECT rm.id, rm.full_name,
       COUNT(DISTINCT ag.id)  AS agent_count,
       COUNT(DISTINCT p.id)   AS policies_issued,
       COALESCE(SUM(p.premium_amount), 0) AS revenue
     FROM ooktravel_rms rm
     LEFT JOIN ooktravel_agents  ag ON ag.assigned_rm_id = rm.id
     LEFT JOIN ooktravel_policies p ON p.rm_id = rm.id
     WHERE rm.status = 'active'
     GROUP BY rm.id ORDER BY revenue DESC LIMIT 10`
  );
}

async function commissionTrend() {
  return query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       COALESCE(SUM(commission_amount), 0) AS total_commission,
       COALESCE(SUM(paid_amount),       0) AS paid,
       COALESCE(SUM(pending_amount),    0) AS pending
     FROM ooktravel_commissions
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month`
  );
}

async function rmStats(rmId) {
  const [agents, requests, policies, claims] = await Promise.all([
    queryOne('SELECT COUNT(*) AS total FROM ooktravel_agents WHERE assigned_rm_id = ?', [rmId]),
    queryOne('SELECT COUNT(*) AS total, SUM(status IN ("submitted","assigned","under_review")) AS pending FROM ooktravel_policy_requests WHERE rm_id = ?', [rmId]),
    queryOne(`SELECT COUNT(*) AS total, COALESCE(SUM(premium_amount), 0) AS revenue,
       SUM(DATE(issue_date) = CURDATE()) AS today_count,
       SUM(MONTH(issue_date) = MONTH(NOW()) AND YEAR(issue_date) = YEAR(NOW())) AS monthly_count
     FROM ooktravel_policies WHERE rm_id = ?`, [rmId]),
    queryOne('SELECT COUNT(*) AS total FROM ooktravel_policy_requests WHERE rm_id = ? AND status = "claimed"', [rmId]),
  ]);

  return {
    assigned_agents:   agents.total,
    new_requests:      requests.total,
    pending_requests:  requests.pending,
    policies_today:    policies.today_count,
    monthly_revenue:   policies.revenue,
    claims_raised:     claims.total,
  };
}

async function auditLogs(filters) {
  const auditRepo = require('../repositories/audit.repository');
  return auditRepo.findAll(filters);
}

module.exports = { adminStats, monthlyRevenue, monthlyPolicies, agentGrowth, rmPerformance, commissionTrend, rmStats, auditLogs };
