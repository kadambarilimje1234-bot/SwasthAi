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
      'ADMISSION', 'VITALS_RECORDED', 'LAB_REPORT', 'PREDICTION_GENERATED', 
      'ALERT_TRIGGERED', 'DOCTOR_NOTIFIED', 'TREATMENT_STARTED', 
      'STATUS_CHANGED', 'REPORT_GENERATED', 'DISCHARGE'
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
  }
}, {
  timestamps: true
});

timelineSchema.index({ patient: 1, eventTime: -1 });

module.exports = mongoose.model('Timeline', timelineSchema);