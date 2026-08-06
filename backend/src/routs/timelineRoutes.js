const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/patient/:patientId', timelineController.getPatientTimeline);
router.get('/patient/:patientId/stats', timelineController.getTimelineStats);
router.get('/recent', timelineController.getRecentTimeline);
router.put('/patient/:patientId/read', timelineController.markTimelineRead);
router.post('/', timelineController.addTimelineEvent);

module.exports = router;