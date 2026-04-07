const pool = require('../config/db');

async function fixSchema() {
  try {
    console.log('--- Fixing Database Schema ---');
    
    // Fix billing table
    await pool.query(`
      ALTER TABLE billing 
      ADD COLUMN IF NOT EXISTS doctor_id INT AFTER appointment_id,
      ADD COLUMN IF NOT EXISTS items JSON AFTER total_amount
    `);
    console.log('✅ Billing table updated with doctor_id and items');

    // Fix ward ENUM in beds table
    await pool.query(`
      ALTER TABLE beds 
      MODIFY COLUMN ward ENUM('General','ICU','Semi-Private','Private','Pediatrics','Maternity','Surgical','Emergency') DEFAULT 'General'
    `);
    console.log('✅ Beds table updated with new ward types');

    console.log('--- Schema Fix Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing schema:', err.message);
    process.exit(1);
  }
}

fixSchema();
