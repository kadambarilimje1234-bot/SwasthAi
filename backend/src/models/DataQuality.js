const mongoose = require('mongoose');

const dataQualitySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  vitalsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals',
    required: true
  },
  completenessScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  missingFields: [{
    type: String
  }],
  imputationMethod: {
    type: String,
    enum: ['none', 'mean', 'median', 'mode', 'ml_impute'],
    default: 'none'
  },
  confidenceScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  warnings: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('DataQuality', dataQualitySchema);