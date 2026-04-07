const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function clearDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const conn = await pool.getConnection();
    console.log('Connected to DB. Clearing data...');

    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Truncate tables related to records
    const tablesToTruncate = [
      'appointments',
      'prescriptions',
      'lab_reports',
      'vitals',
      'billing',
      'notifications',
      'patient_portal',
      'patient_portal_messages',
      'otp_verifications'
    ];

    for (const table of tablesToTruncate) {
      await conn.query(`TRUNCATE TABLE ${table};`);
      console.log(`Truncated table: ${table}`);
    }

    // Delete patients
    await conn.query('DELETE FROM patients;');
    console.log('Cleared patients data.');

    // Remove patient users
    await conn.query(`DELETE FROM users WHERE role NOT IN ('admin', 'doctor', 'receptionist');`);
    console.log('Cleared patient users.');

    // Reset beds
    await conn.query('UPDATE beds SET occupied = 0, patient_id = NULL;');
    console.log('Reset beds.');

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('✅ Database cleared successfully, keeping doctors and staff.');
    conn.release();
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    await pool.end();
  }
}

clearDatabase();
