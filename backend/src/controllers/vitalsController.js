const Vitals = require('../models/Vitals');
const Patient = require('../models/Patient');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const Timeline = require('../models/Timeline');
const DataQuality = require('../models/DataQuality');
const mlService = require('../services/mlService');
const TimelineService = require('../services/timelineService');

let io = null;
try {
  io = require('../../server').io;
} catch (e) {
  console.warn('⚠️ WebSocket not available, continuing without it');
}

exports.addVitals = async (req, res) => {
  try {
    const {
      patientId,
      temperature,
      heartRate,
      systolicBP,
      diastolicBP,
      respiratoryRate,
      spo2,
      notes
    } = req.body;

    if (!patientId || !temperature || !heartRate || !systolicBP || !diastolicBP || !respiratoryRate || !spo2) {
      return res.status(400).json({
        success: false,
        message: 'All vitals fields are required'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const isAbnormal = (
      heartRate > 100 || heartRate < 60 ||
      temperature > 100.4 || temperature < 97.0 ||
      systolicBP > 140 || systolicBP < 90 ||
      diastolicBP > 90 || diastolicBP < 60 ||
      spo2 < 95 ||
      respiratoryRate > 22 || respiratoryRate < 12
    );

    const missingFields = [];
    let completenessScore = 100;

    if (!temperature || temperature < 90 || temperature > 110) {
      missingFields.push('temperature');
      completenessScore -= 15;
    }
    if (!heartRate || heartRate < 20 || heartRate > 250) {
      missingFields.push('heartRate');
      completenessScore -= 15;
    }
    if (!systolicBP || systolicBP < 40 || systolicBP > 250) {
      missingFields.push('systolicBP');
      completenessScore -= 15;
    }
    if (!diastolicBP || diastolicBP < 20 || diastolicBP > 150) {
      missingFields.push('diastolicBP');
      completenessScore -= 15;
    }
    if (!respiratoryRate || respiratoryRate < 5 || respiratoryRate > 60) {
      missingFields.push('respiratoryRate');
      completenessScore -= 15;
    }
    if (!spo2 || spo2 < 50 || spo2 > 100) {
      missingFields.push('spo2');
      completenessScore -= 15;
    }

    const vitals = new Vitals({
      patient: patientId,
      temperature,
      heartRate,
      systolicBP,
      diastolicBP,
      respiratoryRate,
      spo2,
      recordedBy: req.user.id,
      notes,
      isAbnormal,
      dataQuality: {
        completenessScore: Math.max(0, completenessScore),
        missingFields: missingFields,
        imputationMethod: missingFields.length > 0 ? 'mean' : 'none'
      }
    });

    const vitalsData = {
      heartRate,
      temperature,
      systolicBP,
      diastolicBP,
      spo2,
      respirationRate: respiratoryRate,
      age: patient.age,
      gender: patient.gender,
      previousRisk: patient.currentRisk || 0
    };

    const mlResult = await Promise.race([
      mlService.predict(vitalsData),
      new Promise((_, reject) => setTimeout(() => reject(new Error('ML prediction timeout')), 10000))
    ]);

    vitals.riskScore = mlResult.riskScore;
    vitals.sepsisProbability = mlResult.sepsisProbability;
    vitals.alertGenerated = mlResult.alertGenerated;

    await vitals.save();

    const prediction = new Prediction({
      patient: patientId,
      vitals: vitals._id,
      riskScore: mlResult.riskScore,
      riskLevel: mlResult.riskLevel || (
        mlResult.riskScore >= 80 ? 'CRITICAL' : 
        mlResult.riskScore >= 60 ? 'HIGH' : 
        mlResult.riskScore >= 40 ? 'MEDIUM' : 'LOW'
      ),
      confidence: mlResult.confidence,
      predictedFor: new Date(Date.now() + 6 * 60 * 60 * 1000),
      modelVersion: mlResult.modelVersion || 'v1.0',
      explanation: mlResult.explanation || '',
      shapValues: mlResult.shapValues || {},
      topFactors: mlResult.topFactors || [],
      recommendations: mlResult.recommendations || [],
      dataQualityScore: completenessScore,
      alertGenerated: mlResult.alertGenerated,
      alertMessage: mlResult.alertMessage,
      status: mlResult.status
    });

    await prediction.save();

    patient.currentRisk = mlResult.riskScore;
    patient.currentStatus = mlResult.status;
    patient.aiConfidence = mlResult.confidence;
    patient.lastVitalsUpdate = new Date();
    patient.vitalsHistory.push(vitals._id);
    patient.predictions.push(prediction._id);
    patient.riskHistory.push(mlResult.riskScore);

    if (patient.riskHistory.length > 50) {
      patient.riskHistory = patient.riskHistory.slice(-50);
    }

    await patient.save();

    const dataQuality = new DataQuality({
      patient: patientId,
      vitalsId: vitals._id,
      completenessScore: completenessScore,
      missingFields: missingFields,
      imputationMethod: missingFields.length > 0 ? 'mean' : 'none',
      confidenceScore: mlResult.confidence,
      warnings: completenessScore < 70 ? ['Low data completeness - consider rechecking vitals'] : []
    });

    await dataQuality.save();

    // ============ TIMELINE EVENTS ============
    try {
      await TimelineService.addVitalsEvent(
        patientId,
        {
          heartRate,
          temperature,
          systolicBP,
          diastolicBP,
          respiratoryRate,
          spo2
        },
        req.user.id
      );

      await TimelineService.addSepsisRiskEvent(
        patientId,
        mlResult.riskScore,
        {
          riskScore: mlResult.riskScore,
          riskLevel: mlResult.riskLevel,
          confidence: mlResult.confidence,
          status: mlResult.status
        },
        req.user.id
      );

      await TimelineService.addPredictionEvent(
        patientId,
        {
          _id: prediction._id,
          riskScore: mlResult.riskScore,
          riskLevel: mlResult.riskLevel,
          confidence: mlResult.confidence,
          topFactors: mlResult.topFactors || []
        },
        req.user.id
      );

      const oldStatus = patient.currentStatus || 'STABLE';
      if (oldStatus !== mlResult.status) {
        await TimelineService.addStatusChangeEvent(
          patientId,
          oldStatus,
          mlResult.status,
          `AI prediction updated status to ${mlResult.status}`,
          req.user.id
        );
      }

      if (mlResult.alertGenerated) {
        await TimelineService.addAlertEvent(
          patientId,
          mlResult.riskScore >= 80 ? 'CRITICAL_SEPSIS_RISK' : 'RISK_INCREASE',
          mlResult.alertMessage || `Risk increased to ${mlResult.riskScore}%`,
          req.user.id
        );
      }
    } catch (timelineError) {
      console.warn('⚠️ Timeline event failed:', timelineError.message);
    }

    const timeline = new Timeline({
      patient: patientId,
      eventType: 'VITALS_RECORDED',
      title: 'Vitals Recorded',
      description: `HR: ${heartRate}, BP: ${systolicBP}/${diastolicBP}, Temp: ${temperature}°F, SpO2: ${spo2}%`,
      eventTime: new Date(),
      createdBy: req.user.id,
      isImportant: isAbnormal || mlResult.alertGenerated,
      metadata: {
        vitalsId: vitals._id,
        risk: mlResult.riskScore,
        status: mlResult.status
      }
    });

    await timeline.save();

    if (mlResult.alertGenerated) {
      const alert = new Alert({
        patient: patientId,
        alertType: mlResult.riskScore >= 80 ? 'SEPSIS_ALERT' : 'RISK_INCREASE',
        message: mlResult.alertMessage || `Risk increased to ${mlResult.riskScore}%`,
        severity: mlResult.riskScore >= 80 ? 'CRITICAL' : 'WARNING',
        priority: mlResult.riskScore >= 80 ? 5 : 3,
        previousRisk: patient.riskHistory.length > 1 ? patient.riskHistory[patient.riskHistory.length - 2] : 0,
        currentRisk: mlResult.riskScore,
        vitalsId: vitals._id
      });

      await alert.save();
      patient.alerts.push(alert._id);

      if (io) {
        try {
          io.emit('alert-triggered', {
            patientId: patient._id,
            patientName: patient.name,
            ward: patient.ward,
            risk: mlResult.riskScore,
            message: mlResult.alertMessage,
            type: alert.alertType,
            severity: alert.severity,
            alertId: alert._id
          });
        } catch (wsError) {
          console.warn('⚠️ WebSocket alert emit failed:', wsError.message);
        }
      }

      const alertTimeline = new Timeline({
        patient: patientId,
        eventType: 'ALERT_TRIGGERED',
        title: `Alert: ${alert.alertType}`,
        description: alert.message,
        eventTime: new Date(),
        createdBy: req.user.id,
        isImportant: true,
        metadata: {
          alertId: alert._id,
          severity: alert.severity,
          risk: mlResult.riskScore
        }
      });

      await alertTimeline.save();
    }

    await patient.save();

    if (io) {
      try {
        io.to(`ward-${patient.ward}`).emit('vitals-updated', {
          patientId: patient._id,
          patientName: patient.name,
          ward: patient.ward,
          vitals: {
            heartRate,
            temperature,
            systolicBP,
            diastolicBP,
            spo2,
            respiratoryRate
          },
          risk: mlResult
        });

        io.to(`patient-${patient._id}`).emit('patient-vitals-updated', {
          vitals: vitals,
          risk: mlResult,
          dataQuality: dataQuality
        });

        io.emit('prediction-result', {
          patientId: patient._id,
          patientName: patient.name,
          ward: patient.ward,
          risk: mlResult.riskScore,
          sepsisProbability: mlResult.sepsisProbability,
          confidence: mlResult.confidence,
          status: mlResult.status,
          recommendations: mlResult.recommendations
        });
      } catch (wsError) {
        console.warn('⚠️ WebSocket emit failed:', wsError.message);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        vitals,
        prediction,
        dataQuality,
        patient: {
          id: patient._id,
          name: patient.name,
          risk: patient.currentRisk,
          status: patient.currentStatus,
          confidence: patient.aiConfidence
        },
        mlResult,
        alertGenerated: mlResult.alertGenerated,
        timeline: timeline
      }
    });

  } catch (error) {
    console.error('Add vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add vitals'
    });
  }
};

exports.getVitalsHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const vitals = await Vitals.find({ patient: patientId })
      .sort({ recordedTime: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('recordedBy', 'name role');

    const total = await Vitals.countDocuments({ patient: patientId });

    res.json({
      success: true,
      data: {
        vitals,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Get vitals history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLatestVitals = async (req, res) => {
  try {
    const { patientId } = req.params;

    const vitals = await Vitals.findOne({ patient: patientId })
      .sort({ recordedTime: -1 })
      .populate('recordedBy', 'name');

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'No vitals found for this patient'
      });
    }

    res.json({
      success: true,
      data: vitals
    });

  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getVitalsById = async (req, res) => {
  try {
    const { id } = req.params;

    const vitals = await Vitals.findById(id)
      .populate('patient', 'name mrn ward age gender')
      .populate('recordedBy', 'name role');

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }

    res.json({
      success: true,
      data: vitals
    });

  } catch (error) {
    console.error('Get vitals by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getVitalsQuality = async (req, res) => {
  try {
    const { patientId } = req.params;

    const vitals = await Vitals.find({ patient: patientId })
      .sort({ recordedTime: -1 })
      .limit(10)
      .populate('recordedBy', 'name');

    const quality = await DataQuality.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        vitals,
        quality
      }
    });

  } catch (error) {
    console.error('Get vitals quality error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllVitals = async (req, res) => {
  try {
    const { limit = 100, skip = 0, from, to } = req.query;

    const query = {};
    if (from && to) {
      query.recordedTime = { $gte: new Date(from), $lte: new Date(to) };
    }

    const vitals = await Vitals.find(query)
      .sort({ recordedTime: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('patient', 'name mrn ward currentStatus')
      .populate('recordedBy', 'name');

    const total = await Vitals.countDocuments(query);

    const stats = await Vitals.aggregate([
      { $match: query },
      { $group: {
          _id: null,
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          avgSystolicBP: { $avg: '$systolicBP' },
          avgDiastolicBP: { $avg: '$diastolicBP' },
          avgSpo2: { $avg: '$spo2' },
          avgRespiratoryRate: { $avg: '$respiratoryRate' },
          avgRiskScore: { $avg: '$riskScore' },
          totalAbnormal: { $sum: { $cond: ['$isAbnormal', 1, 0] } },
          totalAlerts: { $sum: { $cond: ['$alertGenerated', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        vitals,
        stats: stats[0] || {},
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Get all vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getVitalsTrend = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const vitals = await Vitals.find({
      patient: patientId,
      recordedTime: { $gte: since }
    })
      .sort({ recordedTime: 1 })
      .select('heartRate temperature systolicBP diastolicBP spo2 respiratoryRate recordedTime riskScore');

    const trend = {
      labels: vitals.map(v => v.recordedTime),
      heartRate: vitals.map(v => v.heartRate),
      temperature: vitals.map(v => v.temperature),
      systolicBP: vitals.map(v => v.systolicBP),
      diastolicBP: vitals.map(v => v.diastolicBP),
      spo2: vitals.map(v => v.spo2),
      respiratoryRate: vitals.map(v => v.respiratoryRate),
      riskScore: vitals.map(v => v.riskScore)
    };

    res.json({
      success: true,
      data: trend
    });

  } catch (error) {
    console.error('Get vitals trend error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAbnormalVitals = async (req, res) => {
  try {
    const { patientId } = req.params;

    const vitals = await Vitals.find({
      patient: patientId,
      isAbnormal: true
    })
      .sort({ recordedTime: -1 })
      .limit(10)
      .populate('recordedBy', 'name');

    res.json({
      success: true,
      data: vitals
    });

  } catch (error) {
    console.error('Get abnormal vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteVitals = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'HOSPITAL_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete vitals records'
      });
    }

    const vitals = await Vitals.findByIdAndDelete(id);

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: 'Vitals record not found'
      });
    }

    await Patient.updateOne(
      { vitalsHistory: id },
      { $pull: { vitalsHistory: id } }
    );

    res.json({
      success: true,
      message: 'Vitals record deleted successfully'
    });

  } catch (error) {
    console.error('Delete vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRecentVitals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const vitals = await Vitals.find()
      .sort({ recordedTime: -1 })
      .limit(parseInt(limit))
      .populate('patient', 'name mrn ward currentStatus')
      .populate('recordedBy', 'name');

    res.json({
      success: true,
      data: vitals
    });

  } catch (error) {
    console.error('Get recent vitals error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getVitalsSummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const summary = await Vitals.aggregate([
      { $match: { recordedTime: { $gte: since } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedTime' } },
          count: { $sum: 1 },
          avgHeartRate: { $avg: '$heartRate' },
          avgTemperature: { $avg: '$temperature' },
          avgSystolicBP: { $avg: '$systolicBP' },
          avgDiastolicBP: { $avg: '$diastolicBP' },
          avgSpo2: { $avg: '$spo2' },
          avgRespiratoryRate: { $avg: '$respiratoryRate' },
          avgRiskScore: { $avg: '$riskScore' },
          abnormalCount: { $sum: { $cond: ['$isAbnormal', 1, 0] } },
          alertCount: { $sum: { $cond: ['$alertGenerated', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get vitals summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};