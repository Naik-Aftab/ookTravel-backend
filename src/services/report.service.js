const { query, queryOne } = require('../config/database');

const PERIOD_LABELS = {
  this_month:   'This Month',
  last_month:   'Last Month',
  this_quarter: 'This Quarter',
  this_year:    'This Year',
};

function startOfMonth(d)   { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0); }
function endOfMonth(d)     { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }
function startOfQuarter(d) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); }
function endOfQuarter(d)   { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0, 23, 59, 59); }
function startOfYear(d)    { return new Date(d.getFullYear(), 0, 1); }
function endOfYear(d)      { return new Date(d.getFullYear(), 11, 31, 23, 59, 59); }

// Growth is measured against the equivalent immediately-preceding period (full previous
// month/quarter/year), even when the current period is still in progress (month/quarter/year
// to date) — this is the standard "vs last period" comparison for business reviews.
function periodRange(period) {
  const now = new Date();
  let from, to, prevFrom, prevTo;

  switch (period) {
    case 'last_month': {
      const cur  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prev = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      from = startOfMonth(cur);  to = endOfMonth(cur);
      prevFrom = startOfMonth(prev); prevTo = endOfMonth(prev);
      break;
    }
    case 'this_quarter': {
      from = startOfQuarter(now); to = now;
      const prevAnchor = new Date(from.getTime() - 86400000);
      prevFrom = startOfQuarter(prevAnchor); prevTo = endOfQuarter(prevAnchor);
      break;
    }
    case 'this_year': {
      from = startOfYear(now); to = now;
      const prevAnchor = new Date(now.getFullYear() - 1, 0, 1);
      prevFrom = startOfYear(prevAnchor); prevTo = endOfYear(prevAnchor);
      break;
    }
    case 'this_month':
    default: {
      from = startOfMonth(now); to = now;
      const prevAnchor = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevFrom = startOfMonth(prevAnchor); prevTo = endOfMonth(prevAnchor);
      break;
    }
  }

  return { label: PERIOD_LABELS[period] || PERIOD_LABELS.this_month, from, to, prevFrom, prevTo };
}

function sqlDate(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function growthPct(current, previous) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev > 0) return Number((((cur - prev) / prev) * 100).toFixed(1));
  return cur > 0 ? 100 : 0;
}

async function summary(period) {
  const { label, from, to, prevFrom, prevTo } = periodRange(period);
  const [current, previous, commission, newAgents, agentBreakdown] = await Promise.all([
    queryOne('SELECT COUNT(*) AS policies, COALESCE(SUM(premium_amount), 0) AS revenue FROM ooktravel_policies WHERE issue_date BETWEEN ? AND ?', [sqlDate(from), sqlDate(to)]),
    queryOne('SELECT COUNT(*) AS policies, COALESCE(SUM(premium_amount), 0) AS revenue FROM ooktravel_policies WHERE issue_date BETWEEN ? AND ?', [sqlDate(prevFrom), sqlDate(prevTo)]),
    queryOne(
      `SELECT COALESCE(SUM(c.commission_amount), 0) AS total, COALESCE(SUM(c.paid_amount), 0) AS paid, COALESCE(SUM(c.pending_amount), 0) AS pending
       FROM ooktravel_commissions c JOIN ooktravel_policies p ON p.id = c.policy_id
       WHERE p.issue_date BETWEEN ? AND ?`,
      [sqlDate(from), sqlDate(to)]
    ),
    queryOne('SELECT COUNT(*) AS total FROM ooktravel_agents WHERE created_at BETWEEN ? AND ?', [sqlDate(from), sqlDate(to)]),
    queryOne('SELECT COUNT(*) AS total, SUM(status = "active") AS active, SUM(status = "suspended") AS suspended FROM ooktravel_agents WHERE deleted_at IS NULL'),
  ]);

  return {
    period_label:       label,
    from:               sqlDate(from),
    to:                  sqlDate(to),
    total_revenue:       current.revenue,
    total_policies:      current.policies,
    revenue_growth_pct:  growthPct(current.revenue, previous.revenue),
    policies_growth_pct: growthPct(current.policies, previous.policies),
    commission_total:    commission.total,
    commission_paid:     commission.paid,
    commission_pending:  commission.pending,
    new_agents:          newAgents.total,
    active_agents:       agentBreakdown.active,
    suspended_agents:    agentBreakdown.suspended,
    total_agents:        agentBreakdown.total,
  };
}

