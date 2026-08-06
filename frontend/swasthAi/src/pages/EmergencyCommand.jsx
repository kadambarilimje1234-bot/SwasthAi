import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, MapPin, Clock, Users, Radio, Bell, 
  Activity, Zap, Heart, Thermometer, Droplet, Wind
} from 'lucide-react';
import { patientAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function EmergencyCommand() {
  const [criticalPatients, setCriticalPatients] = useState([]);
  const [warningPatients, setWarningPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencyPatients();
  }, []);

  const fetchEmergencyPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll();
      const allPatients = response.data.data || [];
      
      setCriticalPatients(allPatients.filter(p => p.currentStatus === 'CRITICAL'));
      setWarningPatients(allPatients.filter(p => p.currentStatus === 'WARNING'));
    } catch (error) {
      console.error('Error fetching emergency patients:', error);
      toast.error('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading emergency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap size={24} className="text-red-500" /> Emergency Command Center
          </h2>
          <p className="text-sm text-slate-400">Real-time critical patient monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-red-500/10 px-4 py-2 rounded-2xl border border-red-500/20">
          <Radio size={14} className="text-red-500 animate-pulse" />
          <span className="text-red-600 font-medium">LIVE · {criticalPatients.length} Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Queue */}
        <div className="lg:col-span-1 glass-premium rounded-3xl p-4 border border-red-500/20 max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Bell size={14} className="text-red-500" /> Critical Queue
          </h3>
          {criticalPatients.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No critical patients</p>
          ) : (
            <div className="space-y-2">
              {criticalPatients.map((patient) => (
                <motion.div 
                  key={patient._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl border border-red-400/50 bg-red-50/30 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{patient.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} /> {patient.ward}</p>
                      <p className="text-xs text-slate-400">{patient.age}y · {patient.gender}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500">{patient.currentRisk}%</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Heart size={10} /> {patient.vitalsHistory?.[0]?.heartRate || '--'} bpm
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-2 glass-premium rounded-3xl p-6 border border-white/30">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Hospital Risk Heatmap</h3>
          <div className="grid grid-cols-3 gap-4">
            {['ICU A', 'ICU B', 'Ward A', 'Ward B', 'Ward C', 'Emergency'].map((ward) => {
              const critical = criticalPatients.filter(p => p.ward === ward).length;
              const warning = warningPatients.filter(p => p.ward === ward).length;
              const total = critical + warning;
              const status = critical > 0 ? 'CRITICAL' : warning > 0 ? 'WARNING' : 'STABLE';
              const color = critical > 0 ? 'bg-red-500' : warning > 0 ? 'bg-amber-500' : 'bg-emerald-500';
              
              return (
                <div key={ward} className={`${color}/10 rounded-2xl p-4 text-center border ${color}/30`}>
                  <div className={`w-4 h-4 rounded-full ${color} mx-auto mb-2 ${critical > 0 ? 'animate-pulse' : ''}`}></div>
                  <p className="text-sm font-medium text-slate-800">{ward}</p>
                  <p className={`text-sm font-bold ${critical > 0 ? 'text-red-500' : warning > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {status}
                  </p>
                  <p className="text-xs text-slate-400">{total} patients</p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-slate-50/50 rounded-xl flex items-center justify-between text-xs text-slate-400 border border-white/30">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical: {criticalPatients.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning: {warningPatients.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Total: {criticalPatients.length + warningPatients.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}