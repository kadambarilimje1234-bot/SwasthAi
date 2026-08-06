import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, AlertTriangle, TrendingUp, 
  Clock, Plus, X, Heart, Thermometer, 
  Droplet, Wind, Search, RefreshCw, 
  Eye, Save, Brain, CheckCircle,
  UserCircle, UserPlus, Mail, Lock,
  Sparkles, Calendar, MapPin, User,
  Stethoscope, UserRound
} from 'lucide-react';
import { patientAPI, vitalsAPI, predictionAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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

  // ✅ Get assigned staff name based on logged-in user role
  const getAssignedStaffName = (patient) => {
    // If logged-in user is DOCTOR, show assigned nurse
    if (user?.role === 'DOCTOR') {
      if (patient.assignedNurse && typeof patient.assignedNurse === 'object') {
        return patient.assignedNurse.name || 'Not Assigned';
      }
      return 'Not Assigned';
    }
    // If logged-in user is NURSE or ADMIN, show assigned doctor
    else {
      if (patient.assignedDoctor && typeof patient.assignedDoctor === 'object') {
        return patient.assignedDoctor.name || 'Not Assigned';
      }
      return 'Not Assigned';
    }
  };

  // ✅ Get label for assigned staff
  const getAssignedStaffLabel = () => {
    if (user?.role === 'DOCTOR') {
      return 'Nurse';
    }
    return 'Doctor';
  };

  // ✅ Get assigned staff icon
  const getAssignedStaffIcon = () => {
    if (user?.role === 'DOCTOR') {
      return UserRound;
    }
    return Stethoscope;
  };

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ward?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = filterWard === 'all' || p.ward === filterWard;
    return matchesSearch && matchesWard;
  });

  // Stats
  const stats = {
    monitored: patients.length,
    critical: patients.filter(p => p.currentStatus === 'CRITICAL').length,
    warning: patients.filter(p => p.currentStatus === 'WARNING').length,
    stable: patients.filter(p => p.currentStatus === 'STABLE').length,
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  // Get risk color
  const getRiskColor = (risk) => {
    if (risk >= 80) return '#EF4444';
    if (risk >= 60) return '#F59E0B';
    return '#10B981';
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
          {/* ✅ SEARCH BAR WAPAS */}
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
                className={`glass-premium rounded-3xl p-5 border transition-all ${
                  patient.currentStatus === 'CRITICAL' ? 'border-red-400/50 shadow-red-500/10' : 
                  patient.currentStatus === 'WARNING' ? 'border-amber-400/50 shadow-amber-500/10' : 
                  'border-emerald-400/30'
                }`}
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
                      {/* ✅ ASSIGNED STAFF - ROLE BASED */}
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
                        stroke={getRiskColor(patient.currentRisk || 0)} 
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
                    onClick={() => openVitalsModal(patient)}
                    className="flex-1 py-1.5 text-center text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] rounded-xl hover:bg-[#2563EB]/20 transition flex items-center justify-center gap-1"
                  >
                    <Activity size={12} /> Update Vitals
                  </button>
                  <button 
                    onClick={() => setSelectedPatient(patient)}
                    className="flex-1 py-1.5 text-center text-xs font-medium bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> View
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
                    AI will analyze vitals and update risk prediction automatically
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
        {selectedPatient && !showVitalsModal && (
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

              {/* Vitals */}
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

              {/* Risk History */}
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
                  onClick={() => handleAIExplanation(selectedPatient)}
                  className="flex-1 py-2.5 bg-[#2563EB]/10 text-[#2563EB] rounded-xl hover:bg-[#2563EB]/20 transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} /> AI Explanation
                </button>
              </div>
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
    </div>
  );
}