const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: [
      'ADMISSION', 
      'VITALS_RECORDED', 
      'LAB_REPORT', 
      'PREDICTION_GENERATED',
      'SEPSIS_RISK_UPDATED',
      'ALERT_TRIGGERED', 
      'DOCTOR_NOTIFIED',
      'DOCTOR_REVIEW',
      'TREATMENT_STARTED',
      'MEDICATION_STARTED',
      'STATUS_CHANGED', 
      'REPORT_GENERATED', 
      'DISCHARGE',
      'REMINDER_CREATED',
      'REMINDER_COMPLETED'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventTime: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  }
}, {
  timestamps: true
});

timelineSchema.index({ patient: 1, eventTime: -1 });
timelineSchema.index({ patient: 1, eventType: 1 });
timelineSchema.index({ isFlagged: 1 });
timelineSchema.index({ severity: 1 });

module.exports = mongoose.model('Timeline', timelineSchema);