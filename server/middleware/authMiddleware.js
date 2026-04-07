const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'hms_super_secret_key_123';
    const decoded = jwt.verify(token, secret);
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, d.specialization, d.id as doctor_id, p.id as patient_id
       FROM users u 
       LEFT JOIN doctors d ON u.id = d.user_id 
       LEFT JOIN patients p ON u.id = p.user_id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role?.toLowerCase();
    const isAuthorized = roles.some(role => role.toLowerCase() === userRole);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
