const { pool } = require('../config/db.js');
const bcrypt = require('bcryptjs');

async function resetAllDoctors() {
  try {
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    
    // Find all doctors
    const [doctors] = await pool.query('SELECT email, name FROM users WHERE role = "doctor"');
    
    console.log(`🩺 Found ${doctors.length} doctors. Resetting passwords to: doctor123`);
    
    for (const doc of doctors) {
      await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, doc.email]);
      console.log(`✅ Reset: ${doc.name} (${doc.email})`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting doctors:', err.message);
    process.exit(1);
  }
}

resetAllDoctors();
