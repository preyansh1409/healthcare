const express = require('express');
const router = express.Router();
const { getBills, createBill, updateBill, updateBillStatus } = require('../controllers/billingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', authorizeRoles('admin', 'patient', 'receptionist', 'doctor'), getBills);
router.post('/', authorizeRoles('admin', 'receptionist'), createBill);
router.put('/:id', authorizeRoles('admin', 'receptionist'), updateBill);
router.put('/:id/status', authorizeRoles('admin', 'receptionist'), updateBillStatus);

module.exports = router;
