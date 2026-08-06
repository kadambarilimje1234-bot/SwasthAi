const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // ============ BASIC INFORMATION ============
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  mrn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: true
  },
  
  // ============ HOSPITAL / WARD ============
  ward: {
    type: String,
    required: true,
    enum: ['ICU A', 'ICU B', 'Ward A', 'Ward B', 'Ward C', 'Emergency', 'Post-Operative', 'Maternity'],
    index: true
  },
  bedNumber: {
    type: String,
    default: '',
    trim: true
  },
  
  // ============ MEDICAL DETAILS ============
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  admissionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  diagnosis: {
    type: String,
    default: '',
    trim: true
  },
  medicalHistory: [{
    type: String,
    trim: true
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ============ ASSIGNED STAFF ============
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ============ PATIENT LOGIN ============
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true
  },

  // ============ CONTACT ============
  contactNumber: {
    type: String,
    default: ''
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },

  // ============ AI / RISK ============
  currentStatus: {
    type: String,
    enum: ['STABLE', 'WARNING', 'CRITICAL', 'SEPSIS', 'RECOVERING', 'DISCHARGED'],
    default: 'STABLE',
    index: true
  },
  currentRisk: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  aiConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastVitalsUpdate: {
    type: Date,
    default: null
  },

  // ============ HISTORY (References) ============
  vitalsHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vitals'
  }],
  labReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabReport'
  }],
  predictions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction'
  }],
  alerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  }],
  
  // ============ RISK HISTORY ============
  riskHistory: {
    type: [Number],
    default: []
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['STABLE', 'WARNING', 'CRITICAL', 'SEPSIS', 'RECOVERING', 'DISCHARGED']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],

  // ============ STATUS ============
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDischarged: {
    type: Boolean,
    default: false
  },

  // ============ ADDITIONAL ============
  notes: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============ VIRTUAL FIELDS ============
patientSchema.virtual('latestVitals', {
  ref: 'Vitals',
  localField: '_id',
  foreignField: 'patient',
  options: { sort: { recordedTime: -1 }, limit: 1 }
});

patientSchema.virtual('latestPrediction', {
  ref: 'Prediction',
  localField: '_id',
  foreignField: 'patient',
  options: { sort: { createdAt: -1 }, limit: 1 }
});

patientSchema.virtual('activeAlerts', {
  ref: 'Alert',
  localField: '_id',
  foreignField: 'patient',
  options: { 
    match: { status: { $in: ['PENDING', 'ACKNOWLEDGED'] } },
    sort: { createdAt: -1 }
  }
});

patientSchema.virtual('lengthOfStay').get(function() {
  if (this.dischargeDate) {
    return Math.ceil((this.dischargeDate - this.admissionDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((Date.now() - this.admissionDate) / (1000 * 60 * 60 * 24));
});

// ============ INDEXES ============
patientSchema.index({ patientId: 1 });
patientSchema.index({ mrn: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ ward: 1 });
patientSchema.index({ currentStatus: 1 });
patientSchema.index({ currentRisk: -1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ admissionDate: -1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ assignedNurse: 1 });
patientSchema.index({ userId: 1 });
patientSchema.index({ email: 1 });

// ============ MIDDLEWARE ============
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.patientId = `PAT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.mrn) {
    this.mrn = `MRN-${Date.now()}`;
  }
  next();
});

patientSchema.pre('save', function(next) {
  if (this.isModified('currentStatus')) {
    this.statusHistory.push({
      status: this.currentStatus,
      timestamp: new Date(),
      reason: `Status changed to ${this.currentStatus}`
    });
  }
  next();
});

// ============ STATIC METHODS ============
patientSchema.statics.findHighRisk = function(threshold = 60, limit = 20) {
  return this.find({
    currentRisk: { $gte: threshold },
    isActive: true,
    currentStatus: { $ne: 'DISCHARGED' }
  })
    .sort({ currentRisk: -1 })
    .limit(limit)
    .populate('assignedDoctor', 'name')
    .populate('assignedNurse', 'name');
};

patientSchema.statics.getWardSummary = function() {
  return this.aggregate([
    { $match: { isActive: true, currentStatus: { $ne: 'DISCHARGED' } } },
    { $group: {
        _id: '$ward',
        total: { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$currentStatus', 'CRITICAL'] }, 1, 0] } },
        warning: { $sum: { $cond: [{ $eq: ['$currentStatus', 'WARNING'] }, 1, 0] } },
        stable: { $sum: { $cond: [{ $eq: ['$currentStatus', 'STABLE'] }, 1, 0] } },
        sepsis: { $sum: { $cond: [{ $eq: ['$currentStatus', 'SEPSIS'] }, 1, 0] } },
        avgRisk: { $avg: '$currentRisk' },
        maxRisk: { $max: '$currentRisk' }
      }
    },
    { $sort: { avgRisk: -1 } }
  ]);
};

patientSchema.statics.getStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: {
        _id: null,
        total: { $sum: 1 },
        averageAge: { $avg: '$age' },
        male: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
        female: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$currentStatus', 'CRITICAL'] }, 1, 0] } },
        warning: { $sum: { $cond: [{ $eq: ['$currentStatus', 'WARNING'] }, 1, 0] } },
        stable: { $sum: { $cond: [{ $eq: ['$currentStatus', 'STABLE'] }, 1, 0] } },
        sepsis: { $sum: { $cond: [{ $eq: ['$currentStatus', 'SEPSIS'] }, 1, 0] } },
        avgRisk: { $avg: '$currentRisk' },
        maxRisk: { $max: '$currentRisk' }
      }
    }
  ]);
};

// ============ INSTANCE METHODS ============
patientSchema.methods.updateRisk = function(riskScore, confidence, status) {
  this.currentRisk = Math.round(Math.max(0, Math.min(100, riskScore)));
  this.aiConfidence = Math.round(Math.max(0, Math.min(100, confidence)));
  
  if (status) {
    this.currentStatus = status;
    this.statusHistory.push({
      status: status,
      timestamp: new Date(),
      reason: `AI risk score updated to ${this.currentRisk}%`
    });
  }
  
  this.riskHistory.push(this.currentRisk);
  if (this.riskHistory.length > 100) {
    this.riskHistory = this.riskHistory.slice(-100);
  }
  
  this.lastVitalsUpdate = new Date();
  return this.save();
};

patientSchema.methods.addVitals = function(vitalsId) {
  this.vitalsHistory.push(vitalsId);
  return this.save();
};

patientSchema.methods.addPrediction = function(predictionId) {
  this.predictions.push(predictionId);
  return this.save();
};

patientSchema.methods.addAlert = function(alertId) {
  this.alerts.push(alertId);
  return this.save();
};

patientSchema.methods.getRiskTrend = function(limit = 10) {
  return this.riskHistory.slice(-limit);
};

patientSchema.methods.isCritical = function() {
  return this.currentStatus === 'CRITICAL' || this.currentStatus === 'SEPSIS';
};

module.exports = mongoose.model('Patient', patientSchema);