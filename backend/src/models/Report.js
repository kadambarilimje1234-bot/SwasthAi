const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['RISK_SUMMARY', 'VITALS_TREND', 'PREDICTION_HISTORY', 'DAILY_ROUND', 'DISCHARGE', 'CLINICAL_TIMELINE'],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportURL: {
    type: String,
    default: ''
  },
  content: {
    type: Object,
    default: {}
  },
  dateRange: {
    from: Date,
    to: Date
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

reportSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);