const express = require('express');
const router = express.Router();
const { 
  getStats, getAllUsers, createUser, deleteUser, getBeds, updateBed, 
  getAnalytics, getNotifications, markNotificationRead, triggerEmergency, 
  getEmergencyLogs, verifyLedger, getAllDoctorLeaves, getBlockchainLedger 
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

// Admin-only routes
router.get('/stats', getStats);
router.get('/users', authorizeRoles('admin'), getAllUsers);
router.post('/users', authorizeRoles('admin'), createUser);
router.delete('/users/:id', authorizeRoles('admin'), deleteUser);
router.get('/beds', getBeds);
router.put('/beds/:id', authorizeRoles('admin', 'receptionist', 'doctor'), updateBed);
router.post('/emergency', authorizeRoles('admin', 'receptionist'), triggerEmergency);
router.get('/analytics', authorizeRoles('admin'), getAnalytics);
router.get('/verify-ledger', authorizeRoles('admin'), verifyLedger);
router.get('/blockchain-ledger', authorizeRoles('admin'), getBlockchainLedger);
router.get('/doctor-leaves', authorizeRoles('admin'), getAllDoctorLeaves);
router.get('/emergency-logs', authorizeRoles('admin'), getEmergencyLogs);

// Notifications for any authenticated user
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;
