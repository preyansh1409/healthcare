const pool = require('../config/db');

// @GET /api/doctors
const getAllDoctors = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone,
        (SELECT reason FROM doctor_leaves WHERE doctor_id = d.id AND leave_date = CURDATE() LIMIT 1) AS on_leave_today,
        (SELECT reason FROM doctor_leaves WHERE doctor_id = d.id AND leave_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) LIMIT 1) AS on_leave_tomorrow
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE u.role = 'doctor'
       ORDER BY u.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/doctors/:id
const updateDoctor = async (req, res) => {
  const { specialization, department, available, shift_start, shift_end, consultation_fee } = req.body;
  try {
    await pool.query(
      'UPDATE doctors SET specialization=?, department=?, available=?, shift_start=?, shift_end=?, consultation_fee=? WHERE id=?',
      [specialization, department, available, shift_start, shift_end, consultation_fee, req.params.id]
    );
    res.json({ success: true, message: 'Doctor updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id/schedule
const getDoctorSchedule = async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT a.appointment_time, a.status, p.name AS patient_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = ? AND a.appointment_date = ?
       ORDER BY a.appointment_time`,
      [req.params.id, date || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id/stats
const getDoctorStats = async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) AS total FROM appointments WHERE doctor_id = ?', [req.params.id]);
    const [today] = await pool.query('SELECT COUNT(*) AS today FROM appointments WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()', [req.params.id]);
    const [pending] = await pool.query("SELECT COUNT(*) AS pending FROM appointments WHERE doctor_id = ? AND status = 'pending'", [req.params.id]);
    const [completed] = await pool.query("SELECT COUNT(*) AS completed FROM appointments WHERE doctor_id = ? AND status = 'completed'", [req.params.id]);

    // New trackers for today's activity
    const [newAppts] = await pool.query(
      'SELECT COUNT(*) AS count FROM appointments WHERE doctor_id = ? AND DATE(created_at) = CURDATE()',
      [req.params.id]
    );
    const [newReports] = await pool.query(
      `SELECT COUNT(*) AS count FROM lab_reports 
       WHERE DATE(created_at) = CURDATE() 
       AND patient_id IN (SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = ?)`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        total: total[0].total,
        today: today[0].today,
        pending: pending[0].pending,
        completed: completed[0].completed,
        new_bookings: newAppts[0].count,
        new_reports: newReports[0].count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id/admitted-patients
const getAdmittedPatientsByDoctor = async (req, res) => {
  try {
    // 1. Get doctor specialization
    const [doctor] = await pool.query('SELECT specialization FROM doctors WHERE id = ?', [req.params.id]);
    if (!doctor.length) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // 2. Ward mapping logic
    // Cardiology -> ICU/General
    // Neurology -> Surgical/General
    // Pediatrics -> Pediatrics
    // General -> All
    let wardFilter = "('General')";
    const spec = doctor[0].specialization.toLowerCase();
    if (spec.includes('cardi')) wardFilter = "('ICU', 'General')";
    else if (spec.includes('neuro')) wardFilter = "('Surgical', 'General')";
    else if (spec.includes('pediat')) wardFilter = "('Pediatrics')";
    else if (spec.includes('emergenc')) wardFilter = "('Emergency')";

    const [rows] = await pool.query(
      `SELECT b.id AS bed_id, b.bed_number, b.ward, b.admission_reason, b.treatment_given, p.* 
       FROM beds b
       JOIN patients p ON b.patient_id = p.id
       WHERE b.occupied = 1 AND b.doctor_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/patients/by-specialty
const getSpecialtyPatients = async (req, res) => {
  try {
    const [doctor] = await pool.query('SELECT specialization FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doctor.length) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const specialization = doctor[0].specialization;

    const [patients] = await pool.query(
      `SELECT DISTINCT p.* 
       FROM patients p
       LEFT JOIN appointments a ON p.id = a.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN prescriptions pr ON p.id = pr.patient_id
       WHERE d.specialization = ? 
       OR pr.diagnosis LIKE ?
       ORDER BY p.name ASC`,
      [specialization, `%${specialization}%`]
    );

    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/doctors/leave
const markLeave = async (req, res) => {
  const { date, reason } = req.body;
  try {
    // 1. Find doctor.id from user_id
    const [doctor] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doctor.length) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    
    const doctorId = doctor[0].id;
    
    // 2. Check if already marked
    const [existing] = await pool.query('SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?', [doctorId, date]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Leave already marked for this date' });

    // 3. Mark leave
    await pool.query('INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (?, ?, ?)', [doctorId, date, reason]);
    res.json({ success: true, message: 'Leave marked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/leave
const getDoctorLeaves = async (req, res) => {
  try {
    const [doctor] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doctor.length) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const [rows] = await pool.query(
      'SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date >= CURDATE() ORDER BY leave_date',
      [doctor[0].id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/doctors/:id/check-availability
const checkDoctorAvailability = async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT reason FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?',
      [req.params.id, date]
    );
    if (rows.length) {
      return res.json({ success: true, available: false, reason: rows[0].reason });
    }
    res.json({ success: true, available: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  getDoctorSchedule,
  getDoctorStats,
  getAdmittedPatientsByDoctor,
  getSpecialtyPatients,
  markLeave,
  getDoctorLeaves,
  checkDoctorAvailability
};
