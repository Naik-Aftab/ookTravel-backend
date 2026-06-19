const { query, queryOne } = require('../config/database');

async function log(data) {
  return query(
    `INSERT INTO ooktravel_audit_logs
       (user_type, user_id, user_name, action, entity_type, entity_id, old_values, new_values, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.user_type, data.user_id, data.user_name || null, data.action,
      data.entity_type || null, data.entity_id || null,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
      data.ip_address || null,
    ]
  );
}

async function findAll({ user_type, action, entity_type, page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];

  if (user_type)   { where += ' AND user_type = ?';   params.push(user_type); }
  if (action)      { where += ' AND action LIKE ?';   params.push(`%${action}%`); }
  if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }

  const countRow = await queryOne(`SELECT COUNT(*) AS total FROM ooktravel_audit_logs WHERE ${where}`, params);
  const rows = await query(
    `SELECT * FROM ooktravel_audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { rows, total: countRow.total };
}

module.exports = { log, findAll };
