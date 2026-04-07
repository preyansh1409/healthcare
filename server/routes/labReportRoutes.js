const express = require('express');
const router = express.Router();
const labReportController = require('../controllers/labReportController');

// All endpoints require some form of auth (could add auth middleware later)
router.post('/upload', labReportController.uploadReport);
router.get('/patient/:patientId', labReportController.getPatientReports);
router.get('/:id', labReportController.getReportById);

router.post('/:id/analyze', labReportController.analyzeReport);

module.exports = router;