async function rmPerformanceReport(period) {
  const { from, to, prevFrom, prevTo } = periodRange(period);

  // Agents and policies are both one-to-many against rm, so joining them directly in one
  // query would fan out (each policy row duplicated once per agent) and inflate the SUM()s.
  // Pre-aggregate each side in its own subquery first, then join those 1:1 onto rm.
  const rows = await query(
    `SELECT rm.id, rm.full_name, rm.email, rm.status,
       COALESCE(ac.agent_count, 0)        AS agent_count,
       COALESCE(pc.policies_issued, 0)    AS policies_issued,
       COALESCE(pc.revenue, 0)            AS revenue,
       COALESCE(pc.commission_amount, 0)  AS commission_amount,
       COALESCE(pc.commission_paid, 0)    AS commission_paid,
       COALESCE(pc.commission_pending, 0) AS commission_pending
     FROM ooktravel_rms rm
     LEFT JOIN (
       SELECT assigned_rm_id AS rm_id, COUNT(*) AS agent_count
       FROM ooktravel_agents
       WHERE deleted_at IS NULL
       GROUP BY assigned_rm_id
     ) ac ON ac.rm_id = rm.id
     LEFT JOIN (
       SELECT p.rm_id,
         COUNT(DISTINCT p.id) AS policies_issued,
         COALESCE(SUM(p.premium_amount), 0)    AS revenue,
         COALESCE(SUM(c.commission_amount), 0) AS commission_amount,
         COALESCE(SUM(c.paid_amount), 0)       AS commission_paid,
         COALESCE(SUM(c.pending_amount), 0)    AS commission_pending
       FROM ooktravel_policies p
       LEFT JOIN ooktravel_commissions c ON c.policy_id = p.id
       WHERE p.issue_date BETWEEN ? AND ?
       GROUP BY p.rm_id
     ) pc ON pc.rm_id = rm.id
     WHERE rm.status != 'suspended'
     ORDER BY revenue DESC`,
    [sqlDate(from), sqlDate(to)]
  );

  const prevRows = await query(
    `SELECT rm.id, COALESCE(SUM(p.premium_amount), 0) AS revenue
     FROM ooktravel_rms rm
     LEFT JOIN ooktravel_policies p ON p.rm_id = rm.id AND p.issue_date BETWEEN ? AND ?
     GROUP BY rm.id`,
    [sqlDate(prevFrom), sqlDate(prevTo)]
  );
  const prevMap = new Map(prevRows.map(r => [r.id, r.revenue]));

  return rows.map((r, i) => ({
    rank: i + 1,
    ...r,
    growth_pct: growthPct(r.revenue, prevMap.get(r.id) || 0),
  }));
}

async function agentPerformanceReport(period) {
  const { from, to, prevFrom, prevTo } = periodRange(period);

  const rows = await query(
    `SELECT ag.id, ag.full_name, ag.email, ag.status, ag.kyc_status, rm.full_name AS rm_name,
       COUNT(DISTINCT p.id) AS policies_issued,
       COALESCE(SUM(p.premium_amount), 0)   AS revenue,
       COALESCE(SUM(c.commission_amount), 0) AS commission_amount,
       COALESCE(SUM(c.paid_amount), 0)      AS commission_paid,
       COALESCE(SUM(c.pending_amount), 0)   AS commission_pending
     FROM ooktravel_agents ag
     LEFT JOIN ooktravel_rms rm ON rm.id = ag.assigned_rm_id
     LEFT JOIN ooktravel_policies p ON p.agent_id = ag.id AND p.issue_date BETWEEN ? AND ?
     LEFT JOIN ooktravel_commissions c ON c.policy_id = p.id
     WHERE ag.deleted_at IS NULL
     GROUP BY ag.id, ag.full_name, ag.email, ag.status, ag.kyc_status, rm.full_name
     ORDER BY revenue DESC`,
    [sqlDate(from), sqlDate(to)]
  );

  const prevRows = await query(
    `SELECT ag.id, COALESCE(SUM(p.premium_amount), 0) AS revenue
     FROM ooktravel_agents ag
     LEFT JOIN ooktravel_policies p ON p.agent_id = ag.id AND p.issue_date BETWEEN ? AND ?
     WHERE ag.deleted_at IS NULL
     GROUP BY ag.id`,
    [sqlDate(prevFrom), sqlDate(prevTo)]
  );
  const prevMap = new Map(prevRows.map(r => [r.id, r.revenue]));

  return rows.map((r, i) => ({
    rank: i + 1,
    ...r,
    growth_pct: growthPct(r.revenue, prevMap.get(r.id) || 0),
  }));
}

module.exports = { periodRange, summary, rmPerformanceReport, agentPerformanceReport };
