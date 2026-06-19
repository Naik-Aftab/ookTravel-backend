require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db     = require('../src/config/database');

async function main() {
  const password = 'Admin@123';
  const hash     = await bcrypt.hash(password, 12);

  const result = await db.query(
    `UPDATE ooktravel_admins SET password = ? WHERE email = 'admin@ooktravel.com'`,
    [hash]
  );

  if (result.affectedRows === 0) {
    // Admin row not found — insert it
    await db.query(
      `INSERT INTO ooktravel_admins (full_name, email, password, role)
       VALUES ('Super Admin', 'admin@ooktravel.com', ?, 'super_admin')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [hash]
    );
    console.log('Admin user created with password: Admin@123');
  } else {
    console.log('Admin password reset to: Admin@123');
  }

  process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });
