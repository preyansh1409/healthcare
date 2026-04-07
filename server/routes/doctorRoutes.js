const express = require('express');
const router = express.Router();
const { 
  getAllDoctors, getDoctorById, updateDoctor, getDoctorSchedule, 
  getDoctorStats, getAdmittedPatientsByDoctor, getSpecialtyPatients,
  markLeave, getDoctorLeaves, checkDoctorAvailability
} = require('../controllers/doctorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', getAllDoctors);

router.use(protect);

router.post('/leave', authorizeRoles('doctor'), markLeave);
router.get('/leave', authorizeRoles('doctor'), getDoctorLeaves);
router.get('/patients/by-specialty', getSpecialtyPatients);
router.get('/:id', getDoctorById);
router.put('/:id', authorizeRoles('admin', 'doctor'), updateDoctor);
router.get('/:id/schedule', getDoctorSchedule);
router.get('/:id/stats', getDoctorStats);
router.get('/:id/admitted', getAdmittedPatientsByDoctor);
router.get('/:id/check-availability', checkDoctorAvailability);

module.exports = router;
