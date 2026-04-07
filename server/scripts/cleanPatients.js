const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanPatientData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'healthcare_db'
  });

  try {
    console.log('--- Starting Database Cleanup (Patients Only) ---');
    
    // Disable FK checks to avoid issues during mass delete
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Delete patients (this triggers cascade in most tables)
    const [delPatients] = await connection.query('DELETE FROM patients');
    console.log(`- Deleted ${delPatients.affectedRows} patient records.`);

    // 2. Delete patient users
    const [delUsers] = await connection.query("DELETE FROM users WHERE role = 'patient'");
    console.log(`- Deleted ${delUsers.affectedRows} user accounts with 'patient' role.`);

    // 3. Clear all bed occupancies
    const [updateBeds] = await connection.query('UPDATE beds SET occupied = 0, patient_id = NULL');
    console.log(`- Reset ${updateBeds.affectedRows} beds to unoccupied.`);

    // 4. Manual cleanup for tables that might not have cascade or need specific clearing
    await connection.query('DELETE FROM appointments WHERE patient_id NOT IN (SELECT id FROM patients)');
    await connection.query('DELETE FROM billing WHERE patient_id NOT IN (SELECT id FROM patients)');
    await connection.query('DELETE FROM prescriptions WHERE patient_id NOT IN (SELECT id FROM patients)');
    await connection.query('DELETE FROM lab_reports WHERE patient_id NOT IN (SELECT id FROM patients)');
    await connection.query('DELETE FROM vitals WHERE patient_id NOT IN (SELECT id FROM patients)');
    await connection.query('DELETE FROM patient_portal WHERE patient_id NOT IN (SELECT id FROM patients)');

    // 5. Clean Blockchain Ledger (Remove patient-related blocks to avoid security alerts)
    // We keep USER_CREATE and DOCTOR_UPDATE since those users still exist.
    const [delLedger] = await connection.query(`
      DELETE FROM blockchain_ledger 
      WHERE data LIKE '%"type":"PRESCRIPTION"%'
         OR data LIKE '%"type":"ADMISSION"%'
         OR data LIKE '%"type":"BILL_CREATE"%'
         OR data LIKE '%"type":"APPOINTMENT_CREATE"%'
         OR data LIKE '%"type":"PATIENT_CREATE"%'
         OR data LIKE '%"type":"PATIENT_UPDATE"%'
    `);
    console.log(`- Removed ${delLedger.affectedRows} patient-related blocks from Blockchain Ledger.`);

    // 6. Re-enable FK checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Cleanup complete. Doctors, Admins, and Receptionists remain untouched.');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await connection.end();
    process.exit();
  }
}

cleanPatientData();
