const TimelineService = require('../services/timelineService');

exports.getPatientTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    const timeline = await TimelineService.getPatientTimeline(patientId, req.query);
    
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTimelineStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const stats = await TimelineService.getTimelineStats(patientId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get timeline stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRecentTimeline = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const timeline = await TimelineService.getRecentTimeline(
      req.user?.hospital || req.user?.hospitalId,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Get recent timeline error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markTimelineRead = async (req, res) => {
  try {
    const { patientId } = req.params;
    await TimelineService.markAsRead(patientId);
    
    res.json({
      success: true,
      message: 'Timeline marked as read'
    });
  } catch (error) {
    console.error('Mark timeline read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addTimelineEvent = async (req, res) => {
  try {
    const event = await TimelineService.addEvent({
      ...req.body,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Add timeline event error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};