const Patient = require('../models/Patient');
const Vitals = require('../models/Vitals');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const Timeline = require('../models/Timeline');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ============================================
// 1. GET ALL PATIENTS
// ============================================
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true })
      .sort({ currentRisk: -1 })
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedNurse', 'name email')
      .populate('createdBy', 'name')
      .populate({
        path: 'vitalsHistory',
        options: { sort: { recordedTime: -1 }, limit: 1 }
      });

    res.json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 2. GET HIGH RISK PATIENTS
// ============================================
exports.getHighRiskPatients = async (req, res) => {
  try {
    const { threshold = 60 } = req.query;

    const patients = await Patient.find({
      currentRisk: { $gte: parseInt(threshold) },
      isActive: true,
      currentStatus: { $ne: 'DISCHARGED' }
    })
      .sort({ currentRisk: -1 })
      .populate('assignedDoctor', 'name')
      .populate('assignedNurse', 'name')
      .populate({
        path: 'vitalsHistory',
        options: { sort: { recordedTime: -1 }, limit: 1 }
      });

    res.json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error('Get high risk patients error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 3. GET PATIENTS BY WARD
// ============================================
exports.getPatientsByWard = async (req, res) => {
  try {
    const { ward } = req.params;

    const patients = await Patient.find({
      ward: ward,
      isActive: true,
      currentStatus: { $ne: 'DISCHARGED' }
    })
      .sort({ currentRisk: -1 })
      .populate('assignedDoctor', 'name')
      .populate('assignedNurse', 'name');

    res.json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error('Get patients by ward error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 4. GET PATIENT BY ID
// ============================================
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id)
      .populate('assignedDoctor', 'name email specialization')
      .populate('assignedNurse', 'name email')
      .populate('createdBy', 'name email')
      .populate({
        path: 'vitalsHistory',
        options: { sort: { recordedTime: -1 }, limit: 10 }
      })
      .populate({
        path: 'predictions',
        options: { sort: { createdAt: -1 }, limit: 10 }
      })
      .populate({
        path: 'alerts',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 5. CREATE PATIENT WITH USER ACCOUNT (FIXED)
// ============================================
exports.createPatient = async (req, res) => {
  try {
    console.log('📝 Creating patient with data:', req.body);

    const {
      name,
      age,
      gender,
      ward,
      bedNumber,
      diagnosis,
      medicalHistory,
      allergies,
      assignedDoctor,
      assignedNurse,
      contactNumber,
      email,
      password,
      emergencyContact,
      address
    } = req.body;

    // Validate
    if (!name || !age || !gender || !ward) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender and ward are required'
      });
    }

    // Check email
    let userId = null;
    let user = null;

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      if (password && password.length >= 6) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          name,
          email,
          password: hashedPassword,
          role: 'PATIENT',
          hospital: req.user?.hospital || null,
          isActive: true
        });
        await user.save();
        userId = user._id;
        console.log('✅ User account created for patient:', email);
      }
    }

    // Create patient
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);

    const patient = new Patient({
      patientId: `PAT-${timestamp}-${random}`,
      mrn: `MRN-${timestamp}`,
      name,
      age: parseInt(age),
      gender,
      ward,
      bedNumber: bedNumber || '',
      diagnosis: diagnosis || '',
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      assignedDoctor,
      assignedNurse,
      contactNumber: contactNumber || '',
      email: email || '',
      userId: userId,
      emergencyContact: emergencyContact || {},
      address: address || {},
      createdBy: req.user?.id || null,
      riskHistory: [0],
      statusHistory: [{
        status: 'STABLE',
        timestamp: new Date(),
        reason: 'Patient admitted'
      }]
    });

    await patient.save();
    console.log('✅ Patient created:', patient.name);

    // Update user with patient reference
    if (user) {
      user.patientId = patient._id;
      await user.save();
    }

    // Timeline
    try {
      const timeline = new Timeline({
        patient: patient._id,
        eventType: 'ADMISSION',
        title: 'Patient Admitted',
        description: `Admitted to ${ward}${diagnosis ? ` with diagnosis: ${diagnosis}` : ''}`,
        eventTime: new Date(),
        createdBy: req.user?.id || null,
        isImportant: true
      });
      await timeline.save();
    } catch (timelineError) {
      console.warn('Timeline creation failed:', timelineError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        patient,
        userCreated: !!userId,
        user: user ? {
          id: user._id,
          email: user.email,
          role: user.role
        } : null,
        message: userId ? 'Patient and user account created successfully' : 'Patient created successfully'
      }
    });

  } catch (error) {
    console.error('❌ Create patient error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create patient'
    });
  }
};

