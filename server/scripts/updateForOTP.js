const pool = require('../config/db');

async function updateSchemaForOTP() {
  try {
    console.log('🔄 Adding OTP support to database...');

    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'phone'");
    if (cols.length === 0) {
      console.log('➕ Adding phone column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE AFTER email');
    }

    const createOtpTable = `
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (phone),
        INDEX (expires_at)
      )
    `;
    await pool.query(createOtpTable);
    console.log('✅ otp_verifications table created successfully!');

    console.log('🚀 Database schema updated for OTP!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

updateSchemaForOTP();
