const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  temperature: {
    type: Number,
    required: true,
    min: 90,
    max: 110
  },
  heartRate: {
    type: Number,
    required: true,
    min: 20,
    max: 250
  },
  systolicBP: {
    type: Number,
    required: true,
    min: 40,
    max: 250
  },
  diastolicBP: {
    type: Number,
    required: true,
    min: 20,
    max: 150
  },
  respiratoryRate: {
    type: Number,
    required: true,
    min: 5,
    max: 60
  },
  spo2: {
    type: Number,
    required: true,
    min: 50,
    max: 100
  },
  // ✅ NEW: WBC (White Blood Cells)
  wbc: {
    type: Number,
    required: false,
    min: 0.5,
    max: 50,
    default: null
  },
  // ✅ NEW: RBC (Red Blood Cells)
  rbc: {
    type: Number,
    required: false,
    min: 1.0,
    max: 8.0,
    default: null
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordedTime: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  // ML derived fields
  riskScore: {
    type: Number,
    default: 0
  },
  sepsisProbability: {
    type: Number,
    default: 0
  },
  isAbnormal: {
    type: Boolean,
    default: false
  },
  alertGenerated: {
    type: Boolean,
    default: false
  },
  // Data quality
  dataQuality: {
    completenessScore: {
      type: Number,
      default: 100
    },
    missingFields: [String],
    imputationMethod: {
      type: String,
      default: 'none'
    }
  }
}, {
  timestamps: true
});

// Index
vitalsSchema.index({ patient: 1, recordedTime: -1 });

module.exports = mongoose.model('Vitals', vitalsSchema);