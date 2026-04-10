const { pool } = require('../config/db.js');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // Update existing admin or create if missing
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@hospital.com']);
    
    if (rows.length > 0) {
      await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, 'admin@hospital.com']);
      console.log('✅ Password for admin@hospital.com reset to: admin123');
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['System Admin', 'admin@hospital.com', hashedPassword, 'admin', '1234567890']
      );
      console.log('✅ New Admin created: admin@hospital.com / admin123');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting admin:', err.message);
    process.exit(1);
  }
}

resetAdmin();
