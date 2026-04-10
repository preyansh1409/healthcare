const { pool } = require('../config/db.js');

async function checkTables() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('📋 Tables in database:');
    if (rows.length === 0) {
      console.log('❌ No tables found!');
    } else {
      rows.forEach(row => {
        console.log(`- ${Object.values(row)[0]}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
    process.exit(1);
  }
}

checkTables();
