const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false, // Set to false to allow connection without CA file for now
  },
});

let isInitialized = false;

async function initDB() {
  if (isInitialized) return;
  
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ Connected to TiDB Cloud');

    // USERS
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'doctor', 'receptionist', 'patient') NOT NULL DEFAULT 'patient',
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // DOCTORS
    await conn.query(`CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      specialization VARCHAR(100) DEFAULT 'General',
      department VARCHAR(100) DEFAULT 'General',
      available TINYINT(1) DEFAULT 1,
      shift_start TIME DEFAULT '09:00:00',
      shift_end TIME DEFAULT '17:00:00',
      consultation_fee DECIMAL(10,2) DEFAULT 500.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // PATIENTS
    await conn.query(`CREATE TABLE IF NOT EXISTS patients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      name VARCHAR(150) NOT NULL,
      age INT NOT NULL DEFAULT 0,
      gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(150),
      birth_date DATE,
      address TEXT,
      blood_group VARCHAR(10),
      allergies TEXT,
      emergency_contact VARCHAR(200),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`);

    // APPOINTMENTS
    await conn.query(`CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      doctor_id INT NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      shift ENUM('morning', 'evening') DEFAULT 'morning',
      reason TEXT,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'requested', 'checked_in') DEFAULT 'pending',
      notes TEXT,
      booked_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL
    )`);

    // PRESCRIPTIONS
    await conn.query(`CREATE TABLE IF NOT EXISTS prescriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      doctor_id INT NOT NULL,
      appointment_id INT,
      diagnosis VARCHAR(500) NOT NULL,
      medications JSON,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    )`);

    // BEDS
    await conn.query(`CREATE TABLE IF NOT EXISTS beds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bed_number VARCHAR(20) NOT NULL,
      ward ENUM('General','ICU','Semi-Private','Private','Pediatrics','Maternity','Surgical','Emergency') DEFAULT 'General',
      occupied TINYINT(1) DEFAULT 0,
      patient_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    )`);

    // LAB REPORTS
    await conn.query(`CREATE TABLE IF NOT EXISTS lab_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      report_type VARCHAR(100) NOT NULL,
      report_date DATE NOT NULL,
      details TEXT,
      uploaded_by INT,
      status ENUM('pending', 'analyzed') DEFAULT 'pending',
      ai_summary TEXT,
      ai_anomalies JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )`);

    // BILLING
    await conn.query(`CREATE TABLE IF NOT EXISTS billing (
      id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      appointment_id INT,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax DECIMAL(10,2) DEFAULT 0.00,
      discount DECIMAL(10,2) DEFAULT 0.00,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status ENUM('unpaid', 'paid', 'partially_paid') DEFAULT 'unpaid',
      payment_method ENUM('cash', 'card', 'online', 'insurance') DEFAULT 'cash',
      billing_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    )`);

    // OTP
    await conn.query(`CREATE TABLE IF NOT EXISTS otp_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20),
      email VARCHAR(150),
      otp_code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      is_verified TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // BLOCKCHAIN
    await conn.query(`CREATE TABLE IF NOT EXISTS blockchain_ledger (
      id INT PRIMARY KEY,
      previous_hash VARCHAR(64) NOT NULL,
      hash VARCHAR(64) NOT NULL,
      timestamp VARCHAR(50) NOT NULL,
      data JSON NOT NULL
    )`);

    // AUTO-PROVISION: Create default admin if no users exist
    const [userCount] = await conn.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0) {
      console.log('👤 No users found. Creating default admin account...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await conn.query(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['System Administrator', 'admin@hms.com', hashedPassword, 'admin', '0000000000']
      );
      console.log('✅ Default Admin created: admin@hms.com / admin123');
    }

    isInitialized = true;
    console.log('✅ Database Schema Fully Sync with your SQL file');
  } catch (err) {
    console.error('❌ DB Initialization Failed:', err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  query: (...args) => pool.query(...args),
  initDB
};
