const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  vitals: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals',
    required: true
  },
  labReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabReport',
    default: null
  },
  // Core prediction
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  predictedFor: {
    type: Date,
    required: true
  },
  predictionTime: {
    type: Date,
    default: Date.now
  },
  modelVersion: {
    type: String,
    default: 'v1.0'
  },
  // Explainable AI
  explanation: {
    type: String,
    default: ''
  },
  shapValues: {
    type: Object,
    default: {}
  },
  topFactors: [{
    feature: String,
    impact: Number,
    direction: {
      type: String,
      enum: ['positive', 'negative']
    }
  }],
  recommendations: [{
    type: String
  }],
  // Data quality
  dataQualityScore: {
    type: Number,
    default: 100
  },
  // Alert
  alertGenerated: {
    type: Boolean,
    default: false
  },
  alertMessage: {
    type: String,
    default: ''
  },
  // Status
  status: {
    type: String,
    enum: ['STABLE', 'WARNING', 'CRITICAL', 'SEPSIS'],
    required: true
  }
}, {
  timestamps: true
});

// Indexes
predictionSchema.index({ patient: 1, createdAt: -1 });
predictionSchema.index({ riskScore: -1 });
predictionSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Prediction', predictionSchema);