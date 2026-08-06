const Prediction = require('../models/Prediction');
const Patient = require('../models/Patient');
const Vitals = require('../models/Vitals');
const Alert = require('../models/Alert');
const TimelineService = require('../services/timelineService');

exports.getPatientPredictions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const predictions = await Prediction.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('vitals')
      .populate('patient', 'name mrn ward');

    const total = await Prediction.countDocuments({ patient: patientId });

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Get patient predictions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLatestPrediction = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prediction = await Prediction.findOne({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate('vitals')
      .populate('patient', 'name mrn ward status');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'No predictions found for this patient'
      });
    }

    try {
      await TimelineService.addPredictionEvent(
        patientId,
        {
          _id: prediction._id,
          riskScore: prediction.riskScore,
          riskLevel: prediction.riskLevel,
          confidence: prediction.confidence,
          topFactors: prediction.topFactors || []
        },
        req.user?.id || null
      );
    } catch (timelineError) {
      console.warn('⚠️ Timeline prediction event failed:', timelineError.message);
    }

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Get latest prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRiskSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    const predictions = await Prediction.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('vitals');

    if (predictions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No predictions found'
      });
    }

    const patient = await Patient.findById(patientId);

    const trend = predictions.map(p => p.riskScore).reverse();
    const trendDirection = trend.length > 1 ? 
      (trend[trend.length - 1] - trend[0]) / trend.length : 0;

    const latestPrediction = predictions[0];

    const alerts = await Alert.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        currentRisk: patient?.currentRisk || 0,
        status: patient?.currentStatus || 'STABLE',
        confidence: patient?.aiConfidence || 0,
        trend: trend,
        trendDirection: trendDirection > 0 ? 'INCREASING' : trendDirection < 0 ? 'DECREASING' : 'STABLE',
        predictions: predictions,
        alerts: alerts,
        latestPrediction: latestPrediction
      }
    });

  } catch (error) {
    console.error('Get risk summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getHighRiskPatients = async (req, res) => {
  try {
    const { threshold = 60, limit = 20 } = req.query;

    const patients = await Patient.find({
      currentRisk: { $gte: parseInt(threshold) },
      isActive: true,
      currentStatus: { $ne: 'DISCHARGED' }
    })
      .sort({ currentRisk: -1 })
      .limit(parseInt(limit))
      .populate('assignedDoctor', 'name')
      .populate('assignedNurse', 'name')
      .populate({
        path: 'vitalsHistory',
        options: { sort: { recordedTime: -1 }, limit: 1 }
      });

    const patientIds = patients.map(p => p._id);
    const latestPredictions = await Prediction.find({
      patient: { $in: patientIds }
    })
      .sort({ createdAt: -1 })
      .populate('vitals');

    const predictionMap = {};
    latestPredictions.forEach(p => {
      if (!predictionMap[p.patient]) {
        predictionMap[p.patient] = p;
      }
    });

    const result = patients.map(p => ({
      ...p.toObject(),
      latestPrediction: predictionMap[p._id] || null
    }));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get high risk patients error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPredictionAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const predictions = await Prediction.find({
      createdAt: { $gte: since }
    })
      .populate('patient', 'name ward currentStatus');

    const total = predictions.length;
    const highRisk = predictions.filter(p => p.riskScore >= 70).length;
    const mediumRisk = predictions.filter(p => p.riskScore >= 40 && p.riskScore < 70).length;
    const lowRisk = predictions.filter(p => p.riskScore < 40).length;

    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / (total || 1);

    const dailyTrend = {};
    predictions.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      if (!dailyTrend[day]) {
        dailyTrend[day] = { total: 0, sum: 0, count: 0 };
      }
      dailyTrend[day].total += p.riskScore;
      dailyTrend[day].count++;
      dailyTrend[day].sum = dailyTrend[day].total / dailyTrend[day].count;
    });

    const wardDistribution = {};
    predictions.forEach(p => {
      const ward = p.patient?.ward || 'Unknown';
      if (!wardDistribution[ward]) {
        wardDistribution[ward] = { total: 0, count: 0, riskSum: 0 };
      }
      wardDistribution[ward].count++;
      wardDistribution[ward].riskSum += p.riskScore;
      wardDistribution[ward].total = wardDistribution[ward].riskSum / wardDistribution[ward].count;
    });

    const factorMap = {};
    predictions.forEach(p => {
      if (p.topFactors && p.topFactors.length > 0) {
        p.topFactors.forEach(f => {
          if (!factorMap[f.feature]) {
            factorMap[f.feature] = { sum: 0, count: 0 };
          }
          factorMap[f.feature].sum += f.impact;
          factorMap[f.feature].count++;
        });
      }
    });

    const topFactors = Object.entries(factorMap)
      .map(([feature, data]) => ({
        feature,
        avgImpact: Math.round(data.sum / data.count)
      }))
      .sort((a, b) => b.avgImpact - a.avgImpact)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        total,
        highRisk,
        mediumRisk,
        lowRisk,
        avgConfidence: Math.round(avgConfidence),
        dailyTrend: Object.entries(dailyTrend).map(([date, data]) => ({
          date,
          avgRisk: Math.round(data.sum)
        })),
        wardDistribution: Object.entries(wardDistribution).map(([ward, data]) => ({
          ward,
          count: data.count,
          avgRisk: Math.round(data.total)
        })),
        topFactors
      }
    });

  } catch (error) {
    console.error('Get prediction analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findById(id)
      .populate('patient', 'name mrn ward age gender currentStatus currentRisk')
      .populate('vitals');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Get prediction by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPredictionStats = async (req, res) => {
  try {
    const totalPredictions = await Prediction.countDocuments();
    const totalPatients = await Patient.countDocuments({ isActive: true });

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPredictions = await Prediction.countDocuments({
      createdAt: { $gte: last7Days }
    });

    const avgRisk = await Prediction.aggregate([
      { $group: { _id: null, avg: { $avg: '$riskScore' } } }
    ]);

    const modelVersions = await Prediction.aggregate([
      { $group: { _id: '$modelVersion', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPredictions,
        totalPatients,
        recentPredictions,
        avgRiskScore: Math.round(avgRisk[0]?.avg || 0),
        modelVersions: modelVersions.map(v => ({
          version: v._id,
          count: v.count
        }))
      }
    });

  } catch (error) {
    console.error('Get prediction stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPredictionsByDateRange = async (req, res) => {
  try {
    const { from, to, patientId } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and to dates are required'
      });
    }

    const query = {
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    };

    if (patientId) {
      query.patient = patientId;
    }

    const predictions = await Prediction.find(query)
      .sort({ createdAt: 1 })
      .populate('patient', 'name mrn ward')
      .populate('vitals');

    res.json({
      success: true,
      data: predictions
    });

  } catch (error) {
    console.error('Get predictions by date range error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPredictionSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPredictions = await Prediction.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const criticalPredictions = await Prediction.countDocuments({
      riskScore: { $gte: 80 },
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const increasingRisk = await Patient.find({
      isActive: true,
      currentStatus: { $ne: 'DISCHARGED' }
    }).select('riskHistory name');

    const increasingPatients = increasingRisk.filter(p => {
      if (p.riskHistory.length < 3) return false;
      const last = p.riskHistory[p.riskHistory.length - 1];
      const previous = p.riskHistory[p.riskHistory.length - 2];
      return last > previous;
    });

    const topRiskPatients = await Patient.find({
      isActive: true,
      currentStatus: { $ne: 'DISCHARGED' }
    })
      .sort({ currentRisk: -1 })
      .limit(5)
      .select('name ward currentRisk currentStatus');

    res.json({
      success: true,
      data: {
        todayPredictions,
        criticalPredictions,
        increasingRiskCount: increasingPatients.length,
        topRiskPatients,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get prediction summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};