
-- =============================================
-- Smart Healthcare Management System - Database Schema
-- Run this in phpMyAdmin or MySQL CLI via XAMPP
-- =============================================

CREATE DATABASE IF NOT EXISTS healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE healthcare_db;

-- ─── USERS (Auth & roles) ────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'doctor', 'receptionist', 'patient') NOT NULL DEFAULT 'patient',
  phone       VARCHAR(20),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── DOCTORS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  specialization   VARCHAR(100) DEFAULT 'General',
  department       VARCHAR(100) DEFAULT 'General',
  available        TINYINT(1) DEFAULT 1,
  shift_start      TIME DEFAULT '09:00:00',
  shift_end        TIME DEFAULT '17:00:00',
  consultation_fee DECIMAL(10,2) DEFAULT 500.00,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── PATIENTS ────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT, -- Link to users table for Patient Portal login
  name              VARCHAR(150) NOT NULL,
  age               INT NOT NULL,
  gender            ENUM('Male', 'Female', 'Other') NOT NULL,
  phone             VARCHAR(20) NOT NULL,
  email             VARCHAR(150),
  birth_date        DATE,
  address           TEXT,
  blood_group       VARCHAR(5),
  allergies         TEXT,
  emergency_contact VARCHAR(200),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── APPOINTMENTS ─────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  doctor_id        INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  shift            ENUM('morning', 'evening') DEFAULT 'morning',
  reason           TEXT,
  status           ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  notes            TEXT,
  booked_by        INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
  FOREIGN KEY (booked_by)  REFERENCES users(id)    ON DELETE SET NULL
);

-- ─── PRESCRIPTIONS ────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  doctor_id      INT NOT NULL,
  appointment_id INT,
  diagnosis      VARCHAR(500) NOT NULL,
  medications    JSON,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)      ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)      REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)  ON DELETE SET NULL
);

-- ─── BEDS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS beds (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  bed_number   VARCHAR(20) NOT NULL,
  ward         ENUM('General','ICU','Semi-Private','Private','Pediatrics','Maternity','Surgical','Emergency') DEFAULT 'General',
  occupied     TINYINT(1) DEFAULT 0,
  patient_id   INT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- ─── LAB REPORTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS lab_reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  report_type  VARCHAR(100) NOT NULL,
  report_date  DATE NOT NULL,
  details      TEXT,
  uploaded_by  INT,
  status       ENUM('pending', 'analyzed') DEFAULT 'pending',
  ai_summary   TEXT,
  ai_anomalies JSON,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── VITALS (IoT Persistence) ─────────────────
CREATE TABLE IF NOT EXISTS vitals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT NOT NULL,
  heart_rate      INT,
  blood_pressure  VARCHAR(20),
  spo2            INT,
  temperature     DECIMAL(4,1),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ─── BILLING ──────────────────────────────────
CREATE TABLE IF NOT EXISTS billing (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      INT NOT NULL,
  appointment_id  INT,
  amount          DECIMAL(10,2) NOT NULL,
  tax             DECIMAL(10,2) DEFAULT 0.00,
  discount        DECIMAL(10,2) DEFAULT 0.00,
  total_amount    DECIMAL(10,2) NOT NULL,
  status          ENUM('unpaid', 'paid', 'partially_paid') DEFAULT 'unpaid',
  payment_method  ENUM('cash', 'card', 'online', 'insurance') DEFAULT 'cash',
  billing_date    DATE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(id)      ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)  ON DELETE SET NULL
);

-- ─── NOTIFICATIONS ────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) DEFAULT 'general',
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── PATIENT PORTAL DATA ──────────────────────
CREATE TABLE IF NOT EXISTS patient_portal (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  user_id      INT NOT NULL,
  status       ENUM('active', 'inactive') DEFAULT 'active',
  last_login   TIMESTAMP NULL,
  preferences  JSON,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(patient_id),
  UNIQUE(user_id)
);

-- ─── PATIENT PORTAL MESSAGES ──────────────────
CREATE TABLE IF NOT EXISTS patient_portal_messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sender_id    INT NOT NULL,
  receiver_id  INT NOT NULL,
  subject      VARCHAR(255),
  message      TEXT NOT NULL,
  is_read      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── OTP VERIFICATIONS ────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  phone        VARCHAR(20),
  email        VARCHAR(150),
  otp_code     VARCHAR(6) NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  is_verified  TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (phone),
  INDEX (email),
  INDEX (expires_at)
);

