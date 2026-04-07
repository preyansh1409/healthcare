const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedPatient() {
  try {
    const password = 'Patient@123';
    const hashedPassword = await bcrypt.hash(password, 12);
    const email = 'patient@demo.com';

    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('Patient demo user already exists.');
      return;
    }

    // Insert into users table
    await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['Demo Patient', email, hashedPassword, 'patient', '9000000001']
    );

    console.log('Patient demo user seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding patient:', err);
    process.exit(1);
  }
}

seedPatient();
