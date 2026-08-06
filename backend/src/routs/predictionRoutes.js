const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// GET - Get predictions for a patient
router.get('/patient/:patientId', predictionController.getPatientPredictions);

// GET - Get latest prediction for a patient
router.get('/patient/:patientId/latest', predictionController.getLatestPrediction);

// GET - Get risk summary for a patient
router.get('/patient/:patientId/summary', predictionController.getRiskSummary);

// GET - Get all high risk patients
router.get('/high-risk', predictionController.getHighRiskPatients);

// GET - Get prediction analytics
router.get('/analytics', predictionController.getPredictionAnalytics);

// GET - Get prediction stats
router.get('/stats', predictionController.getPredictionStats);

// GET - Get predictions by date range
router.get('/date-range', predictionController.getPredictionsByDateRange);

// GET - Get prediction summary (dashboard)
router.get('/summary', predictionController.getPredictionSummary);

// GET - Get prediction by ID
router.get('/:id', predictionController.getPredictionById);

module.exports = router;