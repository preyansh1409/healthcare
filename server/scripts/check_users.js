const { pool } = require('../config/db.js');

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT name, email, role FROM users');
    console.log('👤 Users in database:');
    if (rows.length === 0) {
      console.log('❌ No users found!');
    } else {
      rows.forEach(row => {
        console.log(`- ${row.name} (${row.email}) [${row.role}]`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking users:', err.message);
    process.exit(1);
  }
}

checkUsers();
