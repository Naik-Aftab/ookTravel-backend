const { query, queryOne } = require('../config/database');

async function create({ admin_id, title, message, category, target_type, target_meta, recipient_count }) {
  const result = await query(
    `INSERT INTO ooktravel_notification_batches
       (admin_id, title, message, category, target_type, target_meta, recipient_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [admin_id, title, message, category, target_type, target_meta || null, recipient_count]
  );
  return result.insertId;
}

async function updatePushCounts(id, { sent, failed }) {
  return query(
    'UPDATE ooktravel_notification_batches SET push_sent_count = ?, push_failed_count = ? WHERE id = ?',
    [sent, failed, id]
  );
}

async function findAll({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const countRow = await queryOne('SELECT COUNT(*) AS total FROM ooktravel_notification_batches');
  const rows = await query(
    `SELECT b.*, a.full_name AS sent_by_name
     FROM ooktravel_notification_batches b
     LEFT JOIN ooktravel_admins a ON a.id = b.admin_id
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return { rows, total: countRow.total };
}

module.exports = { create, updatePushCounts, findAll };
