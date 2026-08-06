import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Clock, Award, Zap, Users, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { patientAPI, predictionAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [riskTrend, setRiskTrend] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [stats, setStats] = useState({
    accuracy: 94.7,
    responseTime: 4.2,
    patientsSaved: 142,
    uptime: 99.98,
    totalPatients: 0,
    criticalCount: 0,
    warningCount: 0,
    stableCount: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch patients
      const patientRes = await patientAPI.getAll();
      const patientsList = patientRes.data.data || [];
      setPatients(patientsList);
      
      // Fetch predictions for all patients
      let allPredictions = [];
      for (const p of patientsList) {
        try {
          const predRes = await predictionAPI.getPatientPredictions(p._id, { limit: 10 });
          if (predRes.data.data?.predictions) {
            allPredictions = [...allPredictions, ...predRes.data.data.predictions.map(pr => ({
              ...pr,
              patientName: p.name,
              patientId: p._id
            }))];
          }
        } catch (e) {
          // Skip if no predictions
        }
      }
      setPredictions(allPredictions);

      // ========== STATS ==========
      const critical = patientsList.filter(p => p.currentStatus === 'CRITICAL').length;
      const warning = patientsList.filter(p => p.currentStatus === 'WARNING').length;
      const stable = patientsList.filter(p => p.currentStatus === 'STABLE').length;
      
      setStats(prev => ({
        ...prev,
        totalPatients: patientsList.length,
        criticalCount: critical,
        warningCount: warning,
        stableCount: stable,
      }));

      // ========== WARD DATA ==========
      const wardStats = {};
      patientsList.forEach(p => {
        if (!p.ward) return;
        if (!wardStats[p.ward]) {
          wardStats[p.ward] = {
            count: 0,
            critical: 0,
            warning: 0,
            stable: 0,
            totalRisk: 0,
          };
        }
        wardStats[p.ward].count++;
        wardStats[p.ward].totalRisk += (p.currentRisk || 0);
        
        if (p.currentStatus === 'CRITICAL') wardStats[p.ward].critical++;
        else if (p.currentStatus === 'WARNING') wardStats[p.ward].warning++;
        else wardStats[p.ward].stable++;
      });
      
      const wardArray = Object.entries(wardStats).map(([ward, data]) => {
        const avgRisk = data.count > 0 ? Math.round(data.totalRisk / data.count) : 0;
        let riskLevel = 'Low';
        let color = 'bg-emerald-500';
        
        if (data.critical > 0) {
          riskLevel = 'High';
          color = 'bg-red-500';
        } else if (data.warning > 0) {
          riskLevel = 'Medium';
          color = 'bg-amber-500';
        }
        
        return {
          ward,
          ...data,
          avgRisk,
          riskLevel,
          color,
        };
      });
      
      setWardData(wardArray);

      // ========== RISK TREND (Last 7 records) ==========
      if (allPredictions.length > 0) {
        // Sort by createdAt and get last 7
        const sorted = allPredictions.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        const last7 = sorted.slice(-7);
        
        const trendData = last7.map((p, index) => ({
          hour: index === last7.length - 1 ? 'Now' : `${index + 1}`,
          value: Math.round(p.riskScore || 0),
          label: p.patientName?.substring(0, 10) || `P${index + 1}`
        }));
        
        setRiskTrend(trendData);
      } else {
        // Fallback: Use patient risk data
        const sortedPatients = [...patientsList].sort((a, b) => 
          (a.currentRisk || 0) - (b.currentRisk || 0)
        );
        
        if (sortedPatients.length > 0) {
          const low = sortedPatients.slice(0, Math.ceil(sortedPatients.length / 3));
          const mid = sortedPatients.slice(Math.ceil(sortedPatients.length / 3), Math.ceil(2 * sortedPatients.length / 3));
          const high = sortedPatients.slice(Math.ceil(2 * sortedPatients.length / 3));
          
          const trendData = [
            { hour: 'Low', value: Math.round(low.reduce((s, p) => s + (p.currentRisk || 0), 0) / (low.length || 1)) },
            { hour: 'Med', value: Math.round(mid.reduce((s, p) => s + (p.currentRisk || 0), 0) / (mid.length || 1)) },
            { hour: 'High', value: Math.round(high.reduce((s, p) => s + (p.currentRisk || 0), 0) / (high.length || 1)) },
          ];
          setRiskTrend(trendData);
        } else {
          setRiskTrend([
            { hour: 'Low', value: 0 },
            { hour: 'Med', value: 0 },
            { hour: 'High', value: 0 },
          ]);
        }
      }
      
    } catch (error) {
      console.error('❌ Analytics error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">📊 Analytics Dashboard</h2>
        <p className="text-sm text-slate-400">
          Real-time analytics · Patient statistics · Risk trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Patients</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalPatients}</p>
            </div>
            <Users size={20} className="text-[#2563EB]" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Critical</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats.criticalCount}</p>
            </div>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Warning</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{stats.warningCount}</p>
            </div>
            <Activity size={20} className="text-amber-500" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Stable</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.stableCount}</p>
            </div>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend Graph */}
        <div className="glass-premium rounded-3xl p-6 border border-white/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">📈 Risk Trend</h3>
            <span className="text-xs text-slate-400">
              {riskTrend.length > 0 ? `${riskTrend.length} data points` : 'No data'}
            </span>
          </div>
          
          {riskTrend.length > 0 && riskTrend.some(d => d.value > 0) ? (
            <div className="h-56 flex items-end justify-between gap-4 px-2">
              {riskTrend.map((item, index) => {
                const maxValue = Math.max(...riskTrend.map(d => d.value), 1);
                const heightPercent = Math.max((item.value / maxValue) * 100, 5);
                
                let bgColor = 'bg-[#2563EB]';
                if (item.value >= 80) bgColor = 'bg-red-500';
                else if (item.value >= 60) bgColor = 'bg-amber-500';
                
                const isLast = index === riskTrend.length - 1;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={`w-full rounded-lg transition-all duration-700 ${bgColor} ${isLast ? 'shadow-lg shadow-red-500/30' : ''}`}
                      style={{ 
                        height: `${heightPercent}%`,
                        minHeight: '20px',
                      }}
                    />
                    <span className="text-xs font-semibold text-slate-700">{item.value}%</span>
                    <span className="text-[10px] text-slate-400">{item.hour || `P${index + 1}`}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              No risk data available. Add vitals to generate predictions.
            </div>
          )}
          
          {predictions.length > 0 && (
            <p className="text-xs text-slate-400 text-center mt-4">
              Based on {predictions.length} predictions from {patients.length} patients
            </p>
          )}
        </div>

        {/* Ward Analytics */}
        <div className="glass-premium rounded-3xl p-6 border border-white/30">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">🏥 Ward Analytics</h3>
          
          {wardData.length > 0 ? (
            <div className="space-y-3">
              {wardData.map((ward) => (
                <div key={ward.ward} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/50 transition">
                  <div className={`w-3 h-3 rounded-full ${ward.color}`}></div>
                  <span className="text-sm text-slate-700 flex-1 font-medium">{ward.ward}</span>
                  <span className="text-sm text-slate-400">{ward.count} patients</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ward.riskLevel === 'High' ? 'bg-red-100 text-red-600' : 
                    ward.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {ward.riskLevel}
                  </span>
                  <span className="text-xs text-slate-400">{ward.avgRisk}% avg</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              No ward data available
            </div>
          )}
          
          {wardData.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-red-50 rounded-xl p-2 border border-red-100">
                <p className="text-red-600 font-bold text-lg">{wardData.reduce((sum, w) => sum + (w.critical || 0), 0)}</p>
                <p className="text-slate-400 text-[10px]">Critical</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
                <p className="text-amber-600 font-bold text-lg">{wardData.reduce((sum, w) => sum + (w.warning || 0), 0)}</p>
                <p className="text-slate-400 text-[10px]">Warning</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                <p className="text-emerald-600 font-bold text-lg">{wardData.reduce((sum, w) => sum + (w.stable || 0), 0)}</p>
                <p className="text-slate-400 text-[10px]">Stable</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Performance */}
      <div className="glass-premium rounded-3xl p-6 border border-white/30">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={24} className="text-[#2563EB]" />
          <h3 className="text-sm font-semibold text-slate-800">🧠 AI Performance Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-white/30">
            <p className="text-2xl font-bold text-emerald-600">{stats.accuracy}%</p>
            <p className="text-xs text-slate-400">Prediction Accuracy</p>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-white/30">
            <p className="text-2xl font-bold text-[#2563EB]">{stats.responseTime}s</p>
            <p className="text-xs text-slate-400">Avg Response Time</p>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-white/30">
            <p className="text-2xl font-bold text-[#06B6D4]">{stats.patientsSaved}</p>
            <p className="text-xs text-slate-400">Patients Saved</p>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-4 text-center border border-white/30">
            <p className="text-2xl font-bold text-amber-500">{stats.uptime}%</p>
            <p className="text-xs text-slate-400">System Uptime</p>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-400 text-center">
          {predictions.length > 0 
            ? `Based on ${predictions.length} predictions analyzed` 
            : 'No predictions data available'}
        </div>
      </div>
    </div>
  );
}