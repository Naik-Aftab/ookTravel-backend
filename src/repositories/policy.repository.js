const { query, queryOne } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

function generateRequestNumber() {
  return `OOK-REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function generatePolicyNumber() {
  return `OOK-POL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ── Policy Requests ──────────────────────────────────────────

async function createRequest(data) {

  console.log("request data",data)
  const request_number = generateRequestNumber();

  const details = data.traveller_details || {};
  const partner = details.pTrvPartnerDtls_inout || {};
  const travelerName = details.name ||
    [partner.firstname, partner.middlename, partner.lastname].filter(Boolean).join(' ') ||
    'Unknown';
  const travelerMobile = details.phone || partner.mobileNo || null;
  const travelerEmail  = details.email  || partner.email    || null;
  const travelerDetailsJson = typeof details === 'string' ? details : JSON.stringify(details);

  const msPerDay = 1000 * 60 * 60 * 24;
  const no_of_days = data.travel_date && data.return_date
    ? Math.max(1, Math.round((new Date(data.return_date) - new Date(data.travel_date)) / msPerDay) + 1)
    : null;

  const result = await query(
    `INSERT INTO ooktravel_policy_requests
       (request_number, agent_id, traveler_name, traveler_mobile, traveler_email,
        travel_date, return_date, num_travelers, plan_type, no_of_days,
        estimated_premium, payment_amount, payment_reference, payment_screenshot,
        traveller_details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request_number, data.agent_id, travelerName, travelerMobile, travelerEmail,
      data.travel_date, data.return_date, data.num_travelers || 1, data.plan_type || 'individual',
      no_of_days,
      data.estimated_premium || null, data.payment_amount || null,
      data.payment_reference || null, data.payment_screenshot || null,
      travelerDetailsJson,
    ]
  );
  return { insertId: result.insertId, request_number };
}

async function findRequestById(id) {
  return queryOne(
    `SELECT r.*, a.full_name AS agent_name, a.email AS agent_email, a.mobile AS agent_mobile,
       rm.full_name AS rm_name, rm.email AS rm_email
     FROM ooktravel_policy_requests r
     LEFT JOIN ooktravel_agents a ON a.id = r.agent_id
     LEFT JOIN ooktravel_rms    rm ON rm.id = r.rm_id
     WHERE r.id = ?`, [id]
  );
}

async function findAllRequests({ status, rm_id, agent_id, search, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (status)   { where += ' AND r.status = ?';   params.push(status); }
  if (rm_id)    { where += ' AND r.rm_id = ?';    params.push(rm_id); }
  if (agent_id) { where += ' AND r.agent_id = ?'; params.push(agent_id); }
  if (search) {
    where += ' AND (r.request_number LIKE ? OR r.traveler_name LIKE ? OR a.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countRow = await queryOne(
    `SELECT COUNT(*) AS total FROM ooktravel_policy_requests r
     LEFT JOIN ooktravel_agents a ON a.id = r.agent_id WHERE ${where}`,
    params
  );
  const rows = await query(
    `SELECT r.id, r.request_number, r.traveler_name, r.travel_date, r.return_date,
       r.estimated_premium, r.payment_amount, r.status, r.plan_type, r.num_travelers, r.created_at,
       a.full_name AS agent_name, rm.full_name AS rm_name
     FROM ooktravel_policy_requests r
     LEFT JOIN ooktravel_agents a ON a.id = r.agent_id
     LEFT JOIN ooktravel_rms    rm ON rm.id = r.rm_id
     WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function updateRequestStatus(id, status, rmId = null, remarks = null) {
  let sql = 'UPDATE ooktravel_policy_requests SET status = ?';
  const params = [status];
  if (rmId)    { sql += ', rm_id = ?';   params.push(rmId); }
  if (remarks) { sql += ', remarks = ?'; params.push(remarks); }
  sql += ' WHERE id = ?';
  params.push(id);
  return query(sql, params);
}

// ── Policies ─────────────────────────────────────────────────

async function createPolicy(data) {
  const policy_number = data.policy_number || generatePolicyNumber();
  const result = await query(
    `INSERT INTO ooktravel_policies
       (policy_number, request_id, agent_id, rm_id, provider_name, plan_name,
        premium_amount, coverage_amount, issue_date, expiry_date, policy_pdf)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      policy_number, data.request_id, data.agent_id, data.rm_id,
      data.provider_name, data.plan_name, data.premium_amount,
      data.coverage_amount || null, data.issue_date, data.expiry_date,
      data.policy_pdf || null,
    ]
  );
  return { insertId: result.insertId, policy_number };
}

async function findPolicyById(id) {
  return queryOne(
    `SELECT p.*, a.full_name AS agent_name, rm.full_name AS rm_name,
       r.request_number, r.traveler_name
     FROM ooktravel_policies p
     LEFT JOIN ooktravel_agents           a ON a.id = p.agent_id
     LEFT JOIN ooktravel_rms             rm ON rm.id = p.rm_id
     LEFT JOIN ooktravel_policy_requests  r ON r.id = p.request_id
     WHERE p.id = ?`, [id]
  );
}

async function findAllPolicies({ agent_id, rm_id, status, search, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (agent_id) { where += ' AND p.agent_id = ?'; params.push(agent_id); }
  if (rm_id)    { where += ' AND p.rm_id = ?';    params.push(rm_id); }
  if (status)   { where += ' AND p.status = ?';   params.push(status); }
  if (search) {
    where += ' AND (p.policy_number LIKE ? OR p.provider_name LIKE ? OR a.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countRow = await queryOne(
    `SELECT COUNT(*) AS total FROM ooktravel_policies p
     LEFT JOIN ooktravel_agents a ON a.id = p.agent_id WHERE ${where}`,
    params
  );
  const rows = await query(
    `SELECT p.id, p.policy_number, p.provider_name, p.plan_name, p.premium_amount,
       p.issue_date, p.expiry_date, p.status, p.created_at,
       a.full_name AS agent_name, rm.full_name AS rm_name
     FROM ooktravel_policies p
     LEFT JOIN ooktravel_agents a ON a.id = p.agent_id
     LEFT JOIN ooktravel_rms   rm ON rm.id = p.rm_id
     WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function updatePolicyPdf(id, pdfPath) {
  return query('UPDATE ooktravel_policies SET policy_pdf = ? WHERE id = ?', [pdfPath, id]);
}

async function findPolicyByRequestId(requestId) {
  return queryOne('SELECT id, policy_number FROM ooktravel_policies WHERE request_id = ?', [requestId]);
}

// Returns issued policies for the app commission screen in IssuedPolicyRecord shape
async function findIssuedPoliciesByAgent(agentId) {
  return query(
    `SELECT p.id, p.policy_number AS uuid, p.premium_amount AS premium,
       p.plan_name AS product, p.created_at, p.updated_at,
       r.no_of_days, r.traveller_details
     FROM ooktravel_policies p
     LEFT JOIN ooktravel_policy_requests r ON r.id = p.request_id
     WHERE p.agent_id = ? AND p.status != 'cancelled'
     ORDER BY p.created_at DESC`,
    [agentId]
  );
}

module.exports = {
  createRequest, findRequestById, findAllRequests, updateRequestStatus,
  createPolicy, findPolicyById, findPolicyByRequestId, findAllPolicies, updatePolicyPdf,
  findIssuedPoliciesByAgent,
};
