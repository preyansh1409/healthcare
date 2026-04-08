const { pool } = require('../config/db');

// @GET /api/admin/stats
const getStats = async (req, res) => {
  const { month } = req.query; // 'YYYY-MM'
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  try {
    // Counts for the selected month
    const [[patients]] = await pool.query('SELECT COUNT(*) AS count FROM patients WHERE DATE_FORMAT(created_at, "%Y-%m") = ?', [currentMonth]);
    const [[doctors]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'doctor'");
    const [[appointments]] = await pool.query('SELECT COUNT(*) AS count FROM appointments WHERE DATE_FORMAT(appointment_date, "%Y-%m") = ? AND status != "cancelled"', [currentMonth]);
    const [[beds]] = await pool.query('SELECT COUNT(*) AS total, SUM(occupied=1) AS occupied FROM beds');
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(d.consultation_fee), 0) AS total FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE DATE_FORMAT(a.appointment_date, '%Y-%m') = ? AND a.status='completed'",
      [currentMonth]
    );

    const [[totalPatients]] = await pool.query('SELECT COUNT(*) AS count FROM patients');

    res.json({
      success: true,
      data: {
        totalPatients: patients.count, // Default to TODAY'S new patients
        allTimePatients: totalPatients.count,
        totalDoctors: doctors.count,
        totalAppointments: appointments.count, // TODAY'S appts
        totalBeds: beds.total || 0,
        occupiedBeds: beds.occupied || 0,
        totalRevenue: revenue.total || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/admin/users
const createUser = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { name, email, password, role, phone, specialization, department } = req.body;
  try {
    const hashed = await bcrypt.hash(password || 'Password@123', 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, phone || null]
    );
    if (role === 'doctor') {
      await pool.query(
        'INSERT INTO doctors (user_id, specialization, department, available) VALUES (?, ?, ?, 1)',
        [result.insertId, specialization || 'General', department || 'General']
      );
    }

    // Blockchain Integration
    await MedicalBlock.recordActivity('USER_CREATE', { userId: result.insertId, name, email, role });

    res.status(201).json({ success: true, message: 'User created', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/beds
const getBeds = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, p.name AS patient_name, p.age AS patient_age, p.phone AS patient_phone
       FROM beds b LEFT JOIN patients p ON b.patient_id = p.id
       ORDER BY b.ward, b.bed_number`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const MedicalBlock = require('../utils/blockchain');

// @PUT /api/admin/beds/:id
const updateBed = async (req, res) => {
  const { occupied, patient_id, ward, admission_reason, treatment_given, doctor_id } = req.body;
  try {
    // 1. Update the bed state (Current State)
    await pool.query(
      'UPDATE beds SET occupied=?, patient_id=?, ward=?, admission_reason=?, treatment_given=?, doctor_id=? WHERE id=?',
      [occupied, patient_id || null, ward, admission_reason || null, treatment_given || null, doctor_id || null, req.params.id]
    );

    // 2. Manage Admission Records (Historical State)
    if (occupied === 1) {
      // NEW ADMISSION
      await pool.query(
        'INSERT INTO admission_records (bed_id, patient_id, doctor_id, reason, treatment) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, patient_id, doctor_id || null, admission_reason, treatment_given]
      );

      // --- AUTO-GENERATE BILLING FOR ROOM CHARGE ---
      const roomRates = {
        'General': 2000,
        'Semi-Private': 4500,
        'Private': 8000,
        'ICU': 18000,
        'Pediatrics': 3500,
        'Maternity': 5500,
        'Surgical': 6500,
        'Emergency': 4500
      };

      const cost = roomRates[ward] || 2000;
      const items = JSON.stringify([{ id: Date.now().toString(), name: `Initial Room Charge (${ward})`, cost }]);
      
      await pool.query(
        'INSERT INTO billing (patient_id, doctor_id, total_amount, items, status, payment_method) VALUES (?, ?, ?, ?, "unpaid", "cash")',
        [patient_id, doctor_id || null, cost, items]
      );

      // --- BLOCKCHAIN INTEGRATION ---
      await MedicalBlock.recordActivity('ADMISSION', {
        bedId: req.params.id,
        ward,
        patientId: patient_id,
        doctorId: doctor_id,
        reason: admission_reason
      });
    } else {
      // DISCHARGE / RELEASE BED
      await pool.query(
        'UPDATE admission_records SET discharge_date = CURRENT_TIMESTAMP WHERE bed_id = ? AND discharge_date IS NULL',
        [req.params.id]
      );
    }

    res.json({ success: true, message: occupied === 1 ? 'Bed allotted and verified on Blockchain!' : 'Bed released' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [monthlyAppts] = await pool.query(
      `SELECT DATE_FORMAT(appointment_date, '%b') AS month, COUNT(*) AS count
       FROM appointments
       WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY MONTH(appointment_date) ORDER BY appointment_date`
    );
    const [bySpecialization] = await pool.query(
      `SELECT d.specialization, COUNT(*) AS count
       FROM appointments a JOIN doctors d ON a.doctor_id = d.id
       GROUP BY d.specialization ORDER BY count DESC LIMIT 8`
    );
    const [statusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM appointments GROUP BY status`
    );
    res.json({ success: true, data: { monthlyAppts, bySpecialization, statusBreakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/admin/emergency
const triggerEmergency = async (req, res) => {
  const { specialty, doctorId, message } = req.body;
  const finalMessage = message || "Come at emergency floor immediately.";
  const senderName = req.user.name || 'Staff';
  
  try {
    let query = `
      SELECT u.id, u.name, d.specialization 
      FROM users u 
      JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor'
    `;
    const params = [];

    if (doctorId) {
      query += ' AND d.id = ?';
      params.push(doctorId);
    } else if (specialty && specialty !== 'All') {
      query += ' AND d.specialization = ?';
      params.push(specialty);
    }

    const [doctors] = await pool.query(query, params);
    
    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: 'No doctors found' });
    }

    const targetDesc = doctorId ? `Dr. ${doctors[0].name}` : `Group: ${specialty}`;

    // 1. Log the emergency trigger event
    await pool.query(
      'INSERT INTO emergency_logs (sender_name, target, message) VALUES (?, ?, ?)',
      [senderName, targetDesc, finalMessage]
    );

    // 2. Insert notifications for all matching doctors
    const insertPromises = doctors.map(doc => 
      pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "emergency")',
        [doc.id, `EMERGENCY ALERT: ${finalMessage}`]
      )
    );

    await Promise.all(insertPromises);

    res.json({ success: true, message: `Emergency alert broadcasted to ${doctors.length} doctors.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/admin/emergency-logs
const getEmergencyLogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM emergency_logs ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getStats, 
  getAllUsers, 
  createUser, 
  deleteUser, 
  getBeds, 
  updateBed, 
  getAnalytics, 
  getNotifications, 
  markNotificationRead,
  triggerEmergency,
  getEmergencyLogs,
  verifyLedger: async (req, res) => {
    const result = await MedicalBlock.verifyChain();
    res.json({ success: true, ...result });
  },
  getBlockchainLedger: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM blockchain_ledger ORDER BY id DESC');
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getAllDoctorLeaves: async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT l.*, u.name AS doctor_name, d.specialization
         FROM doctor_leaves l
         JOIN doctors d ON l.doctor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE l.leave_date >= CURDATE()
         ORDER BY l.leave_date ASC`
      );
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
