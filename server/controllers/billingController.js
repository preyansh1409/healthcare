const pool = require('../config/db');
const MedicalBlock = require('../utils/blockchain');

exports.getBills = async (req, res, next) => {
  try {
    let query = `
      SELECT b.*, p.name as patient_name, p.phone as patient_phone, a.appointment_date, 
             COALESCE(u_direct.name, u_appt.name) as doctor_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN appointments a ON b.appointment_id = a.id
      LEFT JOIN doctors doc_appt ON a.doctor_id = doc_appt.id
      LEFT JOIN users u_appt ON doc_appt.user_id = u_appt.id
      LEFT JOIN doctors doc_direct ON b.doctor_id = doc_direct.id
      LEFT JOIN users u_direct ON doc_direct.user_id = u_direct.id
    `;
    let params = [];

    if (req.user.role === 'patient') {
      query += ` WHERE b.patient_id = ? `;
      params.push(req.user.patient_id);
    }

    query += ` ORDER BY b.created_at DESC`;

    const [bills] = await pool.query(query, params);
    res.json({ success: true, data: bills });
  } catch (error) {
    next(error);
  }
};

exports.createBill = async (req, res, next) => {
  try {
    const { patient_id, appointment_id, doctor_id, total_amount, status, payment_method, items, tax, discount } = req.body;
    const [result] = await pool.query(
      'INSERT INTO billing (patient_id, appointment_id, doctor_id, total_amount, items, tax, discount, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, appointment_id || null, doctor_id || null, total_amount, JSON.stringify(items || []), tax || 0, discount || 0, status || 'unpaid', payment_method || 'cash']
    );

    // Blockchain Integration
    await MedicalBlock.recordActivity('BILL_CREATE', { billId: result.insertId, patientId: patient_id, amount: total_amount });

    res.status(201).json({ success: true, message: 'Bill generated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateBill = async (req, res, next) => {
  try {
    const { total_amount, items, status, payment_method, tax, discount, doctor_id } = req.body;
    await pool.query(
      'UPDATE billing SET total_amount = ?, items = ?, status = ?, payment_method = ?, tax = ?, discount = ?, doctor_id = ? WHERE id = ?',
      [total_amount, JSON.stringify(items || []), status, payment_method, tax, discount, doctor_id || null, req.params.id]
    );
    res.json({ success: true, message: 'Bill updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateBillStatus = async (req, res, next) => {
  try {
    const { status, payment_method } = req.body;
    await pool.query(
      'UPDATE billing SET status = ?, payment_method = ? WHERE id = ?',
      [status, payment_method, req.params.id]
    );
    res.json({ success: true, message: 'Bill status updated' });
  } catch (error) {
    next(error);
  }
};
