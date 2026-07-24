const { query, queryOne } = require('../config/database');

async function findById(id) {
  return queryOne(
    `SELECT a.*, r.full_name AS rm_name, r.email AS rm_email
     FROM ooktravel_agents a
     LEFT JOIN ooktravel_rms r ON r.id = a.assigned_rm_id
     WHERE a.id = ?`, [id]
  );
}

async function findByEmail(email) {
  return queryOne('SELECT * FROM ooktravel_agents WHERE email = ?', [email]);
}

async function findAll({ status, rm_id, search, kyc_status, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (status)     { where += ' AND a.status = ?';     params.push(status); }
  if (rm_id)      { where += ' AND a.assigned_rm_id = ?'; params.push(rm_id); }
  if (kyc_status) { where += ' AND a.kyc_status = ?'; params.push(kyc_status); }
  if (search) {
    where += ' AND (a.full_name LIKE ? OR a.email LIKE ? OR a.mobile LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countRow = await queryOne(`SELECT COUNT(*) AS total FROM ooktravel_agents a WHERE ${where}`, params);
  const rows = await query(
    `SELECT a.id, a.full_name, a.email, a.mobile, a.pan, a.profile_photo,
       a.kyc_status, a.status, a.assigned_rm_id, a.created_at,
       r.full_name AS rm_name
     FROM ooktravel_agents a
     LEFT JOIN ooktravel_rms r ON r.id = a.assigned_rm_id
     WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function findByRmId(rmId) {
  return query(
    `SELECT a.id, a.full_name, a.email, a.mobile, a.profile_photo, a.status, a.kyc_status, a.created_at
     FROM ooktravel_agents a WHERE a.assigned_rm_id = ? ORDER BY a.full_name`,
    [rmId]
  );
}

async function assignRm(agentId, rmId) {
  return query('UPDATE ooktravel_agents SET assigned_rm_id = ? WHERE id = ?', [rmId, agentId]);
}

async function assignAllToRm(rmId) {
  return query('UPDATE ooktravel_agents SET assigned_rm_id = ?', [rmId]);
}

async function updateStatus(id, status) {
  return query('UPDATE ooktravel_agents SET status = ? WHERE id = ?', [status, id]);
}

async function updateKycStatus(id, kyc_status) {
  return query('UPDATE ooktravel_agents SET kyc_status = ? WHERE id = ?', [kyc_status, id]);
}

async function update(id, data) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  return query(`UPDATE ooktravel_agents SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
}

async function updateLastLogin(id) {
  return query('UPDATE ooktravel_agents SET last_login = NOW() WHERE id = ?', [id]);
}

async function saveRefreshToken(id, token) {
  return query('UPDATE ooktravel_agents SET refresh_token = ? WHERE id = ?', [token, id]);
}

async function create(data) {
  const { full_name, email, mobile, password } = data;
  const result = await query(
    `INSERT INTO ooktravel_agents (full_name, email, mobile, password, status, kyc_status)
     VALUES (?, ?, ?, ?, 'pending', 'pending')`,
    [full_name, email, mobile, password]
  );
  return result.insertId;
}

async function findByMobile(mobile) {
  return queryOne('SELECT * FROM ooktravel_agents WHERE mobile = ?', [mobile]);
}

async function findByEmailOrMobile(identifier) {
  return queryOne('SELECT * FROM ooktravel_agents WHERE email = ? OR mobile = ?', [identifier, identifier]);
}

async function saveBankDetails(id, data) {
  // Document paths are only passed in when a file was actually uploaded on this request —
  // COALESCE keeps the previously stored file when an edit doesn't re-upload every document.
  return query(
    `UPDATE ooktravel_agents SET
       account_holder_name = ?,
       bank_name           = ?,
       bank_account        = ?,
       bank_ifsc            = ?,
       aadhar_number        = ?,
       pan                  = ?,
       bank_document        = COALESCE(?, bank_document),
       aadhar_document      = COALESCE(?, aadhar_document),
       pan_document         = COALESCE(?, pan_document)
     WHERE id = ?`,
    [
      data.account_holder_name,
      data.bank_name,
      data.account_number,
      data.ifsc_code,
      data.aadhar_number,
      data.pan_card_number,
      data.bank_document || null,
      data.aadhar_document || null,
      data.pan_document || null,
      id,
    ]
  );
}

async function getBankDetails(id) {
  return queryOne(
    `SELECT id, account_holder_name, bank_name, bank_account AS account_number,
            bank_ifsc AS ifsc_code, aadhar_number, pan AS pan_card_number,
            bank_document, aadhar_document, pan_document
     FROM ooktravel_agents WHERE id = ?`,
    [id]
  );
}

async function updatePassword(id, hashedPassword) {
  return query('UPDATE ooktravel_agents SET password = ? WHERE id = ?', [hashedPassword, id]);
}

async function updateDetails(id, { full_name, email, mobile }) {
  return query(
    'UPDATE ooktravel_agents SET full_name = ?, email = ?, mobile = ? WHERE id = ?',
    [full_name, email, mobile, id]
  );
}

async function updateProfilePhoto(id, photoPath) {
  return query('UPDATE ooktravel_agents SET profile_photo = ? WHERE id = ?', [photoPath, id]);
}

async function findByEmailExcluding(email, excludeId) {
  return queryOne('SELECT id FROM ooktravel_agents WHERE email = ? AND id != ?', [email, excludeId]);
}

async function findByMobileExcluding(mobile, excludeId) {
  return queryOne('SELECT id FROM ooktravel_agents WHERE mobile = ? AND id != ?', [mobile, excludeId]);
}

async function softDeleteAccount(id, unusablePasswordHash) {
  const anonymizedEmail  = `deleted_agent_${id}@ooktravel.invalid`;
  const anonymizedMobile = `del${id}`.slice(0, 15);

  return query(
    `UPDATE ooktravel_agents SET
       full_name           = 'Deleted User',
       email                = ?,
       mobile               = ?,
       password             = ?,
       pan                  = NULL,
       bank_name            = NULL,
       bank_account         = NULL,
       bank_ifsc            = NULL,
       aadhar_number        = NULL,
       account_holder_name  = NULL,
       profile_photo        = NULL,
       pan_document         = NULL,
       bank_document        = NULL,
       aadhar_document      = NULL,
       refresh_token        = NULL,
       status               = 'suspended',
       deleted_at           = NOW()
     WHERE id = ?`,
    [anonymizedEmail, anonymizedMobile, unusablePasswordHash, id]
  );
}

async function findAssignedRm(agentId) {
  return queryOne(
    `SELECT r.full_name, r.mobile, r.email
     FROM ooktravel_agents a
     JOIN ooktravel_rms r ON r.id = a.assigned_rm_id
     WHERE a.id = ?`,
    [agentId]
  );
}

module.exports = { create, findById, findByEmail, findByMobile, findByEmailOrMobile, findByEmailExcluding, findByMobileExcluding, findAll, findByRmId, assignRm, assignAllToRm, updateStatus, updateKycStatus, update, updateDetails, updateProfilePhoto, saveBankDetails, getBankDetails, updateLastLogin, saveRefreshToken, updatePassword, findAssignedRm, softDeleteAccount };
