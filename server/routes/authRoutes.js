const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, sendOTP, verifyOTPAndLogin, getLinkedProfiles, switchProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPAndLogin);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/profiles', protect, getLinkedProfiles);
router.post('/switch-profile', protect, switchProfile);

module.exports = router;
