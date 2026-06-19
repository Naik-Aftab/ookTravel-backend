const { query, queryOne } = require('../config/database');

async function create(data) {
  const result = await query(
    `INSERT INTO ooktravel_notifications (user_type, user_id, title, message, type, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.user_type, data.user_id, data.title, data.message,
     data.type || null, data.entity_type || null, data.entity_id || null]
  );
  return result.insertId;
}

async function findByUser(userType, userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const countRow = await queryOne(
    'SELECT COUNT(*) AS total FROM ooktravel_notifications WHERE user_type = ? AND user_id = ?',
    [userType, userId]
  );
  const rows = await query(
    `SELECT * FROM ooktravel_notifications
     WHERE user_type = ? AND user_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userType, userId, limit, offset]
  );
  return { rows, total: countRow.total };
}

async function markRead(id, userType, userId) {
  return query(
    'UPDATE ooktravel_notifications SET is_read = 1 WHERE id = ? AND user_type = ? AND user_id = ?',
    [id, userType, userId]
  );
}

async function markAllRead(userType, userId) {
  return query(
    'UPDATE ooktravel_notifications SET is_read = 1 WHERE user_type = ? AND user_id = ?',
    [userType, userId]
  );
}

async function unreadCount(userType, userId) {
  const row = await queryOne(
    'SELECT COUNT(*) AS count FROM ooktravel_notifications WHERE user_type = ? AND user_id = ? AND is_read = 0',
    [userType, userId]
  );
  return row.count;
}

module.exports = { create, findByUser, markRead, markAllRead, unreadCount };
