import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Thermometer, Droplet, Wind, Activity, 
  User, Calendar, Clock, FileText, 
  MessageCircle, Bell, ChevronRight, 
  ArrowUp, ArrowDown, CheckCircle, AlertCircle, 
  X, Phone, Mail, MapPin, Sparkles,
  Download, Eye, Stethoscope, LogOut,
  Brain, Shield, Award, UserCircle, RefreshCw,
  PhoneCall, Video, Printer, Share2, Copy,
  UserPlus, UserCheck
} from 'lucide-react';
import { patientAPI, vitalsAPI, predictionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AIReport from '../components/AIReport';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { type: 'ai', message: 'Hello! I\'m your AI Health Assistant. How can I help you today?' }
  ]);

  // ✅ AI REPORT STATE
  const [showAIReport, setShowAIReport] = useState(false);

  // ============ APPOINTMENTS STATE ============
  const [appointments, setAppointments] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    doctor: '',
    date: '',
    time: '',
    hospital: ''
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ============ DEFAULT DOCTORS LIST ============
  const doctorsList = [
    { id: 1, name: 'Dr. Priya Sharma', specialization: 'Internal Medicine', hospital: 'City District Hospital', email: 'priya.sharma@hospital.com', phone: '+91 98765 43210' },
    { id: 2, name: 'Dr. Amit Kumar', specialization: 'Cardiology', hospital: 'City District Hospital', email: 'amit.kumar@hospital.com', phone: '+91 98765 43211' },
    { id: 3, name: 'Dr. Sneha Reddy', specialization: 'Neurology', hospital: 'City District Hospital', email: 'sneha.reddy@hospital.com', phone: '+91 98765 43212' },
    { id: 4, name: 'Dr. Vikram Singh', specialization: 'Orthopedics', hospital: 'City District Hospital', email: 'vikram.singh@hospital.com', phone: '+91 98765 43213' },
  ];

  const nursesList = [
    { id: 1, name: 'Nurse Rajesh Kumar', phone: '+91 98765 43221', email: 'rajesh@hospital.com' },
    { id: 2, name: 'Nurse Sunita Devi', phone: '+91 98765 43222', email: 'sunita@hospital.com' },
    { id: 3, name: 'Nurse Anil Singh', phone: '+91 98765 43223', email: 'anil@hospital.com' },
  ];

  // ============ GET GREETING ============
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // Fetch patient data
  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const response = await patientAPI.getAll();
      const patients = response.data.data || [];
      
      console.log('📋 All patients from DB:', patients);
      console.log('👤 Current logged-in user:', user);
      
      let patientData = null;
      
      if (user?.email) {
        patientData = patients.find(p => 
          p.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (patientData) {
          console.log('✅ Patient found by email:', patientData.name);
        }
      }
      
      if (!patientData && user?.name) {
        patientData = patients.find(p => 
          p.name?.toLowerCase() === user.name?.toLowerCase()
        );
        if (patientData) {
          console.log('✅ Patient found by name:', patientData.name);
        }
      }
      
      if (!patientData && user?.patientId) {
        patientData = patients.find(p => 
          p.patientId === user.patientId
        );
        if (patientData) {
          console.log('✅ Patient found by patientId:', patientData.name);
        }
      }
      
      if (!patientData) {
        console.error('❌ No matching patient found for user:', user);
        toast.error('No patient record found for this account');
        setPatient(null);
        setLoading(false);
        return;
      }
      
      setPatient(patientData);
      
      try {
        const vitalsRes = await vitalsAPI.getHistory(patientData._id, { limit: 10 });
        setVitals(vitalsRes.data.data.vitals || []);
        console.log('📊 Vitals fetched:', vitalsRes.data.data.vitals?.length || 0);
      } catch (vError) {
        console.log('No vitals found for patient');
      }
      
      try {
        const predRes = await predictionAPI.getPatientPredictions(patientData._id, { limit: 5 });
        setPredictions(predRes.data.data.predictions || []);
        console.log('🧠 Predictions fetched:', predRes.data.data.predictions?.length || 0);
      } catch (pError) {
        console.log('No predictions found for patient');
      }

      // Load appointments from localStorage
      const savedAppointments = localStorage.getItem(`appointments_${patientData._id}`);
      if (savedAppointments) {
        setAppointments(JSON.parse(savedAppointments));
      } else {
        const defaultAppointments = [
          { 
            id: Date.now(), 
            doctor: patientData.assignedDoctor?.name || 'Dr. Priya Sharma', 
            date: '15 Aug 2026', 
            time: '10:00 AM', 
            hospital: patientData.assignedDoctor?.hospital || 'City District Hospital',
            status: 'upcoming'
          }
        ];
        setAppointments(defaultAppointments);
        localStorage.setItem(`appointments_${patientData._id}`, JSON.stringify(defaultAppointments));
      }
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  // ============ ✅ FIXED: Doctor & Nurse Functions with Default Assign ============
  const getDoctorName = () => {
    if (patient?.assignedDoctor) {
      if (typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.name || 'Dr. Priya Sharma';
      }
      // If it's an ID, find from doctorsList
      const doc = doctorsList.find(d => d.id === patient.assignedDoctor || d.name === patient.assignedDoctor);
      return doc?.name || 'Dr. Priya Sharma';
    }
    // ✅ DEFAULT DOCTOR - Agar assigned nahi hai toh default doctor show karo
    return 'Dr. Priya Sharma';
  };

  const getDoctorSpecialization = () => {
    if (patient?.assignedDoctor) {
      if (typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.specialization || 'Internal Medicine';
      }
      const doc = doctorsList.find(d => d.id === patient.assignedDoctor || d.name === patient.assignedDoctor);
      return doc?.specialization || 'Internal Medicine';
    }
    return 'Internal Medicine';
  };

  const getDoctorHospital = () => {
    if (patient?.assignedDoctor) {
      if (typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.hospital || 'City District Hospital';
      }
      const doc = doctorsList.find(d => d.id === patient.assignedDoctor || d.name === patient.assignedDoctor);
      return doc?.hospital || 'City District Hospital';
    }
    return 'City District Hospital';
  };

  const getDoctorEmail = () => {
    if (patient?.assignedDoctor) {
      if (typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.email || 'priya.sharma@hospital.com';
      }
      const doc = doctorsList.find(d => d.id === patient.assignedDoctor || d.name === patient.assignedDoctor);
      return doc?.email || 'priya.sharma@hospital.com';
    }
    return 'priya.sharma@hospital.com';
  };

  const getDoctorPhone = () => {
    if (patient?.assignedDoctor) {
      if (typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.phone || '+91 98765 43210';
      }
      const doc = doctorsList.find(d => d.id === patient.assignedDoctor || d.name === patient.assignedDoctor);
      return doc?.phone || '+91 98765 43210';
    }
    return '+91 98765 43210';
  };

  const getNurseName = () => {
    if (patient?.assignedNurse) {
      if (typeof patient.assignedNurse === 'object') {
        return patient.assignedNurse.name || 'Nurse Rajesh Kumar';
      }
      return 'Nurse Rajesh Kumar';
    }
    // ✅ DEFAULT NURSE - Agar assigned nahi hai toh default nurse show karo
    return 'Nurse Rajesh Kumar';
  };

  const getNursePhone = () => {
    if (patient?.assignedNurse) {
      if (typeof patient.assignedNurse === 'object') {
        return patient.assignedNurse.phone || '+91 98765 43221';
      }
      return '+91 98765 43221';
    }
    return '+91 98765 43221';
  };

  const getNurseEmail = () => {
    if (patient?.assignedNurse) {
      if (typeof patient.assignedNurse === 'object') {
        return patient.assignedNurse.email || 'rajesh@hospital.com';
      }
      return 'rajesh@hospital.com';
    }
    return 'rajesh@hospital.com';
  };

  // ============ APPOINTMENT FUNCTIONS ============
  const handleAddAppointment = () => {
    if (!appointmentForm.doctor || !appointmentForm.date || !appointmentForm.time) {
      toast.error('Please fill all required fields');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      doctor: appointmentForm.doctor,
      date: appointmentForm.date,
      time: appointmentForm.time,
      hospital: appointmentForm.hospital || 'City District Hospital',
      status: 'upcoming'
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem(`appointments_${patient._id}`, JSON.stringify(updatedAppointments));
    
    toast.success('Appointment booked successfully!');
    setShowAppointmentModal(false);
    setAppointmentForm({ doctor: '', date: '', time: '', hospital: '' });
  };

  const handleDeleteAppointment = (id) => {
    const updatedAppointments = appointments.filter(apt => apt.id !== id);
    setAppointments(updatedAppointments);
    localStorage.setItem(`appointments_${patient._id}`, JSON.stringify(updatedAppointments));
    toast.success('Appointment cancelled');
  };

  const handleRescheduleAppointment = (id) => {
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      setSelectedAppointment(apt);
      setAppointmentForm({
        doctor: apt.doctor,
        date: apt.date,
        time: apt.time,
        hospital: apt.hospital
      });
      handleDeleteAppointment(id);
      setShowAppointmentModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/patient-login');
  };

  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    
    setChatHistory(prev => [...prev, { type: 'user', message: chatMessage }]);
    setChatMessage('');
    setIsTyping(true);
    
    setTimeout(() => {
      let response = '';
      const msg = chatMessage.toLowerCase();
      const latest = vitals[0] || {};
      
      if (msg.includes('heart') || msg.includes('hr')) {
        response = `Your heart rate is ${latest.heartRate || '72'} bpm. Normal range is 60-100 bpm. ${latest.heartRate > 100 ? '⚠️ This is slightly high. Please consult your doctor.' : '✅ This is within normal range.'}`;
      } else if (msg.includes('bp') || msg.includes('blood pressure')) {
        response = `Your blood pressure is ${latest.systolicBP || '120'}/${latest.diastolicBP || '80'} mmHg. Normal range is 90-140/60-90 mmHg. ${latest.systolicBP > 140 ? '⚠️ This is slightly high. Please consult your doctor.' : '✅ This is within normal range.'}`;
      } else if (msg.includes('temp') || msg.includes('temperature')) {
        response = `Your temperature is ${latest.temperature || '98.6'}°F. Normal range is 97.0-100.4°F. ${latest.temperature > 100.4 ? '⚠️ You have a fever. Please consult your doctor.' : '✅ This is within normal range.'}`;
      } else if (msg.includes('appointment')) {
        response = `You have ${appointments.length} upcoming appointments. Check the Appointments section for details.`;
      } else {
        const risk = patient?.currentRisk || 0;
        const statusText = risk >= 80 ? 'CRITICAL - Please consult your doctor immediately!' : 
                          risk >= 60 ? 'HIGH - Please monitor closely' : 
                          risk >= 40 ? 'MEDIUM - Regular monitoring recommended' : 
                          'LOW - Keep maintaining your health';
        response = `Based on your latest vitals, your health status is ${statusText}`;
      }
      
      setChatHistory(prev => [...prev, { type: 'ai', message: response }]);
      setIsTyping(false);
    }, 1500);
  };

  // Get latest vitals
  const latestVitals = vitals[0] || {};

  // ============ ✅ FIXED: RISK ZONE ============
  const getRiskZone = (risk) => {
    if (risk >= 80) return { text: 'CRITICAL', color: 'text-red-600', bg: 'bg-red-100 border-red-200', emoji: '🚨' };
    if (risk >= 60) return { text: 'HIGH', color: 'text-orange-600', bg: 'bg-orange-100 border-orange-200', emoji: '⚠️' };
    if (risk >= 40) return { text: 'MEDIUM', color: 'text-amber-600', bg: 'bg-amber-100 border-amber-200', emoji: '📊' };
    return { text: 'LOW', color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-200', emoji: '✅' };
  };

  // Calculate health score
  const calculateHealthScore = () => {
    let score = 92;
    if (latestVitals.heartRate > 100 || latestVitals.heartRate < 60) score -= 10;
    if (latestVitals.temperature > 100.4 || latestVitals.temperature < 97.0) score -= 10;
    if (latestVitals.systolicBP > 140 || latestVitals.systolicBP < 90) score -= 10;
    if (latestVitals.diastolicBP > 90 || latestVitals.diastolicBP < 60) score -= 10;
    if (latestVitals.spo2 < 95) score -= 10;
    if (latestVitals.respiratoryRate > 22 || latestVitals.respiratoryRate < 12) score -= 10;
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  
  const getStatus = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 60) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { text: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // ✅ FIXED: Risk zone based on actual risk score
  const riskZone = getRiskZone(patient?.currentRisk || 0);
  const status = getStatus(healthScore);
  const greeting = getGreeting();
  const patientName = patient?.name || user?.name || 'Patient';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading your health data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <User size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No patient data found</p>
          <p className="text-xs text-slate-400">Please contact your hospital for registration</p>
          <button 
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-xl hover:bg-[#2563EB]/90 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const vitalsCards = [
    { key: 'heartRate', icon: Heart, label: 'Heart Rate', value: latestVitals.heartRate || '--', unit: 'bpm', normal: '60-100', color: 'text-red-500', bg: 'bg-red-50' },
    { key: 'temperature', icon: Thermometer, label: 'Temperature', value: latestVitals.temperature || '--', unit: '°F', normal: '97.0-100.4', color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'systolicBP', icon: Droplet, label: 'Systolic BP', value: latestVitals.systolicBP || '--', unit: 'mmHg', normal: '90-140', color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'diastolicBP', icon: Droplet, label: 'Diastolic BP', value: latestVitals.diastolicBP || '--', unit: 'mmHg', normal: '60-90', color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'spo2', icon: Activity, label: 'SpO2', value: latestVitals.spo2 || '--', unit: '%', normal: '95-100', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { key: 'respiratoryRate', icon: Wind, label: 'Respiration', value: latestVitals.respiratoryRate || '--', unit: '/min', normal: '12-22', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const notifications = [
    { title: 'Appointment Reminder', message: 'Visit to doctor tomorrow at 10:00 AM', time: '2 hours ago', type: 'appointment' },
    { title: 'Health Update', message: `Your health status is ${riskZone.text}`, time: '1 day ago', type: 'health' },
  ];

  // ✅ Check if doctor/nurse is assigned or using default
  const isDoctorAssigned = patient?.assignedDoctor && typeof patient.assignedDoctor === 'object';
  const isNurseAssigned = patient?.assignedNurse && typeof patient.assignedNurse === 'object';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30">
      {/* ========== NAVBAR ========== */}
      <nav className="glass-premium border-b border-white/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="SwasthAI Sentinel" 
                className="w-9 h-9 rounded-xl shadow-lg shadow-blue-500/20 object-contain"
              />
              <span className="text-lg font-bold text-slate-800">SwasthAI <span className="text-[#2563EB]">Sentinel</span></span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-slate-100 transition relative"
              >
                <Bell size={20} className="text-slate-600" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">2</span>
              </button>
              <button 
                onClick={fetchPatientData}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
              >
                <RefreshCw size={18} className="text-slate-500" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-50 transition text-slate-400 hover:text-red-500"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== NOTIFICATIONS ========== */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 w-80 glass-premium rounded-3xl shadow-2xl border border-white/30 z-50 p-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-2">
              {notifications.map((notif, i) => (
                <div key={i} className="p-3 rounded-xl hover:bg-slate-50 transition border border-white/30">
                  <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                  <p className="text-xs text-slate-400">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{notif.time}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ===== WELCOME ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-premium rounded-3xl p-6 border border-white/30 bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
                {patientName.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  {greeting}, {patientName} 👋
                </p>
                <p className="text-sm text-slate-400">{patient.age || '--'}y · {patient.gender || '--'} · {patient.ward || '--'}</p>
                <p className="text-xs text-slate-400">MRN: {patient.mrn || patient.patientId || '--'}</p>
                <p className="text-xs text-slate-400">Email: {user?.email || '--'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* ✅ AI REPORT BUTTON */}
              <button
                onClick={() => setShowAIReport(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <FileText size={18} />
                Generate AI Report
              </button>

              {/* ✅ FIXED: RISK ZONE BADGE */}
              <div className={`px-4 py-2 rounded-xl border ${riskZone.bg}`}>
                <p className={`text-sm font-bold ${riskZone.color}`}>
                  {riskZone.emoji} Risk: {riskZone.text}
                </p>
                <p className="text-xs text-slate-500 text-center">
                  {patient.currentRisk || 0}% Score
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle 
                      cx="40" cy="40" r="32" fill="none" 
                      stroke={healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#2563EB' : '#F59E0B'}
                      strokeWidth="6" 
                      strokeDasharray={`${healthScore * 2.01} 201`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${status.color}`}>
                    {healthScore}
                  </span>
                </div>
                <p className={`text-xs font-medium ${status.color}`}>{status.text}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== VITALS ===== */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">My Health Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {vitalsCards.map((vCard) => (
              <motion.div
                key={vCard.key}
                whileHover={{ y: -4 }}
                className="glass-premium rounded-2xl p-4 text-center border border-white/30"
              >
                <div className={`w-10 h-10 rounded-xl ${vCard.bg} flex items-center justify-center mx-auto mb-2`}>
                  <vCard.icon size={20} className={vCard.color} />
                </div>
                <p className="text-xs text-slate-400">{vCard.label}</p>
                <p className="text-lg font-bold text-slate-800">{vCard.value}</p>
                <p className="text-[10px] text-slate-400">{vCard.unit}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Normal: {vCard.normal}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ===== DOCTOR & NURSE - FIXED WITH DEFAULT ASSIGN ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctor Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-premium rounded-3xl p-6 border border-white/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-[#2563EB]" /> My Doctor
              </h3>
              {!isDoctorAssigned && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  Default Assigned
                </span>
              )}
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-xl font-bold">
                {getDoctorName().charAt(0) || 'D'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{getDoctorName()}</p>
                <p className="text-xs text-slate-400">{getDoctorSpecialization()}</p>
                <p className="text-xs text-slate-400">{getDoctorHospital()}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> {getDoctorPhone()}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" /> {getDoctorEmail()}
                </p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available Today
                </p>
              </div>
            </div>
          </motion.div>

          {/* Nurse Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-premium rounded-3xl p-6 border border-white/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <UserCircle size={18} className="text-[#06B6D4]" /> My Nurse
              </h3>
              {!isNurseAssigned && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  Default Assigned
                </span>
              )}
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#2563EB] flex items-center justify-center text-white text-xl font-bold">
                {getNurseName().charAt(0) || 'N'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{getNurseName()}</p>
                <p className="text-xs text-slate-400">Morning Shift (7AM - 3PM)</p>
                <p className="text-xs text-slate-400">Ward: {patient.ward || '--'}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> {getNursePhone()}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" /> {getNurseEmail()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===== APPOINTMENTS ===== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={20} className="text-[#2563EB]" /> Upcoming Appointments
            </h2>
            <button 
              onClick={() => setShowAppointmentModal(true)}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB]/90 transition flex items-center gap-2"
            >
              + Book Appointment
            </button>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="glass-premium rounded-2xl p-8 text-center border border-white/30">
                <Calendar size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400">No appointments scheduled</p>
                <button 
                  onClick={() => setShowAppointmentModal(true)}
                  className="mt-2 text-[#2563EB] text-sm font-medium hover:underline"
                >
                  Book an appointment
                </button>
              </div>
            ) : (
              appointments.map((apt, i) => (
                <motion.div
                  key={apt.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-premium rounded-2xl p-4 border border-white/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                      <Calendar size={18} className="text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{apt.doctor}</p>
                      <p className="text-xs text-slate-400">{apt.date} · {apt.time}</p>
                      <p className="text-xs text-slate-400">{apt.hospital}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRescheduleAppointment(apt.id)}
                      className="px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-medium hover:bg-amber-500/20 transition"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium hover:bg-red-500/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ===== AI SUMMARY ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-premium rounded-3xl p-6 border border-[#2563EB]/20 bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <Brain size={24} className="text-[#2563EB]" />
            <h2 className="text-lg font-bold text-slate-800">AI Health Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-700 font-medium">Today's Health Summary</p>
              <p className="text-sm text-slate-500 mt-2">
                ✅ Heart rate: {latestVitals.heartRate || '--'} bpm (Normal: 60-100)<br />
                ✅ BP: {latestVitals.systolicBP || '--'}/{latestVitals.diastolicBP || '--'} mmHg<br />
                ✅ SpO2: {latestVitals.spo2 || '--'}% (Normal: 95-100)<br />
                ✅ Temperature: {latestVitals.temperature || '--'}°F (Normal: 97.0-100.4)<br />
                ✅ Status: {riskZone.emoji} {riskZone.text}
              </p>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 border border-white/30">
              <p className="text-xs font-medium text-slate-600">AI Recommendations</p>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Continue regular health monitoring</li>
                <li>• Stay hydrated - drink 8 glasses of water</li>
                <li>• Light exercise for 20 minutes daily</li>
                <li>• Next checkup in 2 weeks</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========== APPOINTMENT MODAL ========== */}
      <AnimatePresence>
        {showAppointmentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAppointmentModal(false)}
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
                  <h3 className="text-xl font-bold text-slate-800">Book Appointment</h3>
                  <p className="text-sm text-slate-400">Select doctor and schedule time</p>
                </div>
                <button onClick={() => setShowAppointmentModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Select Doctor *</label>
                  <select
                    value={appointmentForm.doctor}
                    onChange={(e) => setAppointmentForm({...appointmentForm, doctor: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  >
                    <option value="">Select a doctor...</option>
                    {doctorsList.map(doc => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Date *</label>
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Time *</label>
                  <input
                    type="time"
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Hospital</label>
                  <input
                    type="text"
                    value={appointmentForm.hospital}
                    onChange={(e) => setAppointmentForm({...appointmentForm, hospital: e.target.value})}
                    placeholder="City District Hospital"
                    className="w-full px-4 py-2.5 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 text-sm"
                  />
                </div>

                <button 
                  onClick={handleAddAppointment}
                  className="w-full py-3 btn-primary rounded-2xl flex items-center justify-center gap-2"
                >
                  <Calendar size={18} /> Book Appointment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== ✅ AI REPORT MODAL ========== */}
      <AIReport 
        isOpen={showAIReport}
        onClose={() => setShowAIReport(false)}
        patient={patient}
        latestVitals={latestVitals}
        vitals={vitals}
        predictions={predictions}
      />

      {/* ========== FLOATING AI CHAT BUTTON ========== */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition"
        >
          <MessageCircle size={28} />
        </button>

        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 right-0 w-[380px] max-w-[90vw] h-[500px] glass-premium rounded-3xl shadow-2xl border border-white/30 flex flex-col"
            >
              <div className="p-4 border-b border-white/30 flex items-center justify-between bg-gradient-to-r from-[#2563EB]/5 to-[#06B6D4]/5 rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#2563EB]" />
                  <span className="font-semibold text-slate-800">AI Health Assistant</span>
                </div>
                <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-slate-100 transition">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}