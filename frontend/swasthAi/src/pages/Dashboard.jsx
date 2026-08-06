import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, AlertTriangle, TrendingUp, 
  Clock, Plus, X, Heart, Thermometer, 
  Droplet, Wind, Search, RefreshCw, 
  Eye, Save, Brain, CheckCircle,
  UserCircle, UserPlus, Mail, Lock,
  Sparkles, Calendar, MapPin, User,
  Stethoscope, UserRound, Send, Trash2,
  Download, Copy, Bot, MessageCircle, History
} from 'lucide-react';
import { patientAPI, vitalsAPI, predictionAPI, apiClient } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PatientTimeline from '../components/Timeline/PatientTimeline';
import PatientPriorityQueue from '../components/PatientPriorityQueue';
import AIExplanation from '../components/AIExplanation';

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [aiExplanationData, setAiExplanationData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWard, setFilterWard] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelinePatient, setTimelinePatient] = useState(null);
  
  // ✅ AI EXPLANATION MODAL STATE
  const [showAIExplanationModal, setShowAIExplanationModal] = useState(false);
  const [aiExplanationModalData, setAiExplanationModalData] = useState(null);
  
  // ✅ CHATBOT STATES
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatPatient, setSelectedChatPatient] = useState(null);
  const chatEndRef = useRef(null);
  
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    ward: 'Ward A',
    bedNumber: '',
    diagnosis: '',
    contactNumber: '',
    email: '',
    password: '',
  });
  const [vitalsForm, setVitalsForm] = useState({
    patientId: '',
    heartRate: '',
    temperature: '',
    systolicBP: '',
    diastolicBP: '',
    spo2: '',
    respiratoryRate: '',
    wbc: '',
    rbc: '',
    notes: '',
  });

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching patients...');
      const response = await patientAPI.getAll();
      console.log('📋 Patients fetched:', response.data.data);
      setPatients(response.data.data || []);
      if (response.data.data?.length === 0) {
        toast.info('No patients found. Please add a patient.');
      }
    } catch (error) {
      console.error('❌ Fetch patients error:', error);
      toast.error(error.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();

    socketService.connect();

    const handleVitalsUpdate = (data) => {
      setPatients(prev => prev.map(p => 
        p._id === data.patientId 
          ? { ...p, currentRisk: data.risk?.riskScore || p.currentRisk, currentStatus: data.risk?.status || p.currentStatus }
          : p
      ));
      toast.success(`Vitals updated for patient`);
    };

    const handleAlertTriggered = (data) => {
      toast.error(`🚨 ${data.message || 'Alert triggered!'}`);
    };

    socketService.on('vitals-updated', handleVitalsUpdate);
    socketService.on('alert-triggered', handleAlertTriggered);

    if (user?.ward) {
      socketService.joinWard(user.ward);
    } else {
      socketService.joinWard('ALL');
    }

    return () => {
      socketService.off('vitals-updated', handleVitalsUpdate);
      socketService.off('alert-triggered', handleAlertTriggered);
    };
  }, [fetchPatients, user]);

  // ✅ Load chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch (e) {
        setChatHistory([]);
      }
    } else {
      setChatHistory([
        { 
          type: 'ai', 
          message: '👋 Hello! I\'m your AI Clinical Assistant. I can help you with:\n\n• Patient vitals analysis\n• Risk assessment\n• Treatment recommendations\n• Lab reports interpretation\n• Emergency alerts\n\nAsk me anything about your patients!',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, []);

  // ✅ Save chat history to localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // ✅ Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  // ✅ Fetch timeline for a patient
  const fetchTimeline = async (patientId) => {
    try {
      const response = await apiClient.get(`/timeline/patient/${patientId}?limit=50`);
      setTimelineData(response.data.data.events || []);
      return response.data.data.events || [];
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Failed to load timeline');
      return [];
    }
  };

  // ✅ Open timeline modal
  const openTimelineModal = async (patient) => {
    setTimelinePatient(patient);
    setShowTimelineModal(true);
    await fetchTimeline(patient._id);
  };

  // ✅ OPEN AI EXPLANATION MODAL
  const openAIExplanation = (patient) => {
    const latestVitals = patient.vitalsHistory?.[0] || {};
    
    // Build factors from patient data
    const factors = [];
    
    // Temperature factor
    if (latestVitals.temperature) {
      const temp = parseFloat(latestVitals.temperature);
      factors.push({
        feature: 'Temperature',
        impact: temp > 100.4 ? 32 : temp > 99.5 ? 20 : 10,
        direction: temp > 99.5 ? 'up' : 'down',
        value: `${latestVitals.temperature}°F`,
        description: temp > 100.4 ? '⚠️ Elevated temperature indicates possible infection' : temp > 99.5 ? '📊 Slightly elevated temperature' : '✅ Normal temperature'
      });
    }

    // Heart Rate factor
    if (latestVitals.heartRate) {
      const hr = parseFloat(latestVitals.heartRate);
      factors.push({
        feature: 'Heart Rate',
        impact: hr > 100 ? 28 : hr > 90 ? 18 : 8,
        direction: hr > 90 ? 'up' : 'down',
        value: `${latestVitals.heartRate} bpm`,
        description: hr > 100 ? '⚠️ Tachycardia - increased heart rate' : hr > 90 ? '📊 Elevated heart rate' : '✅ Normal heart rate'
      });
    }

    // Blood Pressure factor
    if (latestVitals.systolicBP && latestVitals.diastolicBP) {
      const sys = parseFloat(latestVitals.systolicBP);
      const dia = parseFloat(latestVitals.diastolicBP);
      const isLow = sys < 90 || dia < 60;
      const isHigh = sys > 140 || dia > 90;
      factors.push({
        feature: 'Blood Pressure',
        impact: isLow ? 30 : isHigh ? 20 : 8,
        direction: isLow ? 'down' : isHigh ? 'up' : 'stable',
        value: `${latestVitals.systolicBP}/${latestVitals.diastolicBP} mmHg`,
        description: isLow ? '⚠️ Low blood pressure - possible sepsis' : isHigh ? '📊 High blood pressure' : '✅ Normal blood pressure'
      });
    }

    // SpO2 factor
    if (latestVitals.spo2) {
      const spo2 = parseFloat(latestVitals.spo2);
      factors.push({
        feature: 'SpO2',
        impact: spo2 < 92 ? 25 : spo2 < 95 ? 15 : 5,
        direction: spo2 < 95 ? 'down' : 'up',
        value: `${latestVitals.spo2}%`,
        description: spo2 < 92 ? '⚠️ Low oxygen saturation' : spo2 < 95 ? '📊 Decreased oxygen saturation' : '✅ Normal oxygen saturation'
      });
    }

    // WBC factor
    if (latestVitals.wbc) {
      const wbc = parseFloat(latestVitals.wbc);
      factors.push({
        feature: 'WBC Count',
        impact: wbc > 11 ? 22 : wbc < 4.5 ? 18 : 6,
        direction: wbc > 11 ? 'up' : wbc < 4.5 ? 'down' : 'stable',
        value: `${latestVitals.wbc} x10³/µL`,
        description: wbc > 11 ? '⚠️ Elevated WBC - possible infection' : wbc < 4.5 ? '📊 Low WBC' : '✅ Normal WBC count'
      });
    }

    // RBC factor
    if (latestVitals.rbc) {
      const rbc = parseFloat(latestVitals.rbc);
      factors.push({
        feature: 'RBC Count',
        impact: rbc < 4.0 ? 15 : 5,
        direction: rbc < 4.0 ? 'down' : 'stable',
        value: `${latestVitals.rbc} x10⁶/µL`,
        description: rbc < 4.0 ? '⚠️ Low RBC - possible anemia' : '✅ Normal RBC count'
      });
    }

    // Respiratory Rate factor
    if (latestVitals.respiratoryRate) {
      const rr = parseFloat(latestVitals.respiratoryRate);
      factors.push({
        feature: 'Respiratory Rate',
        impact: rr > 22 ? 20 : rr > 18 ? 12 : 5,
        direction: rr > 18 ? 'up' : 'stable',
        value: `${latestVitals.respiratoryRate}/min`,
        description: rr > 22 ? '⚠️ Tachypnea - increased breathing' : rr > 18 ? '📊 Elevated respiratory rate' : '✅ Normal respiratory rate'
      });
    }

    // Sort by impact
    factors.sort((a, b) => b.impact - a.impact);

    // Calculate missing data
    const missingData = [];
    if (!latestVitals.wbc) missingData.push({ label: 'WBC Count', estimated: 'Estimated from clinical signs' });
    if (!latestVitals.rbc) missingData.push({ label: 'RBC Count', estimated: 'Estimated from clinical signs' });
    if (!latestVitals.temperature) missingData.push({ label: 'Temperature', estimated: 'Estimated from clinical history' });
    
    // Only show missing if actual data missing
    const hasMissing = missingData.length > 0;

    setAiExplanationModalData({
      patientName: patient.name,
      riskScore: patient.currentRisk || 0,
      confidence: patient.aiConfidence || 88,
      modelVersion: 'v2.0',
      predictedAt: new Date().toISOString(),
      accuracy: '94.7%',
      factors: factors,
      missingData: hasMissing ? missingData : null,
      recommendations: [
        patient.currentRisk >= 80 ? '🚨 Immediate medical attention required' : '📊 Continue monitoring',
        patient.currentRisk >= 60 ? '📋 Check vitals every 2 hours' : '📋 Check vitals every 4 hours',
        '💊 Maintain hydration and medication schedule',
        patient.currentRisk >= 40 ? '🩸 Consider blood culture test' : '🩸 Regular blood work as scheduled',
        '📝 Update clinical notes with any changes'
      ]
    });
    
    setShowAIExplanationModal(true);
  };

  // ✅ Get patient vitals summary
  const getPatientVitalsSummary = (patient) => {
    const latest = patient.vitalsHistory?.[0] || {};
    return {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      ward: patient.ward,
      status: patient.currentStatus || 'STABLE',
      risk: patient.currentRisk || 0,
      heartRate: latest.heartRate || 'N/A',
      temperature: latest.temperature || 'N/A',
      systolicBP: latest.systolicBP || 'N/A',
      diastolicBP: latest.diastolicBP || 'N/A',
      spo2: latest.spo2 || 'N/A',
      respiratoryRate: latest.respiratoryRate || 'N/A',
      wbc: latest.wbc || 'N/A',
      rbc: latest.rbc || 'N/A',
      diagnosis: patient.diagnosis || 'Not specified',
      doctor: patient.assignedDoctor?.name || 'Not Assigned',
      nurse: patient.assignedNurse?.name || 'Not Assigned',
    };
  };

  // ✅ Advanced AI Chat Response
  const generateAIResponse = (message, patientData) => {
    const msg = message.toLowerCase().trim();
    const p = patientData;
    
    if (msg.includes('patient') && (msg.includes('info') || msg.includes('detail') || msg.includes('who'))) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      return `📋 **Patient Summary**\n\n👤 Name: ${p.name}\n📅 Age: ${p.age} years\n⚥ Gender: ${p.gender}\n🏥 Ward: ${p.ward}\n🩺 Diagnosis: ${p.diagnosis}\n📊 Status: ${p.status}\n🎯 Risk Score: ${p.risk}%\n👨‍⚕️ Doctor: ${p.doctor}\n👩‍⚕️ Nurse: ${p.nurse}`;
    }

    if (msg.includes('vitals') || msg.includes('vital') || msg.includes('health') || msg.includes('overview')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      return `📊 **Vitals Summary for ${p.name}**\n\n❤️ Heart Rate: ${p.heartRate} bpm (Normal: 60-100)\n🌡️ Temperature: ${p.temperature}°F (Normal: 97.0-100.4)\n🩸 BP: ${p.systolicBP}/${p.diastolicBP} mmHg (Normal: 90-140/60-90)\n💨 SpO2: ${p.spo2}% (Normal: 95-100)\n🫁 Respiration: ${p.respiratoryRate}/min (Normal: 12-22)\n🧬 WBC: ${p.wbc} x10³/µL (Normal: 4.5-11.0)\n🧬 RBC: ${p.rbc} x10⁶/µL (Normal: 4.5-5.9)\n\n${p.risk > 70 ? '⚠️ **Alert:** Patient is in CRITICAL condition!' : p.risk > 40 ? '📊 **Note:** Patient requires monitoring.' : '✅ **Status:** Patient is stable.'}`;
    }

    if (msg.includes('risk') || msg.includes('danger') || msg.includes('critical') || msg.includes('warning')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      const riskLevel = p.risk >= 80 ? '🔴 **CRITICAL**' : p.risk >= 60 ? '🟡 **HIGH**' : p.risk >= 40 ? '🟠 **MEDIUM**' : '🟢 **LOW**';
      return `🎯 **Risk Assessment for ${p.name}**\n\n📊 Risk Score: ${p.risk}%\n⚠️ Risk Level: ${riskLevel}\n📈 Confidence: ${p.aiConfidence || 88}%\n\n${p.risk >= 80 ? '🚨 **IMMEDIATE ACTION REQUIRED!**\n• Patient needs urgent medical attention\n• Alert the doctor immediately\n• Start emergency protocol' : p.risk >= 60 ? '📊 **Monitor Closely:**\n• Check vitals every 2 hours\n• Inform the attending doctor\n• Prepare for potential intervention' : '✅ **Routine Monitoring:**\n• Continue regular checkups\n• Follow prescribed treatment plan'}`;
    }

    if (msg.includes('wbc') || msg.includes('white blood') || msg.includes('infection')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      const wbc = p.wbc;
      if (wbc === 'N/A') return "❌ WBC data not available for this patient.";
      const status = wbc > 11.0 ? '⚠️ **Elevated** - May indicate infection or inflammation' : 
                     wbc < 4.5 ? '⚠️ **Low** - May indicate bone marrow issues or viral infection' : 
                     '✅ **Normal** - Within healthy range';
      return `🧬 **WBC Analysis for ${p.name}**\n\n📊 WBC Count: ${wbc} x10³/µL\n📋 Status: ${status}\n\n${wbc > 11.0 ? '💡 **Recommendation:**\n• Check for signs of infection\n• Consider blood culture test\n• Monitor temperature closely' : wbc < 4.5 ? '💡 **Recommendation:**\n• Check for viral infection\n• Review medications\n• Consider repeat test' : '💡 **Recommendation:**\n• Continue regular monitoring\n• No immediate action needed'}`;
    }

    if (msg.includes('rbc') || msg.includes('red blood') || msg.includes('anemia')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      const rbc = p.rbc;
      if (rbc === 'N/A') return "❌ RBC data not available for this patient.";
      const status = rbc > 5.9 ? '⚠️ **Elevated** - May indicate dehydration or other issues' : 
                     rbc < 4.5 ? '⚠️ **Low** - May indicate anemia or nutritional deficiency' : 
                     '✅ **Normal** - Within healthy range';
      return `🧬 **RBC Analysis for ${p.name}**\n\n📊 RBC Count: ${rbc} x10⁶/µL\n📋 Status: ${status}\n\n${rbc < 4.5 ? '💡 **Recommendation:**\n• Check for anemia symptoms\n• Review iron and B12 levels\n• Consider dietary changes' : '💡 **Recommendation:**\n• Continue regular monitoring\n• Maintain healthy diet'}`;
    }

    if (msg.includes('doctor') || msg.includes('physician')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      return `👨‍⚕️ **Doctor Information**\n\n📋 Assigned Doctor: ${p.doctor}\n🏥 Hospital: City District Hospital\n📞 Contact: Available during clinic hours\n\n💡 **Recommendation:** Schedule follow-up appointment if needed.`;
    }

    if (msg.includes('nurse')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      return `👩‍⚕️ **Nurse Information**\n\n📋 Assigned Nurse: ${p.nurse}\n🏥 Ward: ${p.ward}\n📞 Contact: Available during shift hours\n\n💡 **Recommendation:** For immediate assistance, contact the nursing station.`;
    }

    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('commands')) {
      return `🤖 **AI Assistant Help**\n\nI can help you with:\n\n📊 **Patient Info** - "Show patient details"\n❤️ **Vitals** - "Show vitals"\n🎯 **Risk** - "What is the risk score?"\n🧬 **WBC** - "WBC count"\n🧬 **RBC** - "RBC count"\n👨‍⚕️ **Doctor** - "Who is the doctor?"\n👩‍⚕️ **Nurse** - "Who is the nurse?"\n📝 **Diagnosis** - "What is the diagnosis?"\n\n💡 Just type your question naturally!`;
    }

    if (msg.includes('diagnosis') || msg.includes('condition') || msg.includes('disease')) {
      if (!p) return "❌ No patient selected. Please select a patient from the list first.";
      return `🩺 **Diagnosis Information for ${p.name}**\n\n📋 Diagnosis: ${p.diagnosis}\n📊 Status: ${p.status}\n🎯 Risk: ${p.risk}%\n\n💡 **Recommendation:** Continue treatment as prescribed. Monitor for any changes.`;
    }

    if (msg.includes('all patients') || msg.includes('list patients') || msg.includes('show patients')) {
      if (!patients || patients.length === 0) return "❌ No patients found in the system.";
      const total = patients.length;
      const critical = patients.filter(p => p.currentStatus === 'CRITICAL').length;
      const warning = patients.filter(p => p.currentStatus === 'WARNING').length;
      const stable = patients.filter(p => p.currentStatus === 'STABLE').length;
      return `📋 **Patient Overview**\n\n👥 Total Patients: ${total}\n🔴 Critical: ${critical}\n🟡 Warning: ${warning}\n🟢 Stable: ${stable}\n\n💡 ${critical > 0 ? `⚠️ ${critical} patient(s) need immediate attention!` : '✅ All patients are stable.'}`;
    }

    if (msg.includes('alert') || msg.includes('emergency') || msg.includes('urgent')) {
      const criticalPatients = patients.filter(p => p.currentStatus === 'CRITICAL');
      if (criticalPatients.length === 0) return "✅ No critical alerts at this time. All patients are stable.";
      const names = criticalPatients.map(p => `🔴 ${p.name} (${p.currentRisk}%)`).join('\n');
      return `🚨 **Emergency Alerts**\n\n⚠️ **${criticalPatients.length} patient(s) require immediate attention:**\n\n${names}\n\n💡 **Action Required:**\n• Alert the medical team\n• Prepare for emergency protocol\n• Monitor vitals continuously`;
    }

    if (msg.includes('chat') || msg.includes('history') || msg.includes('previous')) {
      return `💬 **Chat History**\n\nI remember our conversation. You can ask me about:\n• Patient vitals and health status\n• Risk assessment and predictions\n• Lab reports (WBC, RBC, etc.)\n• Doctor and nurse assignments\n• Emergency alerts\n\nJust type your question!`;
    }

    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('greetings')) {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
      return `👋 ${timeGreeting}! I'm your AI Clinical Assistant.\n\n${p ? `I see you're looking at ${p.name}'s profile. How can I help you?\n\nAsk me about their vitals, risk score, or any health metric.` : 'I can help you with patient vitals, risk assessment, and clinical insights.\n\n💡 Select a patient from the list to get specific information.'}`;
    }

    return `🤖 I understand you're asking about: "${message}"\n\n📊 Based on your query, here are some suggestions:\n\n• To check patient vitals, ask: "Show vitals"\n• To check risk: "What is the risk score?"\n• For WBC: "WBC count"\n• For RBC: "RBC count"\n• For help: "Help"\n\n💡 If you need specific information, please select a patient and ask a more detailed question.`;
  };

  // ✅ Handle chat send
  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage.trim();
    
    setChatHistory(prev => [...prev, { 
      type: 'user', 
      message: userMessage,
      timestamp: new Date().toISOString()
    }]);
    
    setChatMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      const patientData = selectedChatPatient ? getPatientVitalsSummary(selectedChatPatient) : null;
      const response = generateAIResponse(userMessage, patientData);
      
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        message: response,
        timestamp: new Date().toISOString()
      }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  // ✅ Clear chat history
  const clearChatHistory = () => {
    if (window.confirm('Clear all chat history?')) {
      setChatHistory([{ 
        type: 'ai', 
        message: '👋 Chat history cleared. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
      localStorage.removeItem('chatHistory');
      toast.success('Chat history cleared');
    }
  };

  // ✅ Export chat history
  const exportChatHistory = () => {
    const text = chatHistory.map(msg => 
      `${msg.type === 'user' ? '👤 You' : '🤖 AI'} [${new Date(msg.timestamp).toLocaleString()}]: ${msg.message}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat history exported');
  };

  // Handle Add New Patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    
    if (!newPatientForm.name || !newPatientForm.age || !newPatientForm.gender || !newPatientForm.ward) {
      toast.error('Please fill all required fields');
      return;
    }

    if (newPatientForm.email && newPatientForm.password && newPatientForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const patientData = {
        name: newPatientForm.name,
        age: parseInt(newPatientForm.age),
        gender: newPatientForm.gender,
        ward: newPatientForm.ward,
        bedNumber: newPatientForm.bedNumber || '',
        diagnosis: newPatientForm.diagnosis || '',
        contactNumber: newPatientForm.contactNumber || '',
        email: newPatientForm.email || '',
        password: newPatientForm.password || '',
        createdBy: user?.id,
      };
      
      console.log('📝 Adding patient:', patientData);
      const response = await patientAPI.create(patientData);
      console.log('✅ Patient added:', response.data);
      
      toast.success(response.data.data?.message || 'Patient added successfully!');
      setShowAddPatientModal(false);
      setNewPatientForm({
        name: '',
        age: '',
        gender: 'Male',
        ward: 'Ward A',
        bedNumber: '',
        diagnosis: '',
        contactNumber: '',
        email: '',
        password: '',
      });
      await fetchPatients();
    } catch (error) {
      console.error('❌ Add patient error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add patient';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle vitals submission
  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    
    if (!vitalsForm.patientId) {
      toast.error('Please select a patient');
      return;
    }

    try {
      console.log('📝 Submitting vitals:', vitalsForm);
      const vitalsData = {
        patientId: vitalsForm.patientId,
        heartRate: parseFloat(vitalsForm.heartRate),
        temperature: parseFloat(vitalsForm.temperature),
        systolicBP: parseFloat(vitalsForm.systolicBP),
        diastolicBP: parseFloat(vitalsForm.diastolicBP),
        spo2: parseFloat(vitalsForm.spo2),
        respiratoryRate: parseFloat(vitalsForm.respiratoryRate),
        wbc: vitalsForm.wbc ? parseFloat(vitalsForm.wbc) : null,
        rbc: vitalsForm.rbc ? parseFloat(vitalsForm.rbc) : null,
        notes: vitalsForm.notes || '',
      };
      
      const response = await vitalsAPI.add(vitalsData);
      console.log('✅ Vitals added:', response.data);
      
      toast.success('Vitals updated successfully!');
      await fetchPatients();
      setShowVitalsModal(false);
      setVitalsForm({
        patientId: '',
        heartRate: '',
        temperature: '',
        systolicBP: '',
        diastolicBP: '',
        spo2: '',
        respiratoryRate: '',
        wbc: '',
        rbc: '',
        notes: '',
      });
    } catch (error) {
      console.error('❌ Add vitals error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update vitals';
      toast.error(errorMsg);
    }
  };

  // Open vitals modal
  const openVitalsModal = (patient) => {
    const latestVitals = patient.vitalsHistory?.[0] || {};
    setVitalsForm({
      patientId: patient._id,
      heartRate: latestVitals.heartRate || '',
      temperature: latestVitals.temperature || '',
      systolicBP: latestVitals.systolicBP || '',
      diastolicBP: latestVitals.diastolicBP || '',
      spo2: latestVitals.spo2 || '',
      respiratoryRate: latestVitals.respiratoryRate || '',
      wbc: latestVitals.wbc || '',
      rbc: latestVitals.rbc || '',
      notes: '',
    });
    setSelectedPatient(patient);
    setShowVitalsModal(true);
  };

  // AI Explanation Handler
  const handleAIExplanation = async (patient) => {
    try {
      setShowAIExplanation(true);
      setAiExplanationData(null);
      
      let predictionData = null;
      try {
        const predRes = await predictionAPI.getLatest(patient._id);
        predictionData = predRes.data.data;
      } catch (pError) {
        console.log('No predictions found, using fallback');
      }
      
      const explanation = {
        patientName: patient.name,
        riskScore: patient.currentRisk || 0,
        status: patient.currentStatus || 'STABLE',
        confidence: patient.aiConfidence || 0,
        age: patient.age,
        gender: patient.gender,
        ward: patient.ward,
        diagnosis: patient.diagnosis || 'Not specified',
        factors: predictionData?.topFactors || [
          { feature: 'Temperature', impact: 32, direction: 'positive' },
          { feature: 'Heart Rate', impact: 25, direction: 'positive' },
          { feature: 'Blood Pressure', impact: 18, direction: 'negative' },
          { feature: 'SpO2', impact: 15, direction: 'negative' },
          { feature: 'Respiration', impact: 10, direction: 'positive' }
        ],
        recommendations: predictionData?.recommendations || [
          'Continue regular monitoring',
          'Maintain hydration',
          'Follow prescribed medications'
        ],
        explanation: predictionData?.explanation || `Based on the analysis of vitals, the patient has a ${patient.currentRisk || 0}% risk of sepsis. The main contributing factors are temperature, heart rate, and blood pressure.`,
        vitals: patient.vitalsHistory?.[0] || null
      };
      
      setAiExplanationData(explanation);
    } catch (error) {
      console.error('❌ AI Explanation error:', error);
      toast.error('Failed to get AI explanation');
      
      setAiExplanationData({
        patientName: patient.name,
        riskScore: patient.currentRisk || 0,
        status: patient.currentStatus || 'STABLE',
        confidence: patient.aiConfidence || 0,
        age: patient.age,
        gender: patient.gender,
        ward: patient.ward,
        diagnosis: patient.diagnosis || 'Not specified',
        factors: [
          { feature: 'Temperature', impact: 32, direction: 'positive' },
          { feature: 'Heart Rate', impact: 25, direction: 'positive' },
          { feature: 'Blood Pressure', impact: 18, direction: 'negative' },
          { feature: 'SpO2', impact: 15, direction: 'negative' }
        ],
        recommendations: [
          'Continue regular monitoring',
          'Maintain hydration',
          'Follow prescribed medications'
        ],
        explanation: `Based on the analysis, the patient has a ${patient.currentRisk || 0}% risk. Regular monitoring is recommended.`,
        vitals: patient.vitalsHistory?.[0] || null
      });
    }
  };

  // Get assigned staff name based on logged-in user role
  const getAssignedStaffName = (patient) => {
    if (user?.role === 'DOCTOR') {
      if (patient.assignedNurse && typeof patient.assignedNurse === 'object') {
        return patient.assignedNurse.name || 'Not Assigned';
      }
      return 'Not Assigned';
    } else {
      if (patient.assignedDoctor && typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.name || 'Not Assigned';
      }
      return 'Not Assigned';
    }
  };

  const getAssignedStaffLabel = () => {
    if (user?.role === 'DOCTOR') {
      return 'Nurse';
    }
    return 'Doctor';
  };

  const getAssignedStaffIcon = () => {
    if (user?.role === 'DOCTOR') {
      return UserRound;
    }
    return Stethoscope;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': 
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'WARNING': 
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: 
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getRiskColor = (status) => {
    switch(status) {
      case 'CRITICAL': return '#EF4444';
      case 'WARNING': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ward?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = filterWard === 'all' || p.ward === filterWard;
    return matchesSearch && matchesWard;
  });

  const stats = {
    monitored: patients.length,
    critical: patients.filter(p => p.currentStatus === 'CRITICAL').length,
    warning: patients.filter(p => p.currentStatus === 'WARNING').length,
    stable: patients.filter(p => p.currentStatus === 'STABLE').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading patients...</p>
        </div>
      </div>
    );
  }

  const AssignedIcon = getAssignedStaffIcon();

  return (
    <div className="space-y-6">
      {/* ========== TOP BAR ========== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Command Center</h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <UserCircle size={16} className="text-[#2563EB]" />
            {user?.name || 'User'} · {user?.role || 'Loading...'}
            {user?.hospital?.hospitalName && ` · ${user.hospital.hospitalName}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 w-48 md:w-56"
            />
          </div>
          <select 
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            <option value="all">All Wards</option>
            <option value="ICU A">ICU A</option>
            <option value="ICU B">ICU B</option>
            <option value="Ward A">Ward A</option>
            <option value="Ward B">Ward B</option>
            <option value="Ward C">Ward C</option>
            <option value="Emergency">Emergency</option>
          </select>
          <button 
            onClick={fetchPatients}
            className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200 hover:bg-white transition"
          >
            <RefreshCw size={18} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-premium rounded-3xl p-5 card-hover border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Monitored</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.monitored}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="glass-premium rounded-3xl p-5 card-hover border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats.critical}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="glass-premium rounded-3xl p-5 card-hover border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Warning</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{stats.warning}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Activity size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="glass-premium rounded-3xl p-5 card-hover border border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Stable</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.stable}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== PATIENT PRIORITY QUEUE ========== */}
      <PatientPriorityQueue />

      {/* ========== AI INSIGHTS ========== */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium rounded-3xl p-4 border border-[#2563EB]/20 bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
              <Brain size={20} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">AI Clinical Intelligence</p>
              <p className="text-xs text-slate-500">
                {stats.critical > 0 ? `${stats.critical} patients need immediate attention` : 'All patients stable'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {stats.warning} Warning
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              {stats.critical} Critical
            </span>
          </div>
        </div>
      </motion.div>

      {/* ========== PATIENT LIST ========== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Patient Monitoring</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddPatientModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm flex items-center gap-2 hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/25"
            >
              <UserPlus size={16} /> Add Patient
            </button>
            <button 
              onClick={() => {
                if (patients.length > 0) {
                  openVitalsModal(patients[0]);
                } else {
                  toast.error('No patients available. Please add a patient first.');
                  setShowAddPatientModal(true);
                }
              }}
              className="px-4 py-2 btn-primary rounded-xl text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Add Vitals
            </button>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="glass-premium rounded-3xl p-12 text-center border border-white/30">
            <Users size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No patients found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterWard('all');
              }}
              className="mt-4 px-4 py-2 bg-[#2563EB]/10 text-[#2563EB] rounded-xl text-sm hover:bg-[#2563EB]/20 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedChatPatient(patient)}
                className={`glass-premium rounded-3xl p-5 border transition-all cursor-pointer ${
                  patient.currentStatus === 'CRITICAL' ? 'border-red-400/50 shadow-red-500/10' : 
                  patient.currentStatus === 'WARNING' ? 'border-amber-400/50 shadow-amber-500/10' : 
                  'border-emerald-400/30'
                } ${selectedChatPatient?._id === patient._id ? 'ring-2 ring-[#2563EB]' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                      patient.currentStatus === 'CRITICAL' ? 'bg-red-500' : 
                      patient.currentStatus === 'WARNING' ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`}>
                      {patient.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{patient.name}</h3>
                      <p className="text-xs text-slate-400">
                        {patient.age}y · {patient.gender} · {patient.ward}
                      </p>
                      <p className="text-[10px] text-slate-400">{patient.mrn || patient.patientId}</p>
                      <p className="text-[10px] text-[#2563EB] font-medium flex items-center gap-1 mt-0.5">
                        <AssignedIcon size={10} /> 
                        {getAssignedStaffLabel()}: {getAssignedStaffName(patient)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(patient.currentStatus)}`}>
                    {patient.currentStatus}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle 
                        cx="32" cy="32" r="28" fill="none" 
                        stroke={getRiskColor(patient.currentStatus)}
                        strokeWidth="4" 
                        strokeDasharray={`${(patient.currentRisk || 0) * 1.76} 176`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                      {patient.currentRisk || 0}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">AI Prediction</p>
                    <p className="text-xs font-medium text-slate-700">
                      {patient.currentStatus === 'CRITICAL' ? '⚠️ Immediate attention' :
                       patient.currentStatus === 'WARNING' ? '📊 Monitor closely' : '✅ Stable'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-slate-400">Confidence</span>
                      <span className="text-[10px] font-medium text-emerald-600">
                        {patient.aiConfidence || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {patient.vitalsHistory?.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                      <p className="text-[10px] text-slate-400">HR</p>
                      <p className="text-sm font-bold text-slate-800">
                        {patient.vitalsHistory[0]?.heartRate || '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                      <p className="text-[10px] text-slate-400">Temp</p>
                      <p className="text-sm font-bold text-slate-800">
                        {patient.vitalsHistory[0]?.temperature || '-'}°
                      </p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                      <p className="text-[10px] text-slate-400">SpO2</p>
                      <p className="text-sm font-bold text-slate-800">
                        {patient.vitalsHistory[0]?.spo2 || '-'}%
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openVitalsModal(patient);
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] rounded-xl hover:bg-[#2563EB]/20 transition flex items-center justify-center gap-1"
                  >
                    <Activity size={12} /> Update Vitals
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(patient);
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-medium bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> View
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openTimelineModal(patient);
                    }}
                    className="py-1.5 px-2.5 text-center text-xs font-medium bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition flex items-center justify-center gap-1"
                    title="View Timeline"
                  >
                    <History size={12} />
                  </button>
                  {/* ✅ NEW: Why AI Predicted This Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openAIExplanation(patient);
                    }}
                    className="py-1.5 px-2.5 text-center text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-purple-600 rounded-xl hover:from-blue-200 hover:to-purple-200 transition flex items-center justify-center gap-1"
                    title="Why AI Predicted This"
                  >
                    <Brain size={12} /> Why AI?
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ========== ADD PATIENT MODAL ========== */}
      <AnimatePresence>
        {showAddPatientModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddPatientModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-premium rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Add New Patient</h3>
                  <p className="text-sm text-slate-400">Enter patient details</p>
                </div>
                <button onClick={() => setShowAddPatientModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Patient Name *</label>
                  <input
                    type="text"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Age *</label>
                    <input
                      type="number"
                      value={newPatientForm.age}
                      onChange={(e) => setNewPatientForm({...newPatientForm, age: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="Age"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Gender *</label>
                    <select
                      value={newPatientForm.gender}
                      onChange={(e) => setNewPatientForm({...newPatientForm, gender: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Ward *</label>
                  <select
                    value={newPatientForm.ward}
                    onChange={(e) => setNewPatientForm({...newPatientForm, ward: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  >
                    <option value="ICU A">ICU A</option>
                    <option value="ICU B">ICU B</option>
                    <option value="Ward A">Ward A</option>
                    <option value="Ward B">Ward B</option>
                    <option value="Ward C">Ward C</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Bed Number</label>
                  <input
                    type="text"
                    value={newPatientForm.bedNumber}
                    onChange={(e) => setNewPatientForm({...newPatientForm, bedNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                    placeholder="A-101"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Diagnosis</label>
                  <input
                    type="text"
                    value={newPatientForm.diagnosis}
                    onChange={(e) => setNewPatientForm({...newPatientForm, diagnosis: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                    placeholder="Initial diagnosis"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    value={newPatientForm.contactNumber}
                    onChange={(e) => setNewPatientForm({...newPatientForm, contactNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                <div className="border-t border-slate-200 pt-3 mt-2">
                  <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                    <Mail size={14} className="text-[#2563EB]" /> Patient Login Credentials (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Email</label>
                      <input
                        type="email"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                        placeholder="patient@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Password</label>
                      <input
                        type="password"
                        value={newPatientForm.password}
                        onChange={(e) => setNewPatientForm({...newPatientForm, password: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                        placeholder="Min 6 characters"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank if patient doesn't need login access</p>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 btn-primary rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Adding Patient...
                    </span>
                  ) : (
                    <>
                      <UserPlus size={18} /> Add Patient
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== VITALS MODAL ========== */}
      <AnimatePresence>
        {showVitalsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVitalsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-premium rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Update Vitals</h3>
                  <p className="text-sm text-slate-400">
                    {selectedPatient?.name} · {selectedPatient?.ward}
                  </p>
                </div>
                <button onClick={() => setShowVitalsModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleVitalsSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Select Patient</label>
                  <select
                    value={vitalsForm.patientId}
                    onChange={(e) => {
                      const patient = patients.find(p => p._id === e.target.value);
                      setVitalsForm({
                        ...vitalsForm,
                        patientId: e.target.value,
                      });
                      setSelectedPatient(patient || null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  >
                    <option value="">Select a patient...</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} - {p.ward} ({p.mrn || p.patientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={vitalsForm.heartRate}
                      onChange={(e) => setVitalsForm({...vitalsForm, heartRate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="60-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.temperature}
                      onChange={(e) => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="97.0-100.4"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Systolic BP</label>
                    <input
                      type="number"
                      value={vitalsForm.systolicBP}
                      onChange={(e) => setVitalsForm({...vitalsForm, systolicBP: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="90-140"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Diastolic BP</label>
                    <input
                      type="number"
                      value={vitalsForm.diastolicBP}
                      onChange={(e) => setVitalsForm({...vitalsForm, diastolicBP: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="60-90"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">SpO2 (%)</label>
                    <input
                      type="number"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({...vitalsForm, spo2: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="95-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Respiration (/min)</label>
                    <input
                      type="number"
                      value={vitalsForm.respiratoryRate}
                      onChange={(e) => setVitalsForm({...vitalsForm, respiratoryRate: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="12-22"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">WBC (x10³/µL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.wbc}
                      onChange={(e) => setVitalsForm({...vitalsForm, wbc: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="4.5-11.0"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Normal: 4.5 - 11.0</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">RBC (x10⁶/µL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsForm.rbc}
                      onChange={(e) => setVitalsForm({...vitalsForm, rbc: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                      placeholder="4.5-5.9"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Normal: 4.5 - 5.9 (M) / 4.0 - 5.2 (F)</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Notes (optional)</label>
                  <input
                    type="text"
                    value={vitalsForm.notes}
                    onChange={(e) => setVitalsForm({...vitalsForm, notes: e.target.value})}
                    placeholder="Any additional observations..."
                    className="w-full px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  />
                </div>

                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Brain size={14} className="text-[#2563EB]" />
                    AI will analyze vitals including WBC & RBC and update risk prediction
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 btn-primary rounded-2xl flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Update Vitals & Predict Risk
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== PATIENT DETAIL MODAL ========== */}
      <AnimatePresence>
        {selectedPatient && !showVitalsModal && !showTimelineModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-premium rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
                    selectedPatient.currentStatus === 'CRITICAL' ? 'bg-red-500' : 
                    selectedPatient.currentStatus === 'WARNING' ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`}>
                    {selectedPatient.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                    <p className="text-sm text-slate-400">
                      {selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.ward}
                    </p>
                    <p className="text-xs text-slate-400">{selectedPatient.mrn || selectedPatient.patientId}</p>
                    <p className="text-xs text-[#2563EB] font-medium flex items-center gap-1 mt-0.5">
                      <AssignedIcon size={12} /> 
                      {getAssignedStaffLabel()}: {getAssignedStaffName(selectedPatient)}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedPatient.currentStatus)}`}>
                      {selectedPatient.currentStatus} · {selectedPatient.currentRisk}% Risk
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {selectedPatient.vitalsHistory?.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-red-500">
                      <Heart size={16} />
                    </div>
                    <p className="text-xs text-slate-400">Heart Rate</p>
                    <p className="text-xl font-bold text-slate-800">
                      {selectedPatient.vitalsHistory[0]?.heartRate} <span className="text-sm font-normal text-slate-400">bpm</span>
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      <Thermometer size={16} />
                    </div>
                    <p className="text-xs text-slate-400">Temperature</p>
                    <p className="text-xl font-bold text-slate-800">
                      {selectedPatient.vitalsHistory[0]?.temperature}° <span className="text-sm font-normal text-slate-400">F</span>
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-500">
                      <Droplet size={16} />
                    </div>
                    <p className="text-xs text-slate-400">Blood Pressure</p>
                    <p className="text-xl font-bold text-slate-800">
                      {selectedPatient.vitalsHistory[0]?.systolicBP}/{selectedPatient.vitalsHistory[0]?.diastolicBP} <span className="text-sm font-normal text-slate-400">mmHg</span>
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <Activity size={16} />
                    </div>
                    <p className="text-xs text-slate-400">SpO2</p>
                    <p className="text-xl font-bold text-slate-800">{selectedPatient.vitalsHistory[0]?.spo2}%</p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-500">
                      <Wind size={16} />
                    </div>
                    <p className="text-xs text-slate-400">Respiration</p>
                    <p className="text-xl font-bold text-slate-800">
                      {selectedPatient.vitalsHistory[0]?.respiratoryRate} <span className="text-sm font-normal text-slate-400">/min</span>
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-[#2563EB]">
                      <Brain size={16} />
                    </div>
                    <p className="text-xs text-slate-400">AI Confidence</p>
                    <p className="text-xl font-bold text-emerald-600">{selectedPatient.aiConfidence || 0}%</p>
                  </div>
                </div>
              )}

              {selectedPatient.riskHistory?.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl p-4">
                  <p className="text-xs font-medium text-slate-600 mb-2">Risk Trend</p>
                  <div className="h-16 flex items-end gap-1.5">
                    {selectedPatient.riskHistory.slice(-10).map((val, i) => (
                      <div 
                        key={i}
                        className="flex-1 rounded-t-sm transition-all duration-500"
                        style={{ 
                          height: `${(val / 100) * 100}%`,
                          backgroundColor: val >= 80 ? '#EF4444' : val >= 60 ? '#F59E0B' : '#10B981',
                          opacity: 0.5 + (i / 10) * 0.5
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setShowVitalsModal(true)}
                  className="flex-1 py-2.5 btn-primary rounded-xl flex items-center justify-center gap-2"
                >
                  <Activity size={16} /> Update Vitals
                </button>
                <button 
                  onClick={() => {
                    openAIExplanation(selectedPatient);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Brain size={16} /> Why AI Predicted This
                </button>
                <button 
                  onClick={() => {
                    openTimelineModal(selectedPatient);
                  }}
                  className="py-2.5 px-4 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition flex items-center justify-center gap-2"
                >
                  <History size={16} /> Timeline
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== TIMELINE MODAL ========== */}
      <AnimatePresence>
        {showTimelineModal && timelinePatient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowTimelineModal(false);
              setTimelinePatient(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-premium rounded-3xl p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <History size={24} className="text-purple-600" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Patient Timeline</h3>
                    <p className="text-sm text-slate-400">
                      {timelinePatient.name} · {timelinePatient.ward} · {timelinePatient.mrn || timelinePatient.patientId}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowTimelineModal(false);
                    setTimelinePatient(null);
                  }} 
                  className="p-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <PatientTimeline patientId={timelinePatient._id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== AI EXPLANATION MODAL ========== */}
      <AnimatePresence>
        {showAIExplanation && aiExplanationData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIExplanation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-premium rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={24} className="text-[#2563EB]" />
                  <h3 className="text-xl font-bold text-slate-800">AI Explanation</h3>
                </div>
                <button onClick={() => setShowAIExplanation(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-slate-50/80 rounded-xl p-3 border border-white/30">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold">
                    {aiExplanationData.patientName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{aiExplanationData.patientName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{aiExplanationData.age || '--'}y · {aiExplanationData.gender || '--'}</span>
                      <span>·</span>
                      <span>{aiExplanationData.ward || '--'}</span>
                    </p>
                    <p className="text-xs text-[#2563EB] flex items-center gap-1">
                      <AssignedIcon size={10} /> 
                      {getAssignedStaffLabel()}: {getAssignedStaffName(selectedPatient)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Risk Score</p>
                      <p className={`text-2xl font-bold ${
                        aiExplanationData.riskScore >= 80 ? 'text-red-500' :
                        aiExplanationData.riskScore >= 60 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {aiExplanationData.riskScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Status</p>
                      <p className={`text-sm font-bold ${
                        aiExplanationData.status === 'CRITICAL' ? 'text-red-500' :
                        aiExplanationData.status === 'WARNING' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {aiExplanationData.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Confidence</p>
                      <p className="text-sm font-bold text-emerald-600">{aiExplanationData.confidence}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">📋 Explanation</p>
                  <p className="text-sm text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-white/30 leading-relaxed">
                    {aiExplanationData.explanation || 'AI analysis based on current vitals'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">📊 Top Contributing Factors</p>
                  <div className="space-y-2">
                    {aiExplanationData.factors?.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-32">{factor.feature}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              factor.direction === 'positive' ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(factor.impact, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">{factor.impact}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {aiExplanationData.recommendations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">💡 Recommendations</p>
                    <ul className="space-y-1">
                      {aiExplanationData.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2 bg-amber-50/50 rounded-xl p-2 border border-amber-100/50">
                          <span className="text-amber-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowAIExplanation(false)}
                className="w-full mt-4 py-2.5 btn-primary rounded-xl"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== ✅ AI EXPLANATION MODAL (NEW) ========== */}
      <AIExplanation 
        isOpen={showAIExplanationModal}
        onClose={() => setShowAIExplanationModal(false)}
        data={aiExplanationModalData}
      />

      {/* ========== FLOATING AI CHATBOT ========== */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition relative"
        >
          <MessageCircle size={28} />
          {selectedChatPatient && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></span>
          )}
        </button>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-[420px] max-w-[90vw] h-[550px] glass-premium rounded-3xl shadow-2xl border border-white/30 flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/30 flex items-center justify-between bg-gradient-to-r from-[#2563EB]/10 to-[#06B6D4]/10 rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <Bot size={20} className="text-[#2563EB]" />
                  <span className="font-semibold text-slate-800">AI Clinical Assistant</span>
                  {selectedChatPatient && (
                    <span className="text-xs bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded-full">
                      👤 {selectedChatPatient.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={clearChatHistory}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-red-500"
                    title="Clear chat history"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={exportChatHistory}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-[#2563EB]"
                    title="Export chat history"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => setShowChat(false)} 
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                      msg.type === 'user' 
                        ? 'bg-[#2563EB] text-white rounded-tr-sm' 
                        : 'bg-white text-slate-700 rounded-tl-sm shadow-sm border border-white/50'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                      <div className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border border-white/50">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Patient Selector */}
              <div className="px-4 pt-2 border-t border-white/30">
                <select
                  value={selectedChatPatient?._id || ''}
                  onChange={(e) => {
                    const patient = patients.find(p => p._id === e.target.value);
                    setSelectedChatPatient(patient || null);
                    if (patient) {
                      toast.success(`Selected: ${patient.name}`);
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-white/60 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                >
                  <option value="">💬 Ask about all patients</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>
                      🏥 {p.name} - {p.ward} ({p.currentStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-white/30 flex gap-2 bg-white/30 rounded-b-3xl">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder={selectedChatPatient ? `Ask about ${selectedChatPatient.name}...` : "Ask about patients..."}
                  className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatMessage.trim()}
                  className="p-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#2563EB]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}