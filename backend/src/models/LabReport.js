const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  // Basic sepsis markers
  wbc: {
    type: Number,
    default: null
  },
  platelets: {
    type: Number,
    default: null
  },
  lactate: {
    type: Number,
    default: null
  },
  crp: {
    type: Number,
    default: null
  },
  hemoglobin: {
    type: Number,
    default: null
  },
  procalcitonin: {
    type: Number,
    default: null
  },
  // Additional markers
  creatinine: {
    type: Number,
    default: null
  },
  bilirubin: {
    type: Number,
    default: null
  },
  // File upload
  uploadedFile: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  // AI extracted data
  extractedData: {
    type: Object,
    default: {}
  },
  isProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

labReportSchema.index({ patient: 1, reportDate: -1 });

module.exports = mongoose.model('LabReport', labReportSchema);