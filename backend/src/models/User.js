const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DOCTOR', 'NURSE', 'HOSPITAL_ADMIN', 'PATIENT'],
    required: true,
    default: 'NURSE'
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  specialization: {
    type: String,
    default: ''
  },
  ward: {
    type: String,
    enum: ['ICU A', 'ICU B', 'Ward A', 'Ward B', 'Ward C', 'Emergency', 'ALL'],
    default: 'ALL'
  },
  phone: {
    type: String,
    default: ''
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'General'
  },
  profileImage: {
    type: String,
    default: ''
  },
  // For patient users - reference to patient record
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);