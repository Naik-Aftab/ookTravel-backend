const { query, queryOne } = require('../config/database');

async function findByEmail(email) {
  return queryOne('SELECT * FROM ooktravel_admins WHERE email = ?', [email]);
}

async function findById(id) {
  return queryOne('SELECT id, full_name, email, role, is_active, last_login, created_at FROM ooktravel_admins WHERE id = ?', [id]);
}

async function updateLastLogin(id) {
  return query('UPDATE ooktravel_admins SET last_login = NOW() WHERE id = ?', [id]);
}

async function updateResetToken(id, token, expiry) {
  return query('UPDATE ooktravel_admins SET reset_token = ?, reset_token_exp = ? WHERE id = ?', [token, expiry, id]);
}

async function findByResetToken(token) {
  return queryOne('SELECT * FROM ooktravel_admins WHERE reset_token = ? AND reset_token_exp > NOW()', [token]);
}

async function updatePassword(id, hashedPassword) {
  return query('UPDATE ooktravel_admins SET password = ?, reset_token = NULL, reset_token_exp = NULL WHERE id = ?', [hashedPassword, id]);
}

module.exports = { findByEmail, findById, updateLastLogin, updateResetToken, findByResetToken, updatePassword };
