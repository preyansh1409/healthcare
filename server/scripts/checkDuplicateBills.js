const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkBills() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db',
  });

  try {
    const [rows] = await pool.query("SELECT id, patient_id, appointment_id FROM billing ORDER BY id DESC LIMIT 5");
    console.log("LAST 5 BILLS:", rows);
    pool.end();
  } catch (err) {
    console.error(err);
  }
}

checkBills();
