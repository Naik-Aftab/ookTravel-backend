const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'ooktravel',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit:      0,
  timezone:        '+00:00',
  charset:         'utf8mb4',
});

// Force each session to UTC so NOW()/CURRENT_TIMESTAMP match the UTC values
// the app writes. Works on shared hosting too — unlike SET GLOBAL, this
// doesn't require SUPER/SYSTEM_VARIABLES_ADMIN privileges.
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('MySQL connected successfully');
    conn.release();
  } catch (err) {
    logger.error('MySQL connection failed:', err.message);
    throw err;
  }
}

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function transaction(callback) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, queryOne, transaction, testConnection };
