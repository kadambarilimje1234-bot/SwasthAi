const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['ALERT', 'REPORT', 'REMINDER', 'SYSTEM', 'UPDATE'],
    default: 'SYSTEM'
  },
  link: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  }
}, {
  timestamps: true
});

notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);