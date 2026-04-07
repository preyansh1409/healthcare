const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function verifyDB() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db',
    connectionLimit: 1,
  });

  const [patients] = await pool.query('SELECT COUNT(*) as count FROM patients');
  const [users] = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
  const [doctors] = await pool.query('SELECT COUNT(*) as count FROM doctors');
  console.log(`Patients: ${patients[0].count}`);
  console.log(`Users by role: `, users);
  console.log(`Doctors: ${doctors[0].count}`);
  pool.end();
}
verifyDB();
