const express = require('express');
const router = express.Router();
const { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, addPrescription } = require('../controllers/patientController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', authorizeRoles('receptionist', 'admin'), createPatient);
router.put('/:id', authorizeRoles('receptionist', 'admin', 'doctor', 'patient'), updatePatient);
router.delete('/:id', authorizeRoles('admin'), deletePatient);
router.post('/:id/prescriptions', authorizeRoles('doctor'), addPrescription);

module.exports = router;
