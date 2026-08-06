const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { authorize } = require('../middleware/auth');

// POST - Add vitals
router.post('/', vitalsController.addVitals);

// GET - Get vitals history
router.get('/patient/:patientId', vitalsController.getVitalsHistory);

// GET - Get latest vitals
router.get('/patient/:patientId/latest', vitalsController.getLatestVitals);

// GET - Get vitals with data quality
router.get('/patient/:patientId/quality', vitalsController.getVitalsQuality);

// GET - Get vitals trend for charts
router.get('/patient/:patientId/trend', vitalsController.getVitalsTrend);

// GET - Get abnormal vitals
router.get('/patient/:patientId/abnormal', vitalsController.getAbnormalVitals);

// GET - Get vitals by ID
router.get('/:id', vitalsController.getVitalsById);

// GET - Get all vitals (for analytics)
router.get('/all', vitalsController.getAllVitals);

// GET - Get recent vitals
router.get('/recent', vitalsController.getRecentVitals);

// GET - Get vitals summary
router.get('/summary', vitalsController.getVitalsSummary);

// DELETE - Delete vitals (admin only)
router.delete('/:id', authorize('ADMIN', 'HOSPITAL_ADMIN'), vitalsController.deleteVitals);

module.exports = router;