// ============================================
// 6. UPDATE PATIENT
// ============================================
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    delete updates._id;
    delete updates.createdBy;
    delete updates.vitalsHistory;
    delete updates.riskHistory;
    delete updates.statusHistory;
    delete updates.patientId;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        patient[key] = updates[key];
      }
    });

    await patient.save();

    res.json({
      success: true,
      data: patient
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 7. DELETE PATIENT
// ============================================
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'HOSPITAL_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete patients'
      });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient.isActive = false;
    patient.isDischarged = true;
    patient.dischargeDate = new Date();
    await patient.save();

    res.json({
      success: true,
      message: 'Patient deactivated successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 8. GET PATIENT FULL DETAILS
// ============================================
exports.getPatientFullDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id)
      .populate('assignedDoctor', 'name email role specialization')
      .populate('assignedNurse', 'name email role')
      .populate('createdBy', 'name email')
      .populate({
        path: 'vitalsHistory',
        options: { sort: { recordedTime: -1 }, limit: 20 },
        populate: {
          path: 'recordedBy',
          select: 'name'
        }
      })
      .populate({
        path: 'predictions',
        options: { sort: { createdAt: -1 }, limit: 10 }
      })
      .populate({
        path: 'alerts',
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const latestPrediction = await Prediction.findOne({ patient: id })
      .sort({ createdAt: -1 })
      .populate('vitals');

    res.json({
      success: true,
      data: {
        patient,
        latestPrediction,
        vitalsCount: patient.vitalsHistory.length,
        predictionsCount: patient.predictions.length,
        alertsCount: patient.alerts.length
      }
    });

  } catch (error) {
    console.error('Get patient full details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 9. GET PATIENT TREND
// ============================================
exports.getPatientTrend = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const vitals = await Vitals.find({
      patient: id,
      recordedTime: { $gte: since }
    })
      .sort({ recordedTime: 1 })
      .select('heartRate temperature systolicBP diastolicBP spo2 respiratoryRate recordedTime riskScore');

    const predictions = await Prediction.find({
      patient: id,
      createdAt: { $gte: since }
    })
      .sort({ createdAt: 1 })
      .select('riskScore createdAt');

    const trend = {
      labels: vitals.map(v => v.recordedTime),
      heartRate: vitals.map(v => v.heartRate),
      temperature: vitals.map(v => v.temperature),
      systolicBP: vitals.map(v => v.systolicBP),
      diastolicBP: vitals.map(v => v.diastolicBP),
      spo2: vitals.map(v => v.spo2),
      respiratoryRate: vitals.map(v => v.respiratoryRate),
      riskScore: vitals.map(v => v.riskScore),
      predictions: predictions.map(p => ({
        time: p.createdAt,
        risk: p.riskScore
      }))
    };

    res.json({
      success: true,
      data: trend
    });

  } catch (error) {
    console.error('Get patient trend error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 10. GET STATS SUMMARY
// ============================================
exports.getStatsSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({ isActive: true });
    const critical = await Patient.countDocuments({ currentStatus: 'CRITICAL', isActive: true });
    const warning = await Patient.countDocuments({ currentStatus: 'WARNING', isActive: true });
    const stable = await Patient.countDocuments({ currentStatus: 'STABLE', isActive: true });
    const sepsis = await Patient.countDocuments({ currentStatus: 'SEPSIS', isActive: true });

    const wardStats = await Patient.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: '$ward',
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$currentStatus', 'CRITICAL'] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ['$currentStatus', 'WARNING'] }, 1, 0] } },
          stable: { $sum: { $cond: [{ $eq: ['$currentStatus', 'STABLE'] }, 1, 0] } },
          sepsis: { $sum: { $cond: [{ $eq: ['$currentStatus', 'SEPSIS'] }, 1, 0] } },
          avgRisk: { $avg: '$currentRisk' }
        }
      }
    ]);

    const recentAlerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patient', 'name mrn ward');

    res.json({
      success: true,
      data: {
        total: totalPatients,
        critical,
        warning,
        stable,
        sepsis,
        wardStats,
        recentAlerts
      }
    });

  } catch (error) {
    console.error('Get stats summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 11. DISCHARGE PATIENT
// ============================================
exports.dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { dischargeNotes } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient.isDischarged = true;
    patient.isActive = false;
    patient.dischargeDate = new Date();
    patient.currentStatus = 'DISCHARGED';
    patient.notes = dischargeNotes || 'Patient discharged';

    await patient.save();

    const timeline = new Timeline({
      patient: patient._id,
      eventType: 'DISCHARGE',
      title: 'Patient Discharged',
      description: dischargeNotes || 'Patient discharged from hospital',
      eventTime: new Date(),
      createdBy: req.user.id,
      isImportant: true
    });

    await timeline.save();

    res.json({
      success: true,
      data: patient,
      message: 'Patient discharged successfully'
    });

  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 12. SEARCH PATIENTS
// ============================================
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const patients = await Patient.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { patientId: { $regex: q, $options: 'i' } },
        { mrn: { $regex: q, $options: 'i' } },
        { diagnosis: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
      .limit(20)
      .populate('assignedDoctor', 'name')
      .populate('assignedNurse', 'name');

    res.json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// 13. GET PATIENT TIMELINE
// ============================================
exports.getPatientTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    const timeline = await Timeline.find({ patient: id })
      .sort({ eventTime: -1 })
      .limit(parseInt(limit))
      .populate('createdBy', 'name');

    res.json({
      success: true,
      data: timeline
    });

  } catch (error) {
    console.error('Get patient timeline error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};