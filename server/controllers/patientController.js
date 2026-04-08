const { pool } = require('../config/db');

// @GET /api/patients
const getAllPatients = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/patients/:id
const getPatientById = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!patient.length) return res.status(404).json({ success: false, message: 'Patient not found' });

    const [appointments] = await pool.query(
      `SELECT a.*, u.name AS doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC`,
      [req.params.id]
    );

    const [prescriptions] = await pool.query(
      `SELECT pr.*, u.name AS doctor_name
       FROM prescriptions pr
       JOIN users u ON pr.doctor_id = u.id
       WHERE pr.patient_id = ?
       ORDER BY pr.created_at DESC`,
      [req.params.id]
    );

    const [bills] = await pool.query(
      `SELECT b.*, p.name as patient_name, u.name as doctor_name
       FROM billing b
       JOIN patients p ON b.patient_id = p.id
       LEFT JOIN appointments a ON b.appointment_id = a.id
       LEFT JOIN doctors doc ON a.doctor_id = doc.id
       LEFT JOIN users u ON doc.user_id = u.id
       WHERE b.patient_id = ?
       ORDER BY b.created_at DESC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...patient[0], appointments, prescriptions, bills } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/patients
const createPatient = async (req, res) => {
  const {
    name, age, gender, phone, email, address, blood_group,
    allergies, emergency_contact, assigned_doctor_name, birth_date
  } = req.body;

  if (!name || !age || !gender || !phone) {
    return res.status(400).json({ success: false, message: 'Name, age, gender, and phone are required' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM patients WHERE phone = ?', [phone]);
    if (existing.length) {
      return res.status(200).json({ success: true, isReturning: true, patientId: existing[0].id });
    }

    const [result] = await pool.query(
      `INSERT INTO patients (name, age, gender, phone, email, address, blood_group, allergies, emergency_contact, assigned_doctor_name, birth_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age, gender, phone, email || null, address || '', blood_group || '', allergies || '', emergency_contact || '', assigned_doctor_name || null, birth_date || null]
    );

    // Blockchain Integration
    await MedicalBlock.recordActivity('PATIENT_CREATE', { id: result.insertId, name, phone, email });

    res.status(201).json({ success: true, isReturning: false, patientId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/patients/:id
const updatePatient = async (req, res) => {
  const { name, age, gender, phone, email, address, blood_group, allergies, emergency_contact, birth_date } = req.body;
  try {
    await pool.query(
      'UPDATE patients SET name=?, age=?, gender=?, phone=?, email=?, address=?, blood_group=?, allergies=?, emergency_contact=?, birth_date=? WHERE id=?',
      [name, age, gender, phone, email, address, blood_group, allergies, emergency_contact, birth_date, req.params.id]
    );

    // Sync with users table
    const [patient] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [req.params.id]);
    if (patient[0]?.user_id) {
      await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, patient[0].user_id]);
    }

    // Blockchain Integration
    await MedicalBlock.recordActivity('PATIENT_UPDATE', { id: req.params.id, name, phone });

    res.json({ success: true, message: 'Patient updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const MedicalBlock = require('../utils/blockchain');

// @POST /api/patients/:id/prescriptions
const addPrescription = async (req, res) => {
  const { diagnosis, medications, notes, appointment_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, diagnosis, medications, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, appointment_id || null, diagnosis, JSON.stringify(medications), notes || '']
    );

    if (appointment_id) {
      await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [appointment_id]);
    }

    await MedicalBlock.recordActivity('PRESCRIPTION', {
      prescriptionId: result.insertId,
      patientId: req.params.id,
      doctorId: req.user.id,
      diagnosis,
      medications
    });

    res.status(201).json({ success: true, message: 'Prescription added and verified on Blockchain!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, addPrescription };
