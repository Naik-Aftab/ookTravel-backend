const { query, queryOne } = require('../config/database');

async function create(phone, otp, purpose, expiresAt) {
  // Delete any existing unused OTPs for this phone+purpose before creating new one
  await query(
    `DELETE FROM ooktravel_otps WHERE phone = ? AND purpose = ? AND is_used = 0`,
    [phone, purpose]
  );
  const result = await query(
    `INSERT INTO ooktravel_otps (phone, otp, purpose, expires_at) VALUES (?, ?, ?, ?)`,
    [phone, otp, purpose, expiresAt]
  );
  return result.insertId;
}

async function findValid(phone, otp, purpose) {
  return queryOne(
    `SELECT * FROM ooktravel_otps
     WHERE phone = ? AND otp = ? AND purpose = ?
       AND is_used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp, purpose]
  );
}

async function findLatest(phone, purpose) {
  return queryOne(
    `SELECT * FROM ooktravel_otps
     WHERE phone = ? AND purpose = ? AND is_used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [phone, purpose]
  );
}

async function incrementAttempts(id) {
  return query(`UPDATE ooktravel_otps SET attempts = attempts + 1 WHERE id = ?`, [id]);
}

async function markUsed(id) {
  return query(`UPDATE ooktravel_otps SET is_used = 1 WHERE id = ?`, [id]);
}

async function findRecentlyVerified(phone, purpose, withinMinutes = 10) {
  return queryOne(
    `SELECT * FROM ooktravel_otps
     WHERE phone = ? AND purpose = ? AND is_used = 1
       AND created_at >= NOW() - INTERVAL ? MINUTE
     ORDER BY created_at DESC LIMIT 1`,
    [phone, purpose, withinMinutes]
  );
}

async function deleteExpired() {
  return query(`DELETE FROM ooktravel_otps WHERE expires_at < NOW()`);
}

module.exports = { create, findValid, findLatest, findRecentlyVerified, incrementAttempts, markUsed, deleteExpired };
