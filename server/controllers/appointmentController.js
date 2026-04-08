const { pool } = require('../config/db');
const MedicalBlock = require('../utils/blockchain');

// @GET /api/appointments
const getAllAppointments = async (req, res) => {
  try {
    let query = `
      SELECT a.*, 
        p.name AS patient_name, p.phone AS patient_phone, p.age, p.gender,
        u.name AS doctor_name, d.specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
    `;
    const params = [];

    if (req.user.role === 'doctor') {
      query += ' WHERE d.user_id = ? AND a.status != "requested"';
      params.push(req.user.id);
    } else if (req.user.role === 'patient') {
      // Patients see their own appointments, including requested ones
      query += ` JOIN users pu ON p.user_id = pu.id WHERE pu.id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'receptionist' || req.user.role === 'admin') {
      // Receptionists and admins see all
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, p.phone, p.age, p.gender, p.blood_group,
        u.name AS doctor_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/appointments
const createAppointment = async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, reason, shift } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Check if THIS patient already has a pending/checked_in appointment today with THIS doctor
    const [dup] = await pool.query(
      'SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ? AND appointment_date = ? AND status != "cancelled"',
      [patient_id, doctor_id, appointment_date]
    );
    if (dup.length) {
      return res.status(409).json({ success: false, message: 'This patient already has an appointment with this doctor today.' });
    }

    // Check slot availability (time-slot specific)
    const [existing] = await pool.query(
      'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled"',
      [doctor_id, appointment_date, appointment_time]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }

    const status = (req.user.role === 'patient') ? 'requested' : 'confirmed';

    const [result] = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, shift, status, booked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, appointment_time, reason || '', shift || 'morning', status, req.user.id]
    );

    const appointmentId = result.insertId;

    // Blockchain Integration
    await MedicalBlock.recordActivity('APPOINTMENT_CREATE', { appointmentId, patientId: patient_id, doctorId: doctor_id, date: appointment_date });

    // Create notification for receptionist/admin if patient books
    if (req.user.role === 'patient') {
       // Notify admins/receptionists (simplified: any user with that role)
       const [staff] = await pool.query('SELECT id FROM users WHERE role IN ("receptionist", "admin")');
       for (const u of staff) {
         await pool.query(
           'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
           [u.id, `Patient requested an appointment for ${appointment_date} at ${appointment_time}`, 'request']
         );
       }
    } else {
      // Traditional staff notification
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [req.user.id, `New appointment booked for ${appointment_date} at ${appointment_time}`, 'appointment']
      );
    }

    res.status(201).json({ success: true, message: 'Appointment booked successfully', appointmentId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/appointments/:id
const updateAppointment = async (req, res) => {
  const { status, notes } = req.body;
  try {
    await pool.query(
      'UPDATE appointments SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [status, notes || '', req.params.id]
    );
    res.json({ success: true, message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/appointments/:id
const deleteAppointment = async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/appointments/today
const getTodayAppointments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, u.name AS doctor_name, d.specialization,
              (SELECT reason FROM doctor_leaves WHERE doctor_id = d.id AND leave_date = CURDATE() LIMIT 1) AS on_leave_reason
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE DATE(a.appointment_date) = CURDATE()
       ORDER BY a.appointment_time ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/appointments/by-date/:date
const getAppointmentsByDate = async (req, res) => {
  const { date } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, p.name AS patient_name, u.name AS doctor_name, d.specialization,
              (SELECT reason FROM doctor_leaves WHERE doctor_id = d.id AND leave_date = ? LIMIT 1) AS on_leave_reason
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE DATE(a.appointment_date) = ?
       ORDER BY a.appointment_time ASC`,
      [date, date]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/appointments/:id/check-in
const checkInAppointment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const apptId = req.params.id;

    // 1. Get the doctor and date for this appointment with a lock
    const [appt] = await connection.query('SELECT doctor_id, patient_id, appointment_date FROM appointments WHERE id = ? FOR UPDATE', [apptId]);
    if (!appt.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const { doctor_id: doctorId, patient_id: patientId, appointment_date: apptDate } = appt[0];

    // 2. Get current max token for THIS doctor on THIS date
    const [tokens] = await connection.query(
      'SELECT MAX(token_number) as lastToken FROM appointments WHERE doctor_id = ? AND (DATE(appointment_date) = DATE(?) OR appointment_date = ?) AND token_number > 0 FOR UPDATE',
      [doctorId, apptDate, apptDate]
    );
    const nextToken = (parseInt(tokens[0].lastToken) || 0) + 1;

    // 3. Update appointment
    await connection.query(
      'UPDATE appointments SET status = "checked_in", token_number = ?, updated_at = NOW() WHERE id = ?',
      [nextToken, apptId]
    );

    // 4. Generate Bill only at the time of check-in
    const [existingBill] = await connection.query('SELECT id FROM billing WHERE appointment_id = ?', [apptId]);
    if (existingBill.length === 0) {
      const [doctorRows] = await connection.query('SELECT consultation_fee FROM doctors WHERE id = ?', [doctorId]);
      const fee = doctorRows.length && doctorRows[0].consultation_fee ? parseFloat(doctorRows[0].consultation_fee) : 500;
      const items = JSON.stringify([{ id: Date.now().toString(), name: 'Consultation Fee', cost: fee }]);

      const [billResult] = await connection.query(
        'INSERT INTO billing (patient_id, appointment_id, doctor_id, total_amount, items, tax, discount, status, payment_method) VALUES (?, ?, ?, ?, ?, 0, 0, "unpaid", "cash")',
        [patientId, apptId, doctorId, fee, items]
      );

      // Blockchain Integration (Bill & Checkin)
      await MedicalBlock.recordActivity('BILL_CREATE', { billId: billResult.insertId, patientId, amount: fee });
    }

    await MedicalBlock.recordActivity('CHECK_IN', { appointmentId: apptId, patientId, token: nextToken });

    await connection.commit();
    res.json({ success: true, message: `Checked in! Token #${nextToken}`, token: nextToken });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayAppointments,
  getAppointmentsByDate,
  checkInAppointment
};
