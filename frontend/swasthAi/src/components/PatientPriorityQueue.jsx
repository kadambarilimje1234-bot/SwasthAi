import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity, 
  CheckCircle, 
  Clock, 
  User, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Heart,
  Brain,
  Stethoscope,
  Bell,
  BellOff
} from 'lucide-react';
import { patientAPI } from '../services/api';
import toast from 'react-hot-toast';

const PatientPriorityQueue = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWard, setFilterWard] = useState('all');

  useEffect(() => {
    fetchPatients();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll();
      const patientsList = response.data.data || [];
      
      // Sort by risk score (highest first)
      const sorted = patientsList.sort((a, b) => (b.currentRisk || 0) - (a.currentRisk || 0));
      setPatients(sorted);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patient queue');
      // Mock data for demo
      setPatients(getMockPatients());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo
  const getMockPatients = () => {
    return [
      { 
        _id: '1', 
        name: 'Rahul Sharma', 
        age: 58, 
        gender: 'Male', 
        ward: 'ICU A', 
        bedNumber: 'A-101',
        currentRisk: 92, 
        currentStatus: 'CRITICAL',
        diagnosis: 'Septic Shock',
        assignedDoctor: { name: 'Dr. Priya Sharma' },
        vitalsHistory: [{ heartRate: 110, temperature: 102.4, systolicBP: 90, diastolicBP: 60, spo2: 89 }]
      },
      { 
        _id: '2', 
        name: 'Priya Verma', 
        age: 72, 
        gender: 'Female', 
        ward: 'ICU A', 
        bedNumber: 'A-302',
        currentRisk: 88, 
        currentStatus: 'CRITICAL',
        diagnosis: 'Stroke with complications',
        assignedDoctor: { name: 'Dr. Amit Kumar' },
        vitalsHistory: [{ heartRate: 95, temperature: 100.8, systolicBP: 180, diastolicBP: 100, spo2: 92 }]
      },
      { 
        _id: '3', 
        name: 'Aman Singh', 
        age: 45, 
        gender: 'Male', 
        ward: 'Ward C', 
        bedNumber: 'C-312',
        currentRisk: 65, 
        currentStatus: 'WARNING',
        diagnosis: 'Fever with infection',
        assignedDoctor: { name: 'Dr. Sneha Reddy' },
        vitalsHistory: [{ heartRate: 82, temperature: 100.2, systolicBP: 125, diastolicBP: 78, spo2: 96 }]
      },
      { 
        _id: '4', 
        name: 'Neha Patel', 
        age: 34, 
        gender: 'Female', 
        ward: 'Ward A', 
        bedNumber: 'A-215',
        currentRisk: 18, 
        currentStatus: 'STABLE',
        diagnosis: 'Observation',
        assignedDoctor: { name: 'Dr. Vikram Singh' },
        vitalsHistory: [{ heartRate: 72, temperature: 98.6, systolicBP: 110, diastolicBP: 72, spo2: 98 }]
      },
      { 
        _id: '5', 
        name: 'Deepak Kumar', 
        age: 55, 
        gender: 'Male', 
        ward: 'ICU B', 
        bedNumber: 'B-108',
        currentRisk: 55, 
        currentStatus: 'WARNING',
        diagnosis: 'COPD Exacerbation',
        assignedDoctor: { name: 'Dr. Priya Sharma' },
        vitalsHistory: [{ heartRate: 85, temperature: 99.8, systolicBP: 135, diastolicBP: 82, spo2: 94 }]
      },
      { 
        _id: '6', 
        name: 'Meera Iyer', 
        age: 48, 
        gender: 'Female', 
        ward: 'Ward B', 
        bedNumber: 'B-205',
        currentRisk: 38, 
        currentStatus: 'WARNING',
        diagnosis: 'Severe Anemia',
        assignedDoctor: { name: 'Dr. Amit Kumar' },
        vitalsHistory: [{ heartRate: 90, temperature: 99.2, systolicBP: 100, diastolicBP: 65, spo2: 97 }]
      }
    ];
  };

  const getRiskLevel = (risk) => {
    if (risk >= 80) return { label: '🔥 Immediate Attention', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle, emoji: '🔥' };
    if (risk >= 60) return { label: '⚠️ Observe', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Activity, emoji: '⚠️' };
    if (risk >= 40) return { label: '📊 Monitor', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock, emoji: '📊' };
    return { label: '✅ Stable', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, emoji: '✅' };
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'WARNING': return 'bg-amber-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const getPriorityBadge = (risk) => {
    if (risk >= 80) return { text: 'CRITICAL', color: 'bg-red-500 text-white animate-pulse' };
    if (risk >= 60) return { text: 'HIGH', color: 'bg-amber-500 text-white' };
    if (risk >= 40) return { text: 'MEDIUM', color: 'bg-blue-500 text-white' };
    return { text: 'LOW', color: 'bg-emerald-500 text-white' };
  };

  const getVitalTrend = (patient) => {
    const vitals = patient.vitalsHistory || [];
    if (vitals.length < 2) return 'stable';
    const last = vitals[vitals.length - 1];
    const prev = vitals[vitals.length - 2];
    if (last.heartRate > prev.heartRate + 10) return 'up';
    if (last.heartRate < prev.heartRate - 10) return 'down';
    return 'stable';
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ward?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = filterWard === 'all' || p.ward === filterWard;
    return matchesSearch && matchesWard;
  });

  // Group patients by risk level
  const groupedPatients = {
    critical: filteredPatients.filter(p => p.currentRisk >= 80),
    warning: filteredPatients.filter(p => p.currentRisk >= 60 && p.currentRisk < 80),
    monitor: filteredPatients.filter(p => p.currentRisk >= 40 && p.currentRisk < 60),
    stable: filteredPatients.filter(p => p.currentRisk < 40),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderPatientCard = (patient, index) => {
    const riskLevel = getRiskLevel(patient.currentRisk);
    const priority = getPriorityBadge(patient.currentRisk);
    const trend = getVitalTrend(patient);
    const latestVitals = patient.vitalsHistory?.[0] || {};

    return (
      <motion.div
        key={patient._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        className={`rounded-xl border p-4 transition-all ${riskLevel.bg} cursor-pointer`}
        onClick={() => setSelectedPatient(selectedPatient === patient._id ? null : patient._id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getStatusColor(patient.currentStatus)}`}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.color}`}>
                  {priority.text}
                </span>
                <span className="text-xs text-gray-400">| {patient.ward}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{patient.age}y · {patient.gender}</span>
                <span>{patient.diagnosis}</span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  {latestVitals.heartRate || '--'} bpm
                </span>
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3 text-purple-500" />
                  {patient.currentRisk}% risk
                </span>
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${riskLevel.color}`}>
              {patient.currentRisk}%
            </span>
            <span className="text-lg">{riskLevel.emoji}</span>
          </div>
        </div>

        <AnimatePresence>
          {selectedPatient === patient._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-200/50"
            >
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-white/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Temperature</p>
                  <p className="font-semibold">{latestVitals.temperature || '--'}°F</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Blood Pressure</p>
                  <p className="font-semibold">{latestVitals.systolicBP || '--'}/{latestVitals.diastolicBP || '--'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">SpO2</p>
                  <p className="font-semibold">{latestVitals.spo2 || '--'}%</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>👨‍⚕️ Doctor: {patient.assignedDoctor?.name || 'Not Assigned'}</span>
                <span>🛏️ Bed: {patient.bedNumber || 'N/A'}</span>
              </div>
              <button className="mt-2 w-full py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" /> View Full Details
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">🟢 Patient Priority Queue</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {patients.length} patients
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* AI Summary */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-red-600 font-medium">🔥 Critical:</span>
            <span className="ml-1 font-bold">{groupedPatients.critical.length}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-amber-600 font-medium">⚠️ Warning:</span>
            <span className="ml-1 font-bold">{groupedPatients.warning.length}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-blue-600 font-medium">📊 Monitor:</span>
            <span className="ml-1 font-bold">{groupedPatients.monitor.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-emerald-600 font-medium">✅ Stable:</span>
            <span className="ml-1 font-bold">{groupedPatients.stable.length}</span>
          </div>
        </div>

        {/* AI Intelligence Note */}
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="font-medium">AI Intelligence:</span>
            <span>
              {groupedPatients.critical.length > 0 
                ? `${groupedPatients.critical.length} patient(s) need immediate attention!` 
                : 'All patients are stable'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              Updated just now
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* Search & Filter */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
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
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Patient List */}
          <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
            {/* 🔥 Immediate Attention - Critical */}
            {groupedPatients.critical.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-red-600">🔥 Immediate Attention</h3>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {groupedPatients.critical.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedPatients.critical.map((p, i) => renderPatientCard(p, i))}
                </div>
              </div>
            )}

            {/* ⚠️ Observe - Warning */}
            {groupedPatients.warning.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-amber-600">⚠️ Observe</h3>
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                    {groupedPatients.warning.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedPatients.warning.map((p, i) => renderPatientCard(p, i))}
                </div>
              </div>
            )}

            {/* 📊 Monitor - Medium Risk */}
            {groupedPatients.monitor.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-blue-600">📊 Monitor</h3>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    {groupedPatients.monitor.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedPatients.monitor.map((p, i) => renderPatientCard(p, i))}
                </div>
              </div>
            )}

            {/* ✅ Stable */}
            {groupedPatients.stable.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-bold text-emerald-600">✅ Stable</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                    {groupedPatients.stable.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedPatients.stable.map((p, i) => renderPatientCard(p, i))}
                </div>
              </div>
            )}

            {filteredPatients.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>No patients found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientPriorityQueue;