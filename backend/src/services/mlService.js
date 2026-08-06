const axios = require('axios');
const { PythonShell } = require('python-shell');
const path = require('path');

class MLService {
  constructor() {
    this.usePython = false;  // Mock mode for now
    this.serviceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.modelPath = path.join(__dirname, '../../ml_model');
  }

  // ============================================
  // CORRECT RISK CALCULATION
  // ============================================
  mockPrediction(vitals) {
    const { 
      heartRate, 
      temperature, 
      systolicBP, 
      diastolicBP, 
      spo2, 
      respirationRate, 
      age,
      previousRisk = 0 
    } = vitals;

    // ============ SIRS CRITERIA (Sepsis) ============
    let sirsCount = 0;
    let riskScore = 0;

    // 1. Heart Rate > 90
    if (heartRate > 90) {
      sirsCount++;
      riskScore += 10;
    } else if (heartRate < 60) {
      riskScore += 5;
    } else {
      riskScore -= 2;  // Normal range, reduce risk
    }

    // 2. Temperature > 100.4 OR < 97.0
    if (temperature > 100.4) {
      sirsCount++;
      riskScore += 15;
    } else if (temperature < 97.0) {
      sirsCount++;
      riskScore += 10;
    } else {
      riskScore -= 3;  // Normal temperature
    }

    // 3. Respiratory Rate > 20
    if (respirationRate > 20) {
      sirsCount++;
      riskScore += 10;
    } else if (respirationRate < 12) {
      riskScore += 5;
    } else {
      riskScore -= 2;  // Normal respiration
    }

    // 4. Systolic BP < 90 OR Diastolic BP < 60
    if (systolicBP < 90 || diastolicBP < 60) {
      sirsCount++;
      riskScore += 15;
    } else if (systolicBP > 140 || diastolicBP > 90) {
      riskScore += 5;  // Hypertension
    } else {
      riskScore -= 2;  // Normal BP
    }

    // ============ ADDITIONAL FACTORS ============
    // SpO2
    if (spo2 < 90) {
      riskScore += 15;
    } else if (spo2 < 95) {
      riskScore += 5;
    } else {
      riskScore -= 2;  // Normal SpO2
    }

    // Age factor
    if (age > 65) {
      riskScore += 5;
    } else if (age > 55) {
      riskScore += 3;
    }

    // ============ SEPSIS INDICATOR ============
    // If 2 or more SIRS criteria met + infection suspicion
    let sepsisRisk = 0;
    if (sirsCount >= 2) {
      sepsisRisk = 25;  // Base sepsis risk
      if (spo2 < 92) sepsisRisk += 15;
      if (temperature > 101.0) sepsisRisk += 10;
      if (heartRate > 110) sepsisRisk += 10;
    }

    // ============ FINAL RISK SCORE ============
    // Combine SIRS + Sepsis risk
    let finalRisk = Math.max(riskScore, sepsisRisk);
    
    // Ensure risk is between 0 and 100
    finalRisk = Math.max(0, Math.min(100, Math.round(finalRisk)));

    // ============ DETERMINE STATUS ============
    let status = 'STABLE';
    if (finalRisk >= 80) {
      status = 'CRITICAL';
    } else if (finalRisk >= 60) {
      status = 'WARNING';
    } else if (finalRisk >= 40) {
      status = 'WARNING';
    } else {
      status = 'STABLE';
    }

    // ============ FEATURE IMPORTANCE ============
    const featureImportance = {
      heartRate: heartRate > 90 ? 0.25 : heartRate < 60 ? 0.15 : 0.05,
      temperature: temperature > 100.4 ? 0.25 : temperature < 97.0 ? 0.15 : 0.05,
      systolicBP: systolicBP < 90 ? 0.2 : 0.05,
      spo2: spo2 < 92 ? 0.15 : 0.05,
      respirationRate: respirationRate > 20 ? 0.1 : 0.05,
      age: age > 65 ? 0.05 : 0.0
    };

    // ============ RECOMMENDATIONS ============
    const recommendations = [];
    if (finalRisk > 70) {
      recommendations.push('Immediate physician review required');
    }
    if (temperature > 100.4) {
      recommendations.push('Monitor temperature every 15 minutes');
    }
    if (spo2 < 92) {
      recommendations.push('Consider oxygen supplementation');
    }
    if (heartRate > 100) {
      recommendations.push('Check for signs of tachycardia');
    }
    if (systolicBP < 90) {
      recommendations.push('Monitor blood pressure closely');
    }
    if (sirsCount >= 2) {
      recommendations.push(`${sirsCount} SIRS criteria met - Monitor for sepsis`);
    }

    // ============ TOP FACTORS ============
    const topFactors = [];
    if (heartRate > 90) topFactors.push({ feature: 'Heart Rate', impact: 25, direction: 'positive' });
    if (temperature > 100.4) topFactors.push({ feature: 'Temperature', impact: 25, direction: 'positive' });
    if (systolicBP < 90) topFactors.push({ feature: 'Blood Pressure', impact: 20, direction: 'negative' });
    if (spo2 < 92) topFactors.push({ feature: 'SpO2', impact: 15, direction: 'negative' });
    if (respirationRate > 20) topFactors.push({ feature: 'Respiration', impact: 10, direction: 'positive' });
    
    // If no factors, add default
    if (topFactors.length === 0) {
      topFactors.push({ feature: 'All vitals normal', impact: 5, direction: 'positive' });
    }

    return {
      sepsisProbability: finalRisk / 100,
      riskScore: finalRisk,
      confidence: Math.round(85 + (finalRisk / 100) * 10),
      status: status,
      sirsCount: sirsCount,
      featureImportance: featureImportance,
      topFactors: topFactors,
      recommendations: recommendations,
      timeToDeterioration: finalRisk > 70 ? 6 : finalRisk > 50 ? 12 : 24,
      alertGenerated: finalRisk > 70,
      alertMessage: finalRisk > 70 ? `Risk: ${finalRisk}% - ${status}` : null,
      modelVersion: 'v2.0',
      riskLevel: finalRisk >= 80 ? 'CRITICAL' : finalRisk >= 60 ? 'HIGH' : finalRisk >= 40 ? 'MEDIUM' : 'LOW',
      explanation: `Risk score ${finalRisk}% based on ${sirsCount} SIRS criteria`,
      prediction: finalRisk > 50 ? 1 : 0
    };
  }

  async predict(vitals) {
    try {
      console.log('🧠 Calculating sepsis risk...');
      const result = this.mockPrediction(vitals);
      console.log(`✅ Risk: ${result.riskScore}%, Status: ${result.status}`);
      return result;
    } catch (error) {
      console.error('❌ ML prediction error:', error);
      return this.mockPrediction(vitals);
    }
  }

  async predictBatch(patientsVitals) {
    const results = [];
    for (const vitals of patientsVitals) {
      results.push(this.mockPrediction(vitals));
    }
    return results;
  }
}

module.exports = new MLService();