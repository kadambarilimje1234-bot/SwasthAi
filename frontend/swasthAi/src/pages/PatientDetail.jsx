import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Thermometer, Droplet, Activity, Wind, 
  Brain, Calendar, User, MapPin, Clock, 
  ArrowUp, ArrowDown, TrendingUp, TrendingDown,
  MessageCircle, X, Send, Sparkles
} from 'lucide-react';
import { patientAPI, vitalsAPI, predictionAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { type: 'ai', message: 'Hello! I\'m your AI health assistant. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Get patient details
      const patientRes = await patientAPI.getById(id);
      setPatient(patientRes.data.data);
      
      // Get vitals history
      const vitalsRes = await vitalsAPI.getHistory(id, { limit: 20 });
      setVitalsHistory(vitalsRes.data.data.vitals || []);
      
      // Get predictions
      const predRes = await predictionAPI.getPatientPredictions(id, { limit: 10 });
      setPredictions(predRes.data.data.predictions || []);
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage;
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatMessage('');
    setIsTyping(true);
    
    // Simulate AI response based on patient data
    setTimeout(() => {
      let response = '';
      if (userMessage.toLowerCase().includes('risk')) {
        response = `Current risk score is ${patient?.currentRisk || 0}%. ${patient?.currentRisk > 70 ? '⚠️ This is high risk. Please consult your doctor immediately.' : '✅ This is normal range.'}`;
      } else if (userMessage.toLowerCase().includes('vitals')) {
        const latest = vitalsHistory[0];
        response = `Latest vitals: HR ${latest?.heartRate || 'N/A'} bpm, Temp ${latest?.temperature || 'N/A'}°F, BP ${latest?.systolicBP || 'N/A'}/${latest?.diastolicBP || 'N/A'} mmHg, SpO2 ${latest?.spo2 || 'N/A'}%`;
      } else if (userMessage.toLowerCase().includes('trend')) {
        response = `Your risk has ${predictions.length > 1 && predictions[0].riskScore > predictions[1].riskScore ? 'increased' : 'decreased'} over the last ${predictions.length} records.`;
      } else {
        response = `Based on your current vitals, your health status is ${patient?.currentStatus || 'STABLE'}. Keep monitoring your vitals regularly.`;
      }
      
      setChatHistory(prev => [...prev, { type: 'ai', message: response }]);
      setIsTyping(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Patient not found</p>
      </div>
    );
  }

  const latestVitals = vitalsHistory[0] || {};
  const riskTrend = predictions.map(p => p.riskScore).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Details</h1>
          <p className="text-sm text-slate-400">Complete health record and monitoring</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
          patient.currentStatus === 'CRITICAL' ? 'bg-red-500 text-white' :
          patient.currentStatus === 'WARNING' ? 'bg-amber-500 text-white' :
          'bg-emerald-500 text-white'
        }`}>
          {patient.currentStatus} · {patient.currentRisk}% Risk
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Patient Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-premium rounded-3xl p-6 border border-white/30">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${
                patient.currentStatus === 'CRITICAL' ? 'bg-red-500' :
                patient.currentStatus === 'WARNING' ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}>
                {patient.name?.charAt(0) || 'P'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
                <p className="text-sm text-slate-400">{patient.age}y · {patient.gender} · {patient.ward}</p>
                <p className="text-xs text-slate-400">{patient.mrn || patient.patientId}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} className="text-[#2563EB]" />
                <span>Admitted: {new Date(patient.admissionDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <User size={16} className="text-[#2563EB]" />
                <span>Doctor: {patient.assignedDoctor?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="text-[#2563EB]" />
                <span>Bed: {patient.bedNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Brain size={16} className="text-[#2563EB]" />
                <span>AI Confidence: {patient.aiConfidence || 0}%</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <p className="text-2xl font-bold text-[#2563EB]">{vitalsHistory.length}</p>
              <p className="text-xs text-slate-400">Vitals Records</p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <p className="text-2xl font-bold text-[#2563EB]">{predictions.length}</p>
              <p className="text-xs text-slate-400">Predictions</p>
            </div>
          </div>
        </div>

        {/* Center - Vitals & Graphs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vitals Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Heart size={20} className="text-red-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Heart Rate</p>
              <p className="text-xl font-bold text-slate-800">{latestVitals.heartRate || '--'} <span className="text-sm font-normal text-slate-400">bpm</span></p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Thermometer size={20} className="text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Temperature</p>
              <p className="text-xl font-bold text-slate-800">{latestVitals.temperature || '--'}° <span className="text-sm font-normal text-slate-400">F</span></p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Droplet size={20} className="text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Blood Pressure</p>
              <p className="text-xl font-bold text-slate-800">{latestVitals.systolicBP || '--'}/{latestVitals.diastolicBP || '--'} <span className="text-sm font-normal text-slate-400">mmHg</span></p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Activity size={20} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">SpO2</p>
              <p className="text-xl font-bold text-slate-800">{latestVitals.spo2 || '--'}%</p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Wind size={20} className="text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Respiration</p>
              <p className="text-xl font-bold text-slate-800">{latestVitals.respiratoryRate || '--'} <span className="text-sm font-normal text-slate-400">/min</span></p>
            </div>
            <div className="glass-premium rounded-2xl p-4 text-center border border-white/30">
              <Brain size={20} className="text-[#2563EB] mx-auto mb-1" />
              <p className="text-xs text-slate-400">AI Confidence</p>
              <p className="text-xl font-bold text-emerald-600">{patient.aiConfidence || 0}%</p>
            </div>
          </div>

          {/* Risk Trend Graph */}
          <div className="glass-premium rounded-3xl p-6 border border-white/30">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Risk Trend</h3>
            {riskTrend.length > 0 ? (
              <div className="h-32 flex items-end gap-2">
                {riskTrend.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${
                        val >= 80 ? 'bg-red-500' :
                        val >= 60 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ 
                        height: `${(val / 100) * 100}%`,
                        opacity: 0.6 + (i / riskTrend.length) * 0.4
                      }}
                    />
                    <span className="text-[10px] text-slate-400">
                      {i === riskTrend.length - 1 ? 'Now' : `${-(riskTrend.length - 1 - i)}h`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No risk data available</p>
            )}
          </div>

          {/* AI Chatbot */}
          <div className="relative">
            <button
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition z-40"
            >
              <MessageCircle size={24} />
            </button>

            {showChat && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[500px] glass-premium rounded-3xl shadow-2xl border border-white/30 flex flex-col z-50"
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-white/30 flex items-center justify-between bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5 rounded-t-3xl">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#2563EB]" />
                    <span className="font-semibold text-slate-800">AI Health Assistant</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.type === 'user' 
                          ? 'bg-[#2563EB] text-white rounded-tr-sm' 
                          : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-tl-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-white/30 flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Ask about your health..."
                    className="flex-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                  <button
                    onClick={handleChatSend}
                    className="p-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#2563EB]/90 transition"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}