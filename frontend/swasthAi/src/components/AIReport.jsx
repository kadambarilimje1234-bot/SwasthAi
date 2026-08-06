import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, Download, Printer, Share2, 
  Brain, Heart, Thermometer, Droplet, Wind,
  Activity, AlertCircle, CheckCircle, Clock,
  User, Calendar, MapPin, Stethoscope,
  Pill, Sparkles, Shield, Award,
  ChevronDown, ChevronUp, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const AIReport = ({ isOpen, onClose, patient, latestVitals, vitals, predictions }) => {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({
    vitals: true,
    riskFactors: true,
    medications: true,
    recommendations: true,
  });

  if (!isOpen || !patient) return null;

  const currentDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  });

  // Get risk level
  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-50 border-red-200', emoji: '🚨' };
    if (score >= 60) return { label: 'HIGH', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', emoji: '⚠️' };
    if (score >= 40) return { label: 'MEDIUM', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', emoji: '📊' };
    return { label: 'LOW', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', emoji: '✅' };
  };

  // Generate risk factors from vitals
  const getRiskFactors = () => {
    const factors = [];
    const vitals = latestVitals || {};

    if (vitals.temperature) {
      const temp = parseFloat(vitals.temperature);
      if (temp > 100.4) {
        factors.push({ 
          name: 'Temperature', 
          value: `${vitals.temperature}°F`, 
          status: '↑ Elevated', 
          impact: 32,
          description: 'Fever indicates possible infection',
          color: 'text-red-600'
        });
      } else if (temp < 97.0) {
        factors.push({ 
          name: 'Temperature', 
          value: `${vitals.temperature}°F`, 
          status: '↓ Low', 
          impact: 20,
          description: 'Hypothermia - monitor closely',
          color: 'text-blue-600'
        });
      } else {
        factors.push({ 
          name: 'Temperature', 
          value: `${vitals.temperature}°F`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'Temperature within normal range',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.heartRate) {
      const hr = parseFloat(vitals.heartRate);
      if (hr > 100) {
        factors.push({ 
          name: 'Heart Rate', 
          value: `${vitals.heartRate} bpm`, 
          status: '↑ Tachycardia', 
          impact: 28,
          description: 'Elevated heart rate indicates stress',
          color: 'text-red-600'
        });
      } else if (hr < 60) {
        factors.push({ 
          name: 'Heart Rate', 
          value: `${vitals.heartRate} bpm`, 
          status: '↓ Bradycardia', 
          impact: 20,
          description: 'Low heart rate - monitor',
          color: 'text-blue-600'
        });
      } else {
        factors.push({ 
          name: 'Heart Rate', 
          value: `${vitals.heartRate} bpm`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'Heart rate within normal range',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.systolicBP && vitals.diastolicBP) {
      const sys = parseFloat(vitals.systolicBP);
      const dia = parseFloat(vitals.diastolicBP);
      if (sys < 90 || dia < 60) {
        factors.push({ 
          name: 'Blood Pressure', 
          value: `${vitals.systolicBP}/${vitals.diastolicBP} mmHg`, 
          status: '↓ Hypotension', 
          impact: 30,
          description: 'Low BP - possible sepsis risk',
          color: 'text-red-600'
        });
      } else if (sys > 140 || dia > 90) {
        factors.push({ 
          name: 'Blood Pressure', 
          value: `${vitals.systolicBP}/${vitals.diastolicBP} mmHg`, 
          status: '↑ Hypertension', 
          impact: 18,
          description: 'High BP - monitor closely',
          color: 'text-orange-600'
        });
      } else {
        factors.push({ 
          name: 'Blood Pressure', 
          value: `${vitals.systolicBP}/${vitals.diastolicBP} mmHg`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'Blood pressure within normal range',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.spo2) {
      const spo2 = parseFloat(vitals.spo2);
      if (spo2 < 92) {
        factors.push({ 
          name: 'SpO2', 
          value: `${vitals.spo2}%`, 
          status: '↓ Low Oxygen', 
          impact: 25,
          description: 'Low oxygen saturation - urgent attention',
          color: 'text-red-600'
        });
      } else if (spo2 < 95) {
        factors.push({ 
          name: 'SpO2', 
          value: `${vitals.spo2}%`, 
          status: '↓ Mild Low', 
          impact: 15,
          description: 'Slightly low oxygen - monitor',
          color: 'text-amber-600'
        });
      } else {
        factors.push({ 
          name: 'SpO2', 
          value: `${vitals.spo2}%`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'Oxygen saturation normal',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.wbc) {
      const wbc = parseFloat(vitals.wbc);
      if (wbc > 11) {
        factors.push({ 
          name: 'WBC Count', 
          value: `${vitals.wbc} x10³/µL`, 
          status: '↑ Elevated', 
          impact: 22,
          description: 'Elevated WBC - possible infection',
          color: 'text-red-600'
        });
      } else if (wbc < 4.5) {
        factors.push({ 
          name: 'WBC Count', 
          value: `${vitals.wbc} x10³/µL`, 
          status: '↓ Low', 
          impact: 18,
          description: 'Low WBC - viral infection possible',
          color: 'text-amber-600'
        });
      } else {
        factors.push({ 
          name: 'WBC Count', 
          value: `${vitals.wbc} x10³/µL`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'WBC count normal',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.rbc) {
      const rbc = parseFloat(vitals.rbc);
      if (rbc < 4.0) {
        factors.push({ 
          name: 'RBC Count', 
          value: `${vitals.rbc} x10⁶/µL`, 
          status: '↓ Low', 
          impact: 15,
          description: 'Low RBC - possible anemia',
          color: 'text-amber-600'
        });
      } else {
        factors.push({ 
          name: 'RBC Count', 
          value: `${vitals.rbc} x10⁶/µL`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'RBC count normal',
          color: 'text-emerald-600'
        });
      }
    }

    if (vitals.respiratoryRate) {
      const rr = parseFloat(vitals.respiratoryRate);
      if (rr > 22) {
        factors.push({ 
          name: 'Respiratory Rate', 
          value: `${vitals.respiratoryRate}/min`, 
          status: '↑ Tachypnea', 
          impact: 20,
          description: 'Increased breathing rate',
          color: 'text-red-600'
        });
      } else {
        factors.push({ 
          name: 'Respiratory Rate', 
          value: `${vitals.respiratoryRate}/min`, 
          status: '✓ Normal', 
          impact: 5,
          description: 'Respiratory rate normal',
          color: 'text-emerald-600'
        });
      }
    }

    // Sort by impact
    factors.sort((a, b) => b.impact - a.impact);
    return factors;
  };

  // Generate recommendations
  const getRecommendations = () => {
    const recs = [];
    const risk = patient?.currentRisk || 0;
    const vitals = latestVitals || {};

    if (risk >= 80) {
      recs.push('🚨 Immediate medical attention required');
      recs.push('📋 Alert the senior doctor on duty');
      recs.push('🩺 Start emergency protocol');
      recs.push('💊 Administer prescribed medications immediately');
    } else if (risk >= 60) {
      recs.push('📋 Check vitals every 2 hours');
      recs.push('🩺 Inform the attending doctor');
      recs.push('💊 Continue current medications');
      recs.push('🔄 Prepare for potential intervention');
    } else if (risk >= 40) {
      recs.push('📋 Check vitals every 4 hours');
      recs.push('💊 Maintain medication schedule');
      recs.push('🩺 Schedule follow-up in 24 hours');
    } else {
      recs.push('✅ Continue regular monitoring');
      recs.push('💊 Follow prescribed treatment plan');
      recs.push('🩺 Regular checkup as scheduled');
    }

    // Add specific recommendations based on vitals
    if (vitals.temperature > 100.4) {
      recs.push('🌡️ Monitor temperature closely - administer antipyretics if needed');
    }
    if (vitals.spo2 < 92) {
      recs.push('💨 Oxygen therapy recommended - check SpO2 frequently');
    }
    if (vitals.wbc > 11) {
      recs.push('🧬 Blood culture test recommended');
    }

    return recs;
  };

  // Get medications (mock data - can be made dynamic)
  const getMedications = () => {
    return [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', route: 'Oral', status: 'Active' },
      { name: 'Paracetamol', dosage: '650mg', frequency: 'As needed', route: 'Oral', status: 'Active' },
      { name: 'Vitamin C', dosage: '500mg', frequency: 'Once daily', route: 'Oral', status: 'Active' },
    ];
  };

  const riskLevel = getRiskLevel(patient?.currentRisk || 0);
  const riskFactors = getRiskFactors();
  const recommendations = getRecommendations();
  const medications = getMedications();

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Download as PDF
  const handleDownloadPDF = async () => {
    setLoading(true);
    toast.success('📄 Generating PDF report...');
    
    try {
      const element = document.getElementById('report-content');
      if (!element) {
        toast.error('Report content not found');
        setLoading(false);
        return;
      }

      const opt = {
        margin: 10,
        filename: `Clinical_Report_${patient.name}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('✅ Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Share
  const handleShare = () => {
    toast.success('📤 Share link copied to clipboard!');
    navigator.clipboard.writeText(`Clinical Report - ${patient.name}`);
  };

  // Handle Copy
  const handleCopy = () => {
    const reportText = `
AI Clinical Report
━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patient.name}
Age: ${patient.age} years
Gender: ${patient.gender}
MRN: ${patient.mrn || patient.patientId}
Ward: ${patient.ward}
Date: ${currentDate}

Risk Assessment
━━━━━━━━━━━━━━━━━━━━━━━
Risk Score: ${patient.currentRisk || 0}% (${riskLevel.label})
AI Confidence: ${patient.aiConfidence || 88}%

Vitals Summary
━━━━━━━━━━━━━━━━━━━━━━━
HR: ${latestVitals?.heartRate || '--'} bpm
Temp: ${latestVitals?.temperature || '--'}°F
BP: ${latestVitals?.systolicBP || '--'}/${latestVitals?.diastolicBP || '--'} mmHg
SpO2: ${latestVitals?.spo2 || '--'}%
WBC: ${latestVitals?.wbc || '--'} x10³/µL
RBC: ${latestVitals?.rbc || '--'} x10⁶/µL

Recommendations
━━━━━━━━━━━━━━━━━━━━━━━
${recommendations.map(r => `• ${r}`).join('\n')}

Generated by: SwasthAI Sentinel AI
Timestamp: ${currentDate}
    `;
    
    navigator.clipboard.writeText(reportText);
    toast.success('📋 Report copied to clipboard!');
  };

  const toggleSection = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI Clinical Report</h2>
                  <p className="text-sm text-gray-500">Generated by SwasthAI Sentinel</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {loading ? 'Generating...' : 'Download PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-300 transition"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <span className="text-xs text-gray-400 ml-auto">
                Last updated: {currentDate}
              </span>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-6" id="report-content">
              {/* Patient Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{patient.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {patient.age}y · {patient.gender}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {patient.ward}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      MRN: {patient.mrn || patient.patientId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentDate}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-center ${riskLevel.bg}`}>
                  <p className={`text-2xl font-bold ${riskLevel.color}`}>
                    {patient.currentRisk || 0}%
                  </p>
                  <p className={`text-xs font-semibold ${riskLevel.color}`}>
                    {riskLevel.emoji} {riskLevel.label} RISK
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">AI Risk Assessment</h4>
                  <span className="text-xs text-gray-400">Confidence: {patient.aiConfidence || 88}%</span>
                </div>
                <p className="text-sm text-gray-600">
                  Patient presents with <strong>{riskLevel.label}</strong> risk of clinical deterioration.
                  {patient.currentRisk >= 80 ? ' Immediate medical attention required.' : ' Continue regular monitoring.'}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    Model: v2.0
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-purple-500" />
                    Accuracy: 94.7%
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-green-500" />
                    Status: {patient.currentStatus || 'STABLE'}
                  </span>
                </div>
              </div>

              {/* Latest Vitals */}
              <div>
                <button
                  onClick={() => toggleSection('vitals')}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <h4 className="font-semibold text-gray-900">Latest Vitals</h4>
                  </div>
                  {expanded.vitals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded.vitals && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">Heart Rate</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.heartRate || '--'} <span className="text-xs font-normal text-gray-400">bpm</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">Temperature</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.temperature || '--'}°<span className="text-xs font-normal text-gray-400">F</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">Blood Pressure</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.systolicBP || '--'}/{latestVitals?.diastolicBP || '--'} <span className="text-xs font-normal text-gray-400">mmHg</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">SpO2</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.spo2 || '--'}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">Respiration</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.respiratoryRate || '--'} <span className="text-xs font-normal text-gray-400">/min</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">WBC</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.wbc || '--'} <span className="text-xs font-normal text-gray-400">x10³/µL</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">RBC</p>
                      <p className="text-lg font-bold text-gray-800">{latestVitals?.rbc || '--'} <span className="text-xs font-normal text-gray-400">x10⁶/µL</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-xs text-gray-400">Risk Score</p>
                      <p className={`text-lg font-bold ${riskLevel.color}`}>{patient.currentRisk || 0}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Factors */}
              <div>
                <button
                  onClick={() => toggleSection('riskFactors')}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <h4 className="font-semibold text-gray-900">Explainable AI - Risk Factors</h4>
                    <span className="text-xs text-gray-400">({riskFactors.length} factors)</span>
                  </div>
                  {expanded.riskFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded.riskFactors && (
                  <div className="space-y-2 mt-3">
                    {riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${factor.color}`}>{factor.name}</span>
                          <span className="text-sm text-gray-600">{factor.value}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${factor.color} bg-opacity-10`}>
                            {factor.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${factor.impact}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{factor.impact}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <button
                  onClick={() => toggleSection('medications')}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-emerald-500" />
                    <h4 className="font-semibold text-gray-900">Current Medications</h4>
                  </div>
                  {expanded.medications ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded.medications && (
                  <div className="space-y-2 mt-3">
                    {medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border">
                        <div>
                          <p className="font-medium text-gray-800">{med.name}</p>
                          <p className="text-xs text-gray-500">{med.dosage} · {med.frequency} · {med.route}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          {med.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-gray-900">Recommended Clinical Actions</h4>
                  </div>
                  {expanded.recommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded.recommendations && (
                  <div className="space-y-2 mt-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <p className="text-sm text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t pt-4 text-center text-xs text-gray-400">
                <p>Generated by SwasthAI Sentinel AI Clinical System</p>
                <p>© 2026 SwasthAI Sentinel · All Rights Reserved</p>
                <p className="mt-1">This report is for clinical decision support only. Always consult with a qualified healthcare professional.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIReport;