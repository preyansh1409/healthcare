const { pool } = require('../config/db.js');
const bcrypt = require('bcryptjs');

async function resetDoctor() {
  try {
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    const email = 'amit.doctor@hospital.com';
    
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    console.log(`✅ Password for ${email} reset to: doctor123`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting doctor:', err.message);
    process.exit(1);
  }
}

resetDoctor();
