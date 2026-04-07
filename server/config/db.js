const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'healthcare_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(async conn => {
    console.log('✅ MySQL connected via XAMPP');

    // Auto-migration for schema updates
    try {
      // Create OTP table if not exists
      await conn.query(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(20),
          email VARCHAR(150),
          otp_code VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_verified TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (phone),
          INDEX (email)
        )
      `);

      // OTP email support
      await conn.query(`
        ALTER TABLE otp_verifications 
        ADD COLUMN IF NOT EXISTS email VARCHAR(150),
        MODIFY COLUMN phone VARCHAR(20) NULL,
        ADD INDEX IF NOT EXISTS idx_email (email)
      `);

      // Patient details support
      await conn.query(`
        ALTER TABLE patients 
        ADD COLUMN IF NOT EXISTS birth_date DATE NULL,
        ADD COLUMN IF NOT EXISTS email VARCHAR(150) NULL,
        ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) NULL
      `);

      // Appointment status update for patient requests
      await conn.query(`
        ALTER TABLE appointments 
        MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'requested', 'checked_in') DEFAULT 'pending'
      `);

      // Billing doctor tracking
      await conn.query(`
        ALTER TABLE billing 
        ADD COLUMN IF NOT EXISTS doctor_id INT NULL,
        ADD INDEX IF NOT EXISTS idx_doctor (doctor_id)
      `);

      console.log('✅ Database schema verified (OTP email, Birth Date & Appointment Requests)');
    } catch (migErr) {
      const fs = require('fs');
      fs.appendFileSync('db_error_log.txt', `[${new Date().toISOString()}] Migration error: ${migErr.message}\n`);
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(migErr.code)) {
        console.warn('⚠️  Auto-migration notice:', migErr.message);
      }
    }

    conn.release();
  })
  .catch(err => {
    const fs = require('fs');
    fs.appendFileSync('db_error_log.txt', `[${new Date().toISOString()}] DB Connection Failed: ${err.message}\n`);
    console.error('❌ DB connection failed:', err.message);
  });

module.exports = pool;
