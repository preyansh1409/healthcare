const { pool } = require('../config/db.js');
const bcrypt = require('bcryptjs');

async function resetReceptionist() {
  try {
    const hashedPassword = await bcrypt.hash('receptionist123', 10);
    const email = 'nurse@hospital.com';
    
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    console.log(`✅ Password for ${email} reset to: receptionist123`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting receptionist:', err.message);
    process.exit(1);
  }
}

resetReceptionist();
