const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db',
  });

  try {
    console.log('Adding email column to otp_verifications...');
    await connection.query('ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS email VARCHAR(150)');
    await connection.query('ALTER TABLE otp_verifications MODIFY COLUMN phone VARCHAR(20) NULL');
    await connection.query('CREATE INDEX IF NOT EXISTS idx_email ON otp_verifications(email)');
    
    console.log('Success! Database updated.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error updating database:', err.message);
    }
  } finally {
    await connection.end();
  }
}

updateDatabase();
