const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['RISK_INCREASE', 'CRITICAL_VITAL', 'SEPSIS_ALERT', 'DETERIORATION', 'LAB_ABNORMAL'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'],
    default: 'PENDING'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  // Additional data
  previousRisk: {
    type: Number,
    default: null
  },
  currentRisk: {
    type: Number,
    default: null
  },
  vitalsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals',
    default: null
  }
}, {
  timestamps: true
});

alertSchema.index({ patient: 1, createdAt: -1 });
alertSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);