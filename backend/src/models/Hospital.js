const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  hospitalCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    pincode: { type: String, default: '' }
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  logo: {
    type: String,
    default: ''
  },
  // ✅ VALID ENUMS - Add 'General' here
  departments: [{
    type: String,
    enum: ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Cardiology', 
           'Neurology', 'Orthopedics', 'Obstetrics', 'Oncology', 'General']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  totalBeds: {
    type: Number,
    default: 0
  },
  availableBeds: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);