const pool = require('../config/db');

async function seedTestPatient() {
  try {
    const phone = '9000000001';
    
    // Check if patient exists
    const [existing] = await pool.query('SELECT * FROM patients WHERE phone = ?', [phone]);
    if (existing.length === 0) {
      console.log('➕ Creating test patient record...');
      await pool.query(
        'INSERT INTO patients (name, age, gender, phone, email, address, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Test Patient', 30, 'Male', phone, 'testpatient@demo.com', '123 Health St', 'O+']
      );
      console.log('✅ Test patient created!');
    } else {
      console.log('ℹ️  Test patient with phone 9000000001 already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding test patient:', err);
    process.exit(1);
  }
}

seedTestPatient();
