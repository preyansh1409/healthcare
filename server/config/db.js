const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER || '2GKXcNaNXVwCPeQ.root',
  password: process.env.DB_PASSWORD || 'adS87vr7msEcV8vS',
  database: process.env.DB_NAME || 'healthcare_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
});

pool.getConnection()
  .then(async conn => {
    console.log('✅ Connected to TiDB Cloud / MySQL');

    // AUTO-INSTALLER: Create all tables if they don't exist
    try {
      console.log('📦 Verifying Database Schema...');

      // 1. Users table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'doctor', 'receptionist', 'patient') NOT NULL,
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Doctors table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS doctors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          specialization VARCHAR(100) DEFAULT 'General',
          department VARCHAR(100) DEFAULT 'General',
          available TINYINT(1) DEFAULT 1,
          shift_start TIME DEFAULT '09:00:00',
          shift_end TIME DEFAULT '17:00:00',
          consultation_fee DECIMAL(10,2) DEFAULT 500.00,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 3. Patients table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(150),
          birth_date DATE,
          blood_group VARCHAR(10),
          gender ENUM('Male', 'Female', 'Other'),
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // 4. Appointments table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          patient_id INT NOT NULL,
          doctor_id INT NOT NULL,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'requested', 'checked_in') DEFAULT 'pending',
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id),
          FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        )
      `);

      // 5. Doctor Leaves
      await conn.query(`
        CREATE TABLE IF NOT EXISTS doctor_leaves (
          id INT AUTO_INCREMENT PRIMARY KEY,
          doctor_id INT NOT NULL,
          leave_date DATE NOT NULL,
          reason TEXT,
          FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        )
      `);

      // 6. Billing
      await conn.query(`
        CREATE TABLE IF NOT EXISTS billing (
          id INT AUTO_INCREMENT PRIMARY KEY,
          patient_id INT NOT NULL,
          doctor_id INT,
          total_amount DECIMAL(10,2) NOT NULL,
          status ENUM('paid', 'pending', 'cancelled') DEFAULT 'pending',
          payment_method VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
      `);

      // 7. Blockchain Ledger
      await conn.query(`
        CREATE TABLE IF NOT EXISTS blockchain_ledger (
          id INT PRIMARY KEY,
          previous_hash VARCHAR(64) NOT NULL,
          hash VARCHAR(64) NOT NULL,
          timestamp VARCHAR(50) NOT NULL,
          data JSON NOT NULL
        )
      `);

      // 8. OTP Verifications
      await conn.query(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phone VARCHAR(20),
          email VARCHAR(150),
          otp_code VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_verified TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Database Schema Verified & Synchronized');
    } catch (migErr) {
      console.error('⚠️ Schema Initialization Error:', migErr.message);
    }

    conn.release();
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
  });

module.exports = pool;
