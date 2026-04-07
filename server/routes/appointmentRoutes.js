const express = require('express');
const router = express.Router();
const { getAllAppointments, getAppointmentById, createAppointment, updateAppointment, deleteAppointment, getTodayAppointments, getAppointmentsByDate, checkInAppointment } = require('../controllers/appointmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/today', getTodayAppointments);
router.get('/by-date/:date', authorizeRoles('receptionist', 'admin'), getAppointmentsByDate);
router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);
router.post('/', authorizeRoles('receptionist', 'admin', 'patient'), createAppointment);
router.put('/:id/check-in', authorizeRoles('receptionist', 'admin'), checkInAppointment);
router.put('/:id', authorizeRoles('doctor', 'admin', 'receptionist', 'patient'), updateAppointment);
router.delete('/:id', authorizeRoles('admin'), deleteAppointment);

module.exports = router;
