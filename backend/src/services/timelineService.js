const Timeline = require('../models/Timeline');
const Patient = require('../models/Patient');

class TimelineService {
  async addEvent(data) {
    try {
      const event = new Timeline({
        ...data,
        eventTime: data.eventTime || new Date()
      });
      await event.save();

      await Patient.findByIdAndUpdate(data.patient, {
        lastActivity: new Date()
      });

      return event;
    } catch (error) {
      console.error('Timeline addEvent error:', error);
      throw error;
    }
  }

  async addVitalsEvent(patientId, vitalsData, recordedBy) {
    const vitalsText = Object.entries(vitalsData)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([key, value]) => {
        const labels = {
          heartRate: 'HR',
          temperature: 'Temp',
          systolicBP: 'SBP',
          diastolicBP: 'DBP',
          spo2: 'SpO2',
          respiratoryRate: 'RR',
          wbc: 'WBC',
          rbc: 'RBC'
        };
        return `${labels[key] || key}: ${value}`;
      })
      .join(', ');

    return await this.addEvent({
      patient: patientId,
      eventType: 'VITALS_RECORDED',
      title: '📊 Vitals Recorded',
      description: vitalsText || 'Vitals updated',
      eventTime: new Date(),
      createdBy: recordedBy,
      metadata: { vitals: vitalsData }
    });
  }

  async addSepsisRiskEvent(patientId, riskScore, predictionData, recordedBy) {
    const severity = riskScore >= 80 ? 'CRITICAL' : 
                     riskScore >= 60 ? 'HIGH' : 
                     riskScore >= 40 ? 'MEDIUM' : 'LOW';

    return await this.addEvent({
      patient: patientId,
      eventType: 'SEPSIS_RISK_UPDATED',
      title: `🧠 Sepsis Risk: ${riskScore}%`,
      description: `AI predicted sepsis risk at ${riskScore}%`,
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: severity,
      isFlagged: riskScore >= 70,
      riskScore: riskScore,
      metadata: {
        riskScore,
        predictionData,
        riskLevel: severity
      }
    });
  }

  async addPredictionEvent(patientId, predictionData, recordedBy) {
    return await this.addEvent({
      patient: patientId,
      eventType: 'PREDICTION_GENERATED',
      title: `📈 Prediction: ${predictionData.riskLevel || 'Updated'}`,
      description: `Risk score: ${predictionData.riskScore}%, Confidence: ${predictionData.confidence}%`,
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: predictionData.riskScore >= 70 ? 'HIGH' : 'MEDIUM',
      isFlagged: predictionData.riskScore >= 70,
      riskScore: predictionData.riskScore,
      metadata: {
        predictionId: predictionData._id,
        riskScore: predictionData.riskScore,
        riskLevel: predictionData.riskLevel,
        confidence: predictionData.confidence,
        topFactors: predictionData.topFactors || []
      }
    });
  }

  async addDoctorReviewEvent(patientId, doctorId, reviewNotes, recordedBy) {
    return await this.addEvent({
      patient: patientId,
      eventType: 'DOCTOR_REVIEW',
      title: '👨‍⚕️ Doctor Review',
      description: reviewNotes || 'Patient reviewed by doctor',
      eventTime: new Date(),
      createdBy: recordedBy || doctorId,
      severity: 'MEDIUM',
      metadata: {
        doctorId,
        reviewNotes,
        reviewedAt: new Date()
      }
    });
  }

  async addMedicationEvent(patientId, medication, dosage, recordedBy) {
    return await this.addEvent({
      patient: patientId,
      eventType: 'MEDICATION_STARTED',
      title: `💊 Medication: ${medication}`,
      description: `${medication} ${dosage} administered`,
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: 'HIGH',
      metadata: {
        medication,
        dosage,
        startedAt: new Date()
      }
    });
  }

  async addStatusChangeEvent(patientId, oldStatus, newStatus, reason, recordedBy) {
    return await this.addEvent({
      patient: patientId,
      eventType: 'STATUS_CHANGED',
      title: `🔄 Status: ${oldStatus} → ${newStatus}`,
      description: reason || `Status changed from ${oldStatus} to ${newStatus}`,
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: newStatus === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
      isFlagged: newStatus === 'CRITICAL' || newStatus === 'SEPSIS',
      metadata: {
        oldStatus,
        newStatus,
        reason,
        changedAt: new Date()
      }
    });
  }

  async addAlertEvent(patientId, alertType, alertMessage, recordedBy) {
    return await this.addEvent({
      patient: patientId,
      eventType: 'ALERT_TRIGGERED',
      title: `🚨 ${alertType}`,
      description: alertMessage,
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: 'CRITICAL',
      isFlagged: true,
      metadata: {
        alertType,
        alertMessage,
        triggeredAt: new Date()
      }
    });
  }

  async addReminderEvent(patientId, reminderData, recordedBy) {
    const isCompleted = reminderData.completed || false;
    return await this.addEvent({
      patient: patientId,
      eventType: isCompleted ? 'REMINDER_COMPLETED' : 'REMINDER_CREATED',
      title: isCompleted ? '✅ Reminder Completed' : '⏰ Reminder Created',
      description: reminderData.title || reminderData.description || 'Reminder',
      eventTime: new Date(),
      createdBy: recordedBy,
      severity: 'MEDIUM',
      metadata: {
        reminderId: reminderData._id,
        reminderData,
        completedAt: isCompleted ? new Date() : null
      }
    });
  }

  async getPatientTimeline(patientId, filters = {}) {
    const query = { patient: patientId };
    
    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.severity) query.severity = filters.severity;
    if (filters.isFlagged !== undefined) query.isFlagged = filters.isFlagged === 'true';
    if (filters.startDate) {
      query.eventTime = { $gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      query.eventTime = { ...query.eventTime, $lte: new Date(filters.endDate) };
    }

    const limit = parseInt(filters.limit) || 50;
    const skip = parseInt(filters.skip) || 0;

    const events = await Timeline.find(query)
      .populate('createdBy', 'name role')
      .sort({ eventTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Timeline.countDocuments(query);

    return {
      events,
      pagination: {
        total,
        limit,
        skip,
        hasMore: (skip + limit) < total
      }
    };
  }

  async getTimelineStats(patientId) {
    const stats = await Timeline.aggregate([
      { $match: { patient: patientId } },
      { $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          latest: { $max: '$eventTime' }
        }
      }
    ]);

    const total = await Timeline.countDocuments({ patient: patientId });
    const flagged = await Timeline.countDocuments({ patient: patientId, isFlagged: true });
    const critical = await Timeline.countDocuments({ 
      patient: patientId, 
      severity: { $in: ['HIGH', 'CRITICAL'] } 
    });

    return {
      total,
      flagged,
      critical,
      breakdown: stats
    };
  }

  async getRecentTimeline(hospitalId, limit = 20) {
    const patients = await Patient.find({ hospital: hospitalId }).select('_id');
    const patientIds = patients.map(p => p._id);

    return await Timeline.find({
      patient: { $in: patientIds }
    })
      .populate('patient', 'name ward currentStatus')
      .populate('createdBy', 'name')
      .sort({ eventTime: -1 })
      .limit(limit);
  }

  async markAsRead(patientId) {
    return await Timeline.updateMany(
      { patient: patientId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new TimelineService();