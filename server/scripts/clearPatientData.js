const pool = require('../config/db');

async function clearPatientData() {
  try {
    console.log('🧹 Clearing Patient Portal activity data (keeping profiles)...');

    // List of tables to clear (clinical and portal activity)
    const tablesToClear = [
      'appointments',
      'prescriptions',
      'lab_reports',
      'vitals',
      'billing',
      'patient_portal_messages',
      'notifications'
    ];

    // Disable foreign key checks to allow clearing tables in any order
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tablesToClear) {
      try {
        // Check if table exists before trying to clear
        const [exists] = await pool.query(`SHOW TABLES LIKE '${table}'`);
        if (exists.length > 0) {
          console.log(`🗑️  Clearing data from ${table}...`);
          await pool.query(`DELETE FROM ${table}`);
          // Reset auto-increment
          await pool.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        }
      } catch (tableErr) {
        console.warn(`⚠️  Could not clear table ${table}: ${tableErr.message}`);
      }
    }

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ All activity data cleared. Patient profiles remain intact!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing patient data:', err);
    process.exit(1);
  }
}

clearPatientData();
