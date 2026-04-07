const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOTPEmail } = require('../services/emailService');
const MedicalBlock = require('../utils/blockchain');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'hms_super_secret_key_123';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// @POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role, phone, specialization, department } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone || null]
    );
    if (role === 'doctor') {
      await pool.query(
        'INSERT INTO doctors (user_id, specialization, department, available) VALUES (?, ?, ?, 1)',
        [result.insertId, specialization || 'General', department || 'General']
      );
    }
    const token = generateToken(result.insertId);
    
    // Blockchain Integration
    await MedicalBlock.recordActivity('USER_CREATE', { userId: result.insertId, name, email, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: result.insertId, name, email, role, specialization: specialization || 'General' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
  try {
    const [rows] = await pool.query(
      `SELECT u.*, d.id as doctor_id, p.id as patient_id, d.specialization
       FROM users u 
       LEFT JOIN doctors d ON u.id = d.user_id 
       LEFT JOIN patients p ON u.id = p.user_id
       WHERE u.email = ?`, [email]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = generateToken(user.id);

    // Blockchain Integration
    await MedicalBlock.recordActivity('LOGIN', { userId: user.id, email: user.email, name: user.name });

    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, specialization: user.specialization, doctor_id: user.doctor_id, patient_id: user.patient_id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, 
              d.specialization, d.id as doctor_id, 
              p.*, p.id as patient_id
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id
       LEFT JOIN patients p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @PUT /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email address is required' });
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query('INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [email, otp]);
    const emailSent = await sendOTPEmail(email, otp);
    console.log(`📧 ${emailSent ? 'REAL' : 'MOCK'} OTP for ${email}: ${otp}`);
    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/verify-otp
const verifyOTPAndLogin = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() AND is_verified = 0 ORDER BY created_at DESC LIMIT 1', [email, otp]);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    await pool.query('UPDATE otp_verifications SET is_verified = 1 WHERE id = ?', [rows[0].id]);

    let [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let userId;
    if (!users.length) {
      const [patients] = await pool.query('SELECT * FROM patients WHERE email = ?', [email]);
      if (!patients.length) return res.status(404).json({ success: false, message: 'Email address not registered.' });
      const dummyPassword = await bcrypt.hash('Patient@123', 12);
      const [newUser] = await pool.query('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, "patient", ?)', [`Family Account (${email})`, email, dummyPassword, patients[0].phone]);
      userId = newUser.insertId;
      await pool.query('UPDATE patients SET user_id = ? WHERE email = ?', [userId, email]);
    } else {
      userId = users[0].id;
      await pool.query('UPDATE patients SET user_id = ? WHERE email = ? AND (user_id IS NULL OR user_id != ?)', [userId, email, userId]);
    }

    const [profiles] = await pool.query('SELECT *, id as patient_id FROM patients WHERE user_id = ?', [userId]);
    const token = generateToken(userId);

    if (profiles.length > 1) {
      return res.json({
        success: true, requiresProfileSelection: true, token, profiles,
        user: { id: userId, email, role: 'patient' }
      });
    }

    res.json({
      success: true, requiresProfileSelection: false, token,
      user: { id: userId, email, role: 'patient', ...profiles[0], patient_id: profiles[0].patient_id }
    });

    // Blockchain Integration
    await MedicalBlock.recordActivity('LOGIN', { userId, email, profileId: profiles[0].patient_id, method: 'OTP' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/profiles
const getLinkedProfiles = async (req, res) => {
  try {
    const [profiles] = await pool.query('SELECT *, id as patient_id FROM patients WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @POST /api/auth/switch-profile
const switchProfile = async (req, res) => {
  const { patientId } = req.body;
  try {
    const [profiles] = await pool.query('SELECT *, id as patient_id FROM patients WHERE user_id = ? AND id = ?', [req.user.id, patientId]);
    if (!profiles.length) return res.status(403).json({ success: false, message: 'Unauthorized profile switch' });
    
    // In our system, the token is at user level, but frontend stores patient_id in AuthContext
    const token = generateToken(req.user.id);
    res.json({
      success: true,
      token,
      user: { id: req.user.id, role: 'patient', ...profiles[0], patient_id: profiles[0].patient_id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, changePassword, sendOTP, verifyOTPAndLogin, getLinkedProfiles, switchProfile };
