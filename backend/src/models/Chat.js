const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  // AI context
  context: {
    riskScore: Number,
    status: String,
    recentVitals: Object,
    predictions: [String]
  },
  isHelpful: {
    type: Boolean,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

chatSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);