-- ─── DOCTOR LEAVES ────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id   INT NOT NULL,
  leave_date  DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ─── BLOCKCHAIN LEDGER ────────────────────────
CREATE TABLE IF NOT EXISTS blockchain_ledger (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  previous_hash VARCHAR(64) NOT NULL,
  hash          VARCHAR(64) NOT NULL,
  timestamp     VARCHAR(50) NOT NULL,
  data          JSON NOT NULL
);

-- =============================================
-- SEED DATA (Demo users with hashed passwords)
-- Password for all: see notes below
-- =============================================

-- Admin: admin@hospital.com / Admin@123
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
('Dr. Admin SuperUser', 'admin@hospital.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX/WEqGFjD6NEq6F7oeJYLUmmu', 'admin', '9876543210');

-- Doctor: doctor@hospital.com / Doctor@123
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
('Dr. Rajesh Kumar', 'doctor@hospital.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX/WEqGFjD6NEq6F7oeJYLUmmu', 'doctor', '9876543211'),
('Dr. Priya Sharma', 'priya.doctor@hospital.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX/WEqGFjD6NEq6F7oeJYLUmmu', 'doctor', '9876543214'),
('Dr. Amit Singh', 'amit.doctor@hospital.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX/WEqGFjD6NEq6F7oeJYLUmmu', 'doctor', '9876543215');

-- Receptionist: nurse@hospital.com / Nurse@123
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES
('Sneha Receptionist', 'nurse@hospital.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGX/WEqGFjD6NEq6F7oeJYLUmmu', 'receptionist', '9876543212');

-- Doctor profiles
INSERT IGNORE INTO doctors (user_id, specialization, department, available, consultation_fee)
SELECT id, 'Cardiology', 'Cardiology', 1, 800 FROM users WHERE email='doctor@hospital.com';

INSERT IGNORE INTO doctors (user_id, specialization, department, available, consultation_fee)
SELECT id, 'Neurology', 'Neurology', 1, 900 FROM users WHERE email='priya.doctor@hospital.com';

INSERT IGNORE INTO doctors (user_id, specialization, department, available, consultation_fee)
SELECT id, 'Pediatrics', 'Pediatrics', 1, 600 FROM users WHERE email='amit.doctor@hospital.com';

-- Sample patients
INSERT IGNORE INTO patients (name, age, gender, phone, email, blood_group, address, allergies, emergency_contact) VALUES
('Ravi Verma', 45, 'Male', '9000000001', 'ravi@gmail.com', 'B+', 'Delhi, India', 'Penicillin', 'Meena Verma - 9000000002'),
('Sunita Devi', 32, 'Female', '9000000003', 'sunita@gmail.com', 'A+', 'Mumbai, India', 'None', 'Ram Das - 9000000004'),
('Arun Patel', 58, 'Male', '9000000005', 'arun@gmail.com', 'O+', 'Pune, India', 'Sulfa drugs', 'Gita Patel - 9000000006'),
('Ananya Rao', 25, 'Female', '9000000007', NULL, 'AB-', 'Chennai, India', 'None', 'Sreenivas Rao - 9000000008');

-- Beds (20 beds across wards)
INSERT IGNORE INTO beds (bed_number, ward, occupied) VALUES
('G-01','General',0),('G-02','General',1),('G-03','General',0),('G-04','General',0),
('G-05','General',1),
('ICU-01','ICU',1),('ICU-02','ICU',0),('ICU-03','ICU',1),
('PED-01','Pediatrics',0),('PED-02','Pediatrics',0),
('MAT-01','Maternity',0),('MAT-02','Maternity',1),
('SUR-01','Surgical',0),('SUR-02','Surgical',0),('SUR-03','Surgical',1),
('EM-01','Emergency',1),('EM-02','Emergency',0),('EM-03','Emergency',1),
('EM-04','Emergency',0),('EM-05','Emergency',0);

-- NOTE: The seeded password hash above is invalid for demo purposes.
-- After running this SQL, use the /api/auth/register endpoint or the
-- app's demo login to create proper accounts, OR run the seed script below:
-- node server/scripts/seedUsers.js
