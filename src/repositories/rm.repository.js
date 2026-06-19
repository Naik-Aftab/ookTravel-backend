const { query, queryOne } = require('../config/database');

async function create(data) {
  const { full_name, email, mobile, password } = data;
  const result = await query(
    'INSERT INTO ooktravel_rms (full_name, email, mobile, password) VALUES (?, ?, ?, ?)',
    [full_name, email, mobile, password]
  );
  return result.insertId;
}

async function findById(id) {
  return queryOne(
    `SELECT r.*, a.full_name AS approved_by_name,
       (SELECT COUNT(*) FROM ooktravel_agents ag WHERE ag.assigned_rm_id = r.id) AS agent_count
     FROM ooktravel_rms r
     LEFT JOIN ooktravel_admins a ON a.id = r.approved_by
     WHERE r.id = ?`, [id]
  );
}

async function findByEmail(email) {
  return queryOne('SELECT * FROM ooktravel_rms WHERE email = ?', [email]);
}

async function findAll({ status, search, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (search) {
    where += ' AND (r.full_name LIKE ? OR r.email LIKE ? OR r.mobile LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countRow = await queryOne(`SELECT COUNT(*) AS total FROM ooktravel_rms r WHERE ${where}`, params);
  const rows     = await query(
    `SELECT r.id, r.full_name, r.email, r.mobile, r.status, r.last_login, r.created_at,
       (SELECT COUNT(*) FROM ooktravel_agents ag WHERE ag.assigned_rm_id = r.id) AS agent_count
     FROM ooktravel_rms r WHERE ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total: countRow.total };
}

async function updateStatus(id, status, approvedBy = null) {
  if (status === 'active' && approvedBy) {
    return query('UPDATE ooktravel_rms SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?', [status, approvedBy, id]);
  }
  return query('UPDATE ooktravel_rms SET status = ? WHERE id = ?', [status, id]);
}

async function update(id, data) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  return query(`UPDATE ooktravel_rms SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
}

async function updatePassword(id, hashedPassword) {
  return query('UPDATE ooktravel_rms SET password = ? WHERE id = ?', [hashedPassword, id]);
}

async function updateLastLogin(id) {
  return query('UPDATE ooktravel_rms SET last_login = NOW() WHERE id = ?', [id]);
}

async function saveRefreshToken(id, token) {
  return query('UPDATE ooktravel_rms SET refresh_token = ? WHERE id = ?', [token, id]);
}

async function deleteById(id) {
  return query('DELETE FROM ooktravel_rms WHERE id = ?', [id]);
}

module.exports = { create, findById, findByEmail, findAll, updateStatus, update, updatePassword, updateLastLogin, saveRefreshToken, deleteById };
