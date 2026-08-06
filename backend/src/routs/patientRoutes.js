const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authorize } = require('../middleware/auth');

// GET - Get all patients
router.get('/', patientController.getAllPatients);

// GET - Get high risk patients
router.get('/high-risk', patientController.getHighRiskPatients);

// GET - Get patients by ward
router.get('/ward/:ward', patientController.getPatientsByWard);

// GET - Search patients
router.get('/search', patientController.searchPatients);

// GET - Get stats summary
router.get('/stats/summary', patientController.getStatsSummary);

// GET - Get patient by ID
router.get('/:id', patientController.getPatientById);

// GET - Get patient full details
router.get('/:id/full-details', patientController.getPatientFullDetails);

// GET - Get patient trend (for charts)
router.get('/:id/trend', patientController.getPatientTrend);

// GET - Get patient timeline
router.get('/:id/timeline', patientController.getPatientTimeline);

// POST - Create new patient
router.post('/', patientController.createPatient);

// PUT - Update patient
router.put('/:id', patientController.updatePatient);

// PUT - Discharge patient
router.put('/:id/discharge', patientController.dischargePatient);

// DELETE - Delete patient (admin only)
router.delete('/:id', authorize('ADMIN', 'HOSPITAL_ADMIN'), patientController.deletePatient);

module.exports = router;