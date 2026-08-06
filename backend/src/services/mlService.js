const axios = require('axios');
const { PythonShell } = require('python-shell');
const path = require('path');

class MLService {
  constructor() {
    this.usePython = false;
    this.serviceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.modelPath = path.join(__dirname, '../../ml_model');
  }

  // ============================================
  // EMERGENCY SEPSIS CHECK - ENHANCED WITH RBC, WBC & MORE
  // ============================================
  emergencySepsisCheck(vitals) {
    const { 
      heartRate = 80, 
      temperature = 98.6, 
      systolicBP = 120, 
      diastolicBP = 76, 
      spo2 = 98, 
      respirationRate = 16, 
      wbc = 7500,
      rbc = 4.8,
      hemoglobin = 13.5,
      hematocrit = 40,
      platelets = 220000,
      lactate = 1.0,
      creatinine = 1.0,
      bun = 14,
      glucose = 100,
      age = 50,
      gender = 0,
      gcs = 15
    } = vitals;
    
    let sepsisAlert = {
      isSepsis: false,
      severity: 'LOW',
      reasons: [],
      sirsCount: 0,
      qsofa: 0,
      criticalCount: 0
    };
    
    // 🚨 Check SIRS Criteria (WBC included)
    let sirsCount = 0;
    if (heartRate > 90) { 
      sirsCount++; 
      sepsisAlert.reasons.push(`Tachycardia: ${heartRate} bpm`); 
    }
    if (temperature > 100.4 || temperature < 97.0) { 
      sirsCount++; 
      sepsisAlert.reasons.push(`Abnormal temp: ${temperature}°F`); 
    }
    if (respirationRate > 20) { 
      sirsCount++; 
      sepsisAlert.reasons.push(`Tachypnea: ${respirationRate}/min`); 
    }
    if (wbc > 12000 || wbc < 4000) { 
      sirsCount++; 
      sepsisAlert.reasons.push(`Abnormal WBC: ${wbc}`); 
    }
    sepsisAlert.sirsCount = sirsCount;
    
    // 🚨 Check qSOFA Criteria
    let qsofa = 0;
    if (respirationRate >= 22) { 
      qsofa++; 
      sepsisAlert.reasons.push(`RR >= 22: ${respirationRate}`); 
    }
    if (systolicBP <= 100) { 
      qsofa++; 
      sepsisAlert.reasons.push(`SBP <= 100: ${systolicBP}`); 
    }
    if (gcs < 15) { 
      qsofa++; 
      sepsisAlert.reasons.push(`GCS < 15`); 
    }
    sepsisAlert.qsofa = qsofa;
    
    // 🚨 Check Critical Vitals (including RBC, Hemoglobin, Platelets)
    let criticalCount = 0;
    if (heartRate > 110) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Severe tachycardia: ${heartRate} bpm`); 
    }
    if (temperature > 102.0) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`High fever: ${temperature}°F`); 
    }
    if (temperature < 96.0) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Hypothermia: ${temperature}°F`); 
    }
    if (systolicBP < 90) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Hypotension: ${systolicBP} mmHg`); 
    }
    if (spo2 < 90) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Low SpO2: ${spo2}%`); 
    }
    if (lactate > 2.5) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Elevated lactate: ${lactate}`); 
    }
    if (age > 70) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Age > 70`); 
    }
    // 🆕 RBC - Low indicates anemia from inflammation
    if (rbc < 3.5) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Low RBC: ${rbc}`); 
    }
    // 🆕 Hemoglobin - Low in sepsis
    if (hemoglobin < 10) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Low Hemoglobin: ${hemoglobin}`); 
    }
    // 🆕 Platelets - Low indicates consumption
    if (platelets < 100000) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Low Platelets: ${platelets}`); 
    }
    // 🆕 Creatinine - Kidney dysfunction
    if (creatinine > 2.0) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Elevated Creatinine: ${creatinine}`); 
    }
    // 🆕 BUN - Kidney dysfunction
    if (bun > 30) { 
      criticalCount++; 
      sepsisAlert.reasons.push(`Elevated BUN: ${bun}`); 
    }
    sepsisAlert.criticalCount = criticalCount;
    
    // 🚨 SEPSIS DETECTION LOGIC (Enhanced)
    if (sirsCount >= 3 && criticalCount >= 2) {
      sepsisAlert.isSepsis = true;
      sepsisAlert.severity = 'CRITICAL';
      sepsisAlert.riskScore = 95;
      sepsisAlert.message = '🚨 CRITICAL SEPSIS: Immediate action required!';
      sepsisAlert.status = 'CRITICAL';
    } else if (sirsCount >= 2 && criticalCount >= 1) {
      sepsisAlert.isSepsis = true;
      sepsisAlert.severity = 'HIGH';
      sepsisAlert.riskScore = 80;
      sepsisAlert.message = '⚠️ HIGH RISK SEPSIS: Urgent assessment needed!';
      sepsisAlert.status = 'WARNING';
    } else if (sirsCount >= 2) {
      sepsisAlert.isSepsis = true;
      sepsisAlert.severity = 'MEDIUM';
      sepsisAlert.riskScore = 60;
      sepsisAlert.message = '⚠️ SIRS criteria met - Monitor closely';
      sepsisAlert.status = 'WARNING';
    } else if (sirsCount >= 1 && criticalCount >= 1) {
      sepsisAlert.isSepsis = true;
      sepsisAlert.severity = 'MEDIUM';
      sepsisAlert.riskScore = 50;
      sepsisAlert.message = '⚠️ Monitoring required - Risk factors present';
      sepsisAlert.status = 'MONITOR';
    } else if (qsofa >= 2) {
      sepsisAlert.isSepsis = true;
      sepsisAlert.severity = 'HIGH';
      sepsisAlert.riskScore = 70;
      sepsisAlert.message = '⚠️ qSOFA positive - High risk of sepsis';
      sepsisAlert.status = 'WARNING';
    } else {
      sepsisAlert.isSepsis = false;
      sepsisAlert.severity = 'LOW';
      sepsisAlert.riskScore = 10;
      sepsisAlert.message = '✅ No sepsis indicators';
      sepsisAlert.status = 'STABLE';
    }
    
    return sepsisAlert;
  }

  // ============================================
  // MAIN PREDICTION - ENHANCED WITH ALL FEATURES
  // ============================================
  mockPrediction(vitals) {
    const { 
      heartRate = 80, 
      temperature = 98.6, 
      systolicBP = 120, 
      diastolicBP = 76, 
      spo2 = 98, 
      respirationRate = 16, 
      age = 50,
      wbc = 7500,
      rbc = 4.8,
      hemoglobin = 13.5,
      hematocrit = 40,
      platelets = 220000,
      lactate = 1.0,
      creatinine = 1.0,
      bun = 14,
      glucose = 100,
      gender = 0,
      gcs = 15,
      previousRisk = 0 
    } = vitals;

    // ============ EMERGENCY SEPSIS CHECK FIRST ============
    const sepsisAlert = this.emergencySepsisCheck(vitals);
    
    // If sepsis detected by emergency rules with CRITICAL severity, return immediately
    if (sepsisAlert.isSepsis && sepsisAlert.severity === 'CRITICAL') {
      return this.buildPredictionResult(vitals, {
        finalRisk: sepsisAlert.riskScore,
        status: sepsisAlert.status,
        riskLevel: 'CRITICAL',
        sirsCount: sepsisAlert.sirsCount,
        qsofa: sepsisAlert.qsofa,
        alertMessage: sepsisAlert.message,
        alertGenerated: true,
        reasons: sepsisAlert.reasons
      });
    }

    // ============ SIRS CRITERIA ============
    let sirsCount = 0;
    let riskScore = 0;

    // 1. Heart Rate
    if (heartRate > 130) {
      sirsCount++;
      riskScore += 35;
    } else if (heartRate > 110) {
      sirsCount++;
      riskScore += 25;
    } else if (heartRate > 90) {
      sirsCount++;
      riskScore += 15;
    } else if (heartRate < 50) {
      riskScore += 20;
    } else if (heartRate < 60) {
      riskScore += 8;
    } else {
      riskScore -= 5;
    }

    // 2. Temperature
    if (temperature >= 104.0) {
      sirsCount++;
      riskScore += 45;
    } else if (temperature >= 103.0) {
      sirsCount++;
      riskScore += 35;
    } else if (temperature >= 102.0) {
      sirsCount++;
      riskScore += 28;
    } else if (temperature >= 100.4) {
      sirsCount++;
      riskScore += 20;
    } else if (temperature >= 99.5) {
      riskScore += 10;
    } else if (temperature < 95.0) {
      sirsCount++;
      riskScore += 40;
    } else if (temperature < 96.0) {
      sirsCount++;
      riskScore += 30;
    } else if (temperature < 97.0) {
      sirsCount++;
      riskScore += 20;
    } else {
      riskScore -= 5;
    }

    // 3. Respiratory Rate
    if (respirationRate > 35) {
      sirsCount++;
      riskScore += 35;
    } else if (respirationRate > 30) {
      sirsCount++;
      riskScore += 28;
    } else if (respirationRate > 28) {
      sirsCount++;
      riskScore += 22;
    } else if (respirationRate > 24) {
      sirsCount++;
      riskScore += 16;
    } else if (respirationRate > 20) {
      sirsCount++;
      riskScore += 10;
    } else if (respirationRate < 10) {
      riskScore += 20;
    } else {
      riskScore -= 3;
    }

    // 4. Blood Pressure
    if (systolicBP < 70 || diastolicBP < 40) {
      sirsCount++;
      riskScore += 45;
    } else if (systolicBP < 80 || diastolicBP < 50) {
      sirsCount++;
      riskScore += 35;
    } else if (systolicBP < 90 || diastolicBP < 60) {
      sirsCount++;
      riskScore += 25;
    } else if (systolicBP < 100 || diastolicBP < 70) {
      riskScore += 14;
    } else {
      riskScore -= 4;
    }

    // 5. WBC (White Blood Cell Count)
    if (wbc > 20000) {
      sirsCount++;
      riskScore += 30;
    } else if (wbc > 15000) {
      sirsCount++;
      riskScore += 22;
    } else if (wbc > 12000) {
      sirsCount++;
      riskScore += 15;
    } else if (wbc < 3000) {
      sirsCount++;
      riskScore += 25;
    } else if (wbc < 4000) {
      sirsCount++;
      riskScore += 18;
    } else {
      riskScore -= 3;
    }

    // ============ 🆕 ADDITIONAL LAB MARKERS ============
    
    // 6. RBC (Red Blood Cell Count) - NEW
    // Low RBC indicates anemia from inflammation
    if (rbc < 3.0) {
      riskScore += 20;
    } else if (rbc < 3.5) {
      riskScore += 14;
    } else if (rbc < 4.0) {
      riskScore += 8;
    } else {
      riskScore -= 2;
    }

    // 7. Hemoglobin - NEW
    if (hemoglobin < 8) {
      riskScore += 22;
    } else if (hemoglobin < 10) {
      riskScore += 15;
    } else if (hemoglobin < 11) {
      riskScore += 8;
    } else if (hemoglobin < 12) {
      riskScore += 4;
    } else {
      riskScore -= 2;
    }

    // 8. Hematocrit - NEW
    if (hematocrit < 25) {
      riskScore += 18;
    } else if (hematocrit < 30) {
      riskScore += 12;
    } else if (hematocrit < 33) {
      riskScore += 6;
    } else {
      riskScore -= 2;
    }

    // 9. Platelets - NEW
    if (platelets < 50000) {
      riskScore += 20;
    } else if (platelets < 100000) {
      riskScore += 12;
    } else if (platelets < 150000) {
      riskScore += 6;
    } else {
      riskScore -= 2;
    }

    // 10. SpO2
    if (spo2 < 75) {
      riskScore += 40;
    } else if (spo2 < 80) {
      riskScore += 32;
    } else if (spo2 < 85) {
      riskScore += 25;
    } else if (spo2 < 88) {
      riskScore += 18;
    } else if (spo2 < 90) {
      riskScore += 12;
    } else if (spo2 < 92) {
      riskScore += 8;
    } else if (spo2 < 94) {
      riskScore += 5;
    } else {
      riskScore -= 3;
    }

    // 11. Lactate
    if (lactate > 6.0) {
      riskScore += 35;
    } else if (lactate > 4.0) {
      riskScore += 28;
    } else if (lactate > 3.0) {
      riskScore += 20;
    } else if (lactate > 2.5) {
      riskScore += 14;
    } else if (lactate > 2.0) {
      riskScore += 8;
    } else {
      riskScore -= 2;
    }

    // 12. Creatinine
    if (creatinine > 3.0) {
      riskScore += 25;
    } else if (creatinine > 2.0) {
      riskScore += 18;
    } else if (creatinine > 1.5) {
      riskScore += 12;
    } else if (creatinine > 1.2) {
      riskScore += 6;
    } else {
      riskScore -= 2;
    }

    // 13. BUN (Blood Urea Nitrogen) - NEW
    if (bun > 40) {
      riskScore += 15;
    } else if (bun > 30) {
      riskScore += 10;
    } else if (bun > 20) {
      riskScore += 5;
    } else {
      riskScore -= 2;
    }

    // 14. Glucose - NEW
    if (glucose > 200) {
      riskScore += 12;
    } else if (glucose > 160) {
      riskScore += 8;
    } else if (glucose > 120) {
      riskScore += 5;
    } else {
      riskScore -= 2;
    }

    // 15. Age
    if (age > 85) {
      riskScore += 20;
    } else if (age > 75) {
      riskScore += 15;
    } else if (age > 65) {
      riskScore += 10;
    } else if (age > 55) {
      riskScore += 6;
    } else {
      riskScore -= 2;
    }

    // 16. qSOFA Score - NEW
    let qsofa = 0;
    if (respirationRate >= 22) qsofa++;
    if (systolicBP <= 100) qsofa++;
    if (gcs < 15) qsofa++;

    // ============ SIRS MULTIPLIER ============
    if (sirsCount >= 4) {
      riskScore = Math.round(riskScore * 2.2);
    } else if (sirsCount >= 3) {
      riskScore = Math.round(riskScore * 1.8);
    } else if (sirsCount >= 2) {
      riskScore = Math.round(riskScore * 1.4);
    } else if (sirsCount >= 1) {
      riskScore = Math.round(riskScore * 1.1);
    }

    // ============ qSOFA MULTIPLIER ============
    if (qsofa >= 2) {
      riskScore = Math.round(riskScore * 1.5);
    } else if (qsofa >= 1) {
      riskScore = Math.round(riskScore * 1.2);
    }

    // ============ FINAL RISK ============
    let finalRisk = riskScore;
    
    // If sepsis alert has higher risk, use that
    if (sepsisAlert.isSepsis && sepsisAlert.riskScore > finalRisk) {
      finalRisk = sepsisAlert.riskScore;
    }
    
    // Ensure minimum risk based on SIRS
    if (sirsCount >= 3 && finalRisk < 70) {
      finalRisk = 70 + (sirsCount - 3) * 5;
    }
    if (sirsCount >= 4 && finalRisk < 85) {
      finalRisk = 85;
    }
    // Ensure minimum risk based on qSOFA
    if (qsofa >= 2 && finalRisk < 60) {
      finalRisk = 60;
    }

    // Clamp
    finalRisk = Math.max(0, Math.min(100, Math.round(finalRisk)));

    // ============ STATUS DETERMINATION ============
    let status = 'STABLE';
    let riskLevel = 'LOW';
    
    if (finalRisk >= 75) {
      status = 'CRITICAL';
      riskLevel = 'CRITICAL';
    } else if (finalRisk >= 60) {
      status = 'WARNING';
      riskLevel = 'HIGH';
    } else if (finalRisk >= 45) {
      status = 'WARNING';
      riskLevel = 'MEDIUM';
    } else if (finalRisk >= 30) {
      status = 'MONITOR';
      riskLevel = 'MEDIUM';
    } else {
      status = 'STABLE';
      riskLevel = 'LOW';
    }

    // ============ BUILD RESULT ============
    return this.buildPredictionResult(vitals, {
      finalRisk,
      status,
      riskLevel,
      sirsCount,
      qsofa,
      alertMessage: sepsisAlert.message,
      alertGenerated: finalRisk >= 60 || sepsisAlert.isSepsis,
      reasons: sepsisAlert.reasons,
      wbc: wbc,
      rbc: rbc,
      hemoglobin: hemoglobin,
      hematocrit: hematocrit,
      platelets: platelets,
      lactate: lactate,
      creatinine: creatinine,
      bun: bun,
      glucose: glucose
    });
  }

  // ============================================
  // BUILD PREDICTION RESULT - ENHANCED
  // ============================================
  buildPredictionResult(vitals, data) {
    const { 
      heartRate = 80, 
      temperature = 98.6, 
      systolicBP = 120, 
      spo2 = 98, 
      respirationRate = 16, 
      age = 50,
      wbc = 7500,
      rbc = 4.8,
      hemoglobin = 13.5,
      hematocrit = 40,
      platelets = 220000,
      lactate = 1.0,
      creatinine = 1.0,
      bun = 14,
      glucose = 100
    } = vitals;

    const { 
      finalRisk, 
      status, 
      riskLevel, 
      sirsCount, 
      qsofa = 0, 
      alertMessage, 
      alertGenerated, 
      reasons = [] 
    } = data;

    // ============ TOP FACTORS (Enhanced with RBC, WBC, etc.) ============
    const topFactors = [];
    
    // Heart Rate
    if (heartRate > 130) topFactors.push({ feature: 'Heart Rate', impact: 35, direction: 'positive' });
    else if (heartRate > 110) topFactors.push({ feature: 'Heart Rate', impact: 25, direction: 'positive' });
    else if (heartRate > 90) topFactors.push({ feature: 'Heart Rate', impact: 15, direction: 'positive' });
    
    // Temperature
    if (temperature >= 103.0) topFactors.push({ feature: 'Temperature', impact: 40, direction: 'positive' });
    else if (temperature >= 102.0) topFactors.push({ feature: 'Temperature', impact: 30, direction: 'positive' });
    else if (temperature >= 100.4) topFactors.push({ feature: 'Temperature', impact: 20, direction: 'positive' });
    else if (temperature < 96.0) topFactors.push({ feature: 'Temperature (Low)', impact: 30, direction: 'negative' });
    else if (temperature < 97.0) topFactors.push({ feature: 'Temperature (Low)', impact: 20, direction: 'negative' });
    
    // Blood Pressure
    if (systolicBP < 70) topFactors.push({ feature: 'Blood Pressure', impact: 40, direction: 'negative' });
    else if (systolicBP < 80) topFactors.push({ feature: 'Blood Pressure', impact: 30, direction: 'negative' });
    else if (systolicBP < 90) topFactors.push({ feature: 'Blood Pressure', impact: 20, direction: 'negative' });
    
    // SpO2
    if (spo2 < 80) topFactors.push({ feature: 'SpO2', impact: 35, direction: 'negative' });
    else if (spo2 < 85) topFactors.push({ feature: 'SpO2', impact: 25, direction: 'negative' });
    else if (spo2 < 90) topFactors.push({ feature: 'SpO2', impact: 15, direction: 'negative' });
    else if (spo2 < 92) topFactors.push({ feature: 'SpO2', impact: 10, direction: 'negative' });
    
    // Respiratory Rate
    if (respirationRate > 35) topFactors.push({ feature: 'Respiration', impact: 30, direction: 'positive' });
    else if (respirationRate > 30) topFactors.push({ feature: 'Respiration', impact: 22, direction: 'positive' });
    else if (respirationRate > 28) topFactors.push({ feature: 'Respiration', impact: 18, direction: 'positive' });
    else if (respirationRate > 20) topFactors.push({ feature: 'Respiration', impact: 10, direction: 'positive' });
    
    // 🆕 WBC - White Blood Cell Count
    if (wbc > 20000) topFactors.push({ feature: 'WBC', impact: 25, direction: 'positive' });
    else if (wbc > 15000) topFactors.push({ feature: 'WBC', impact: 18, direction: 'positive' });
    else if (wbc > 12000) topFactors.push({ feature: 'WBC', impact: 12, direction: 'positive' });
    else if (wbc < 3000) topFactors.push({ feature: 'WBC (Low)', impact: 20, direction: 'negative' });
    else if (wbc < 4000) topFactors.push({ feature: 'WBC (Low)', impact: 15, direction: 'negative' });
    
    // 🆕 RBC - Red Blood Cell Count
    if (rbc < 3.0) topFactors.push({ feature: 'RBC', impact: 18, direction: 'negative' });
    else if (rbc < 3.5) topFactors.push({ feature: 'RBC', impact: 12, direction: 'negative' });
    else if (rbc < 4.0) topFactors.push({ feature: 'RBC', impact: 8, direction: 'negative' });
    
    // 🆕 Hemoglobin
    if (hemoglobin < 8) topFactors.push({ feature: 'Hemoglobin', impact: 20, direction: 'negative' });
    else if (hemoglobin < 10) topFactors.push({ feature: 'Hemoglobin', impact: 14, direction: 'negative' });
    else if (hemoglobin < 11) topFactors.push({ feature: 'Hemoglobin', impact: 8, direction: 'negative' });
    
    // 🆕 Platelets
    if (platelets < 50000) topFactors.push({ feature: 'Platelets', impact: 18, direction: 'negative' });
    else if (platelets < 100000) topFactors.push({ feature: 'Platelets', impact: 12, direction: 'negative' });
    else if (platelets < 150000) topFactors.push({ feature: 'Platelets', impact: 6, direction: 'negative' });
    
    // Lactate
    if (lactate > 4.0) topFactors.push({ feature: 'Lactate', impact: 22, direction: 'positive' });
    else if (lactate > 3.0) topFactors.push({ feature: 'Lactate', impact: 15, direction: 'positive' });
    else if (lactate > 2.5) topFactors.push({ feature: 'Lactate', impact: 10, direction: 'positive' });
    else if (lactate > 2.0) topFactors.push({ feature: 'Lactate', impact: 8, direction: 'positive' });
    
    // 🆕 Creatinine
    if (creatinine > 3.0) topFactors.push({ feature: 'Creatinine', impact: 20, direction: 'positive' });
    else if (creatinine > 2.0) topFactors.push({ feature: 'Creatinine', impact: 15, direction: 'positive' });
    else if (creatinine > 1.5) topFactors.push({ feature: 'Creatinine', impact: 10, direction: 'positive' });
    
    // 🆕 BUN
    if (bun > 40) topFactors.push({ feature: 'BUN', impact: 15, direction: 'positive' });
    else if (bun > 30) topFactors.push({ feature: 'BUN', impact: 10, direction: 'positive' });
    
    // 🆕 Glucose
    if (glucose > 200) topFactors.push({ feature: 'Glucose', impact: 12, direction: 'positive' });
    else if (glucose > 160) topFactors.push({ feature: 'Glucose', impact: 8, direction: 'positive' });
    
    // Age
    if (age > 75) topFactors.push({ feature: 'Age', impact: 15, direction: 'positive' });
    else if (age > 65) topFactors.push({ feature: 'Age', impact: 10, direction: 'positive' });
    else if (age > 55) topFactors.push({ feature: 'Age', impact: 6, direction: 'positive' });
    
    // Sort and limit
    topFactors.sort((a, b) => b.impact - a.impact);
    const topFactorsFinal = topFactors.slice(0, 5);
    if (topFactorsFinal.length === 0) {
      topFactorsFinal.push({ feature: 'All vitals normal', impact: 5, direction: 'positive' });
    }

    // ============ RECOMMENDATIONS (Enhanced) ============
    const recommendations = [];
    if (finalRisk >= 75) {
      recommendations.push('🚨 CRITICAL: IMMEDIATE PHYSICIAN REVIEW REQUIRED');
      recommendations.push('📋 STAT Labs: CBC with differential, Blood Culture, Lactate, CRP, PCT');
      recommendations.push('💉 START SEPSIS PROTOCOL IMMEDIATELY');
      recommendations.push('🆘 Consider ICU Transfer');
      recommendations.push('⏰ Monitor vitals every 5-10 minutes');
      recommendations.push('💊 Administer broad-spectrum antibiotics STAT');
      recommendations.push('💉 Consider IV fluid bolus 30ml/kg');
    }
    if (finalRisk >= 60) {
      recommendations.push('⚠️ HIGH RISK: Urgent clinical assessment needed');
      recommendations.push('⏰ Monitor vitals every 15 minutes');
      recommendations.push('🧪 Repeat lab work in 1-2 hours');
      recommendations.push('💉 Consider IV fluid bolus if hypotensive');
    }
    if (finalRisk >= 45) {
      recommendations.push('📊 Monitor vitals every 30 minutes');
      recommendations.push('🧪 Repeat lab work in 2-4 hours');
    }
    if (temperature >= 100.4) {
      recommendations.push('🌡️ Monitor temperature closely');
    }
    if (spo2 < 92) {
      recommendations.push('💨 Consider oxygen supplementation');
    }
    if (heartRate > 100) {
      recommendations.push('❤️ Check for signs of tachycardia');
    }
    if (systolicBP < 90) {
      recommendations.push('📊 Monitor blood pressure closely');
      recommendations.push('💉 Consider IV fluid bolus');
    }
    if (sirsCount >= 2) {
      recommendations.push(`⚠️ ${sirsCount} SIRS criteria met - Monitor for sepsis`);
    }
    if (qsofa >= 2) {
      recommendations.push(`⚠️ qSOFA score ${qsofa} - High risk of sepsis`);
    }
    if (lactate > 2.0) {
      recommendations.push('🧪 Elevated lactate - Monitor for tissue hypoperfusion');
    }
    // 🆕 RBC specific recommendations
    if (rbc < 3.5) {
      recommendations.push('🩸 Low RBC - Monitor for anemia, consider workup');
    }
    if (hemoglobin < 10) {
      recommendations.push('🩸 Low Hemoglobin - Consider transfusion if symptomatic');
    }
    if (platelets < 100000) {
      recommendations.push('🩸 Low Platelets - Monitor for bleeding risk');
    }
    if (creatinine > 1.5) {
      recommendations.push('🫘 Elevated Creatinine - Monitor renal function');
    }
    if (reasons.length > 0) {
      recommendations.push(`📋 Warning signs: ${reasons.slice(0, 3).join(', ')}`);
    }

    // ============ TIME TO DETERIORATION ============
    let timeToDeterioration = 24;
    if (finalRisk >= 75) timeToDeterioration = 2;
    else if (finalRisk >= 65) timeToDeterioration = 4;
    else if (finalRisk >= 55) timeToDeterioration = 8;
    else if (finalRisk >= 45) timeToDeterioration = 12;
    else if (finalRisk >= 30) timeToDeterioration = 18;
    
    // Adjust for SIRS
    if (sirsCount >= 4) timeToDeterioration = Math.max(1, timeToDeterioration - 4);
    else if (sirsCount >= 3) timeToDeterioration = Math.max(1, timeToDeterioration - 2);
    
    // Adjust for qSOFA
    if (qsofa >= 2) timeToDeterioration = Math.max(1, timeToDeterioration - 3);
    else if (qsofa >= 1) timeToDeterioration = Math.max(1, timeToDeterioration - 1);

    // ============ ALERT MESSAGE ============
    let alertMsg = alertMessage;
    if (!alertMsg) {
      if (finalRisk >= 75) alertMsg = `🚨 CRITICAL: ${finalRisk}% sepsis risk - IMMEDIATE ACTION REQUIRED`;
      else if (finalRisk >= 60) alertMsg = `⚠️ HIGH: ${finalRisk}% sepsis risk - Urgent assessment needed`;
      else if (finalRisk >= 45) alertMsg = `⚠️ MEDIUM: ${finalRisk}% sepsis risk - Monitor closely`;
      else alertMsg = null;
    }

    // ============ FEATURE IMPORTANCE (Enhanced) ============
    const featureImportance = {
      heartRate: heartRate > 90 ? 0.15 : 0.05,
      temperature: (temperature >= 100.4 || temperature < 97.0) ? 0.15 : 0.05,
      systolicBP: systolicBP < 90 ? 0.15 : 0.05,
      spo2: spo2 < 92 ? 0.12 : 0.05,
      respirationRate: respirationRate > 20 ? 0.08 : 0.05,
      wbc: (wbc > 12000 || wbc < 4000) ? 0.10 : 0.05,
      rbc: rbc < 4.0 ? 0.08 : 0.05,
      hemoglobin: hemoglobin < 11 ? 0.07 : 0.05,
      platelets: platelets < 150000 ? 0.05 : 0.05,
      lactate: lactate > 2.0 ? 0.08 : 0.05,
      creatinine: creatinine > 1.5 ? 0.06 : 0.05,
      age: age > 65 ? 0.04 : 0.0
    };

    return {
      sepsisProbability: finalRisk / 100,
      riskScore: finalRisk,
      confidence: Math.min(98, Math.round(80 + (finalRisk / 100) * 18)),
      status: status,
      sirsCount: sirsCount,
      qsofaScore: qsofa,
      featureImportance: featureImportance,
      topFactors: topFactorsFinal,
      recommendations: recommendations,
      timeToDeterioration: timeToDeterioration,
      alertGenerated: alertGenerated || finalRisk >= 60,
      alertMessage: alertMsg,
      alertLevel: finalRisk >= 75 ? 'CRITICAL' : finalRisk >= 60 ? 'HIGH' : finalRisk >= 45 ? 'MEDIUM' : 'LOW',
      modelVersion: 'v3.0-enhanced-rbc-wbc',
      riskLevel: riskLevel,
      explanation: `Risk score ${finalRisk}% based on ${sirsCount} SIRS criteria, qSOFA=${qsofa}`,
      prediction: finalRisk >= 50 ? 1 : 0,
      warningSigns: reasons.length > 0 ? reasons : ['All vitals within normal range'],
      // 🆕 Include lab values in response
      wbc: wbc,
      rbc: rbc,
      hemoglobin: hemoglobin,
      hematocrit: hematocrit,
      platelets: platelets,
      lactate: lactate,
      creatinine: creatinine,
      bun: bun,
      glucose: glucose
    };
  }

  // ============================================
  // PREDICT FUNCTION
  // ============================================
  async predict(vitals) {
    try {
      console.log('🧠 Calculating sepsis risk with ENHANCED model (WBC, RBC, & more)...');
      const result = this.mockPrediction(vitals);
      console.log(`✅ Risk: ${result.riskScore}%, Status: ${result.status}, Level: ${result.riskLevel}`);
      console.log(`   SIRS: ${result.sirsCount}, qSOFA: ${result.qsofaScore}, Alert: ${result.alertGenerated}`);
      console.log(`   WBC: ${result.wbc}, RBC: ${result.rbc}, Hgb: ${result.hemoglobin}, Plt: ${result.platelets}`);
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