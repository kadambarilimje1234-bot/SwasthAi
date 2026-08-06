import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, User, Eye, Calendar, MapPin, 
  Activity, AlertTriangle, CheckCircle,
  Heart, Thermometer, Droplet, Wind, RefreshCw
} from 'lucide-react';
import { patientAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWard, setFilterWard] = useState('all');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll();
      console.log('📋 Patients fetched:', response.data.data);
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = filterWard === 'all' || p.ward === filterWard;
    return matchesSearch && matchesWard;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'CRITICAL': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">CRITICAL</span>;
      case 'WARNING': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">WARNING</span>;
      default: 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">STABLE</span>;
    }
  };

  const getRiskColor = (risk) => {
    if (risk >= 80) return 'text-red-500';
    if (risk >= 60) return 'text-amber-500';
    return 'text-emerald-500';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👥 Patient List</h1>
          <p className="text-sm text-slate-400">View all patients and their health records</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-premium rounded-3xl p-4 text-center border border-white/30">
          <p className="text-2xl font-bold text-[#2563EB]">{patients.length}</p>
          <p className="text-xs text-slate-400">Total Patients</p>
        </div>
        <div className="glass-premium rounded-3xl p-4 text-center border border-white/30">
          <p className="text-2xl font-bold text-red-500">{patients.filter(p => p.currentStatus === 'CRITICAL').length}</p>
          <p className="text-xs text-slate-400">Critical</p>
        </div>
        <div className="glass-premium rounded-3xl p-4 text-center border border-white/30">
          <p className="text-2xl font-bold text-amber-500">{patients.filter(p => p.currentStatus === 'WARNING').length}</p>
          <p className="text-xs text-slate-400">Warning</p>
        </div>
        <div className="glass-premium rounded-3xl p-4 text-center border border-white/30">
          <p className="text-2xl font-bold text-emerald-500">{patients.filter(p => p.currentStatus === 'STABLE').length}</p>
          <p className="text-xs text-slate-400">Stable</p>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full glass-premium rounded-3xl p-12 text-center border border-white/30">
            <User size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No patients found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <motion.div
              key={patient._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="glass-premium rounded-3xl p-5 border border-white/30 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                    patient.currentStatus === 'CRITICAL' ? 'bg-red-500' :
                    patient.currentStatus === 'WARNING' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}>
                    {patient.name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{patient.name}</h3>
                    <p className="text-xs text-slate-400">{patient.age}y · {patient.gender}</p>
                    <p className="text-xs text-slate-400">{patient.ward}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {getStatusBadge(patient.currentStatus)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                  <p className="text-[10px] text-slate-400">HR</p>
                  <p className="text-sm font-bold text-slate-800">{patient.vitalsHistory?.[0]?.heartRate || '--'}</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                  <p className="text-[10px] text-slate-400">Temp</p>
                  <p className="text-sm font-bold text-slate-800">{patient.vitalsHistory?.[0]?.temperature || '--'}°</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-1.5 text-center">
                  <p className="text-[10px] text-slate-400">SpO2</p>
                  <p className="text-sm font-bold text-slate-800">{patient.vitalsHistory?.[0]?.spo2 || '--'}%</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Risk Score</p>
                  <p className={`text-lg font-bold ${getRiskColor(patient.currentRisk)}`}>
                    {patient.currentRisk || 0}%
                  </p>
                </div>
                <Link
                  to={`/app/patient/${patient._id}`}
                  className="px-4 py-2 bg-[#2563EB]/10 text-[#2563EB] rounded-xl text-sm hover:bg-[#2563EB]/20 transition flex items-center gap-1"
                >
                  <Eye size={14} /> View Details
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}