const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  prediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    default: ''
  },
  wasAccurate: {
    type: Boolean,
    default: null
  },
  clinicalOutcome: {
    type: String,
    enum: ['IMPROVED', 'STABLE', 'DETERIORATED', 'UNKNOWN'],
    default: 'UNKNOWN'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);