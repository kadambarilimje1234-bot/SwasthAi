const mongoose = require('mongoose');

const aiActivityLogSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['RISK_UPDATE', 'PREDICTION', 'ALERT', 'RECOMMENDATION', 'EXPLANATION'],
    required: true
  },
  previousRisk: {
    type: Number,
    default: null
  },
  currentRisk: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  topFactors: [{
    feature: String,
    impact: Number
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggerType: {
    type: String,
    enum: ['VITALS_UPDATE', 'LAB_UPDATE', 'SCHEDULED', 'MANUAL'],
    default: 'VITALS_UPDATE'
  }
}, {
  timestamps: true
});

aiActivityLogSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('AIActivityLog', aiActivityLogSchema);