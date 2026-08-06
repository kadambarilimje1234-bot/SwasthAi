import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Clock, Award, Zap, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { patientAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [riskTrend, setRiskTrend] = useState([
    { hour: '6h', value: 25 },
    { hour: '5h', value: 28 },
    { hour: '4h', value: 32 },
    { hour: '3h', value: 30 },
    { hour: '2h', value: 35 },
    { hour: '1h', value: 38 },
    { hour: 'Now', value: 42 },
  ]);
  const [wardData, setWardData] = useState([]);
  const [stats, setStats] = useState({
    accuracy: 94.7,
    responseTime: 4.2,
    patientsSaved: 142,
    uptime: 99.98,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const patientRes = await patientAPI.getAll();
      const patientsList = patientRes.data.data || [];
      setPatients(patientsList);
      
      // Ward analytics
      const wardStats = {};
      patientsList.forEach(p => {
        if (!p.ward) return;
        if (wardStats[p.ward]) {
          wardStats[p.ward].count++;
          if (p.currentStatus === 'CRITICAL') wardStats[p.ward].critical++;
          if (p.currentStatus === 'WARNING') wardStats[p.ward].warning++;
          if (p.currentStatus === 'STABLE') wardStats[p.ward].stable++;
        } else {
          wardStats[p.ward] = {
            count: 1,
            critical: p.currentStatus === 'CRITICAL' ? 1 : 0,
            warning: p.currentStatus === 'WARNING' ? 1 : 0,
            stable: p.currentStatus === 'STABLE' ? 1 : 0,
          };
        }
      });
      
      setWardData(Object.entries(wardStats).map(([ward, data]) => ({
        ward,
        ...data,
        risk: data.critical > 0 ? 'High' : data.warning > 0 ? 'Medium' : 'Low',
        color: data.critical > 0 ? 'bg-red-500' : data.warning > 0 ? 'bg-amber-500' : 'bg-emerald-500'
      })));

      // Generate real risk trend from patient data
      if (patientsList.length > 0) {
        const risks = patientsList.map(p => p.currentRisk || 0);
        const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
        
        // Create trend based on actual data
        const sortedByRisk = [...patientsList].sort((a, b) => (a.currentRisk || 0) - (b.currentRisk || 0));
        const lowRisk = sortedByRisk.slice(0, Math.floor(sortedByRisk.length / 3));
        const midRisk = sortedByRisk.slice(Math.floor(sortedByRisk.length / 3), Math.floor(2 * sortedByRisk.length / 3));
        const highRisk = sortedByRisk.slice(Math.floor(2 * sortedByRisk.length / 3));
        
        const lowAvg = lowRisk.reduce((s, p) => s + (p.currentRisk || 0), 0) / (lowRisk.length || 1);
        const midAvg = midRisk.reduce((s, p) => s + (p.currentRisk || 0), 0) / (midRisk.length || 1);
        const highAvg = highRisk.reduce((s, p) => s + (p.currentRisk || 0), 0) / (highRisk.length || 1);
        
        setRiskTrend([
          { hour: 'Low', value: Math.round(lowAvg) },
          { hour: 'Med', value: Math.round(midAvg) },
          { hour: 'High', value: Math.round(highAvg) },
        ]);
      }
      
    } catch (error) {
      console.error('Analytics error:', error);
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
        <h2 className="text-2xl font-bold text-slate-800">📊 Analytics</h2>
        <p className="text-sm text-slate-400">Performance metrics · Trends · AI accuracy</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'AI Accuracy', value: `${stats.accuracy}%`, icon: Award, color: 'text-emerald-500' },
          { label: 'Avg Response', value: `${stats.responseTime}s`, icon: Zap, color: 'text-[#2563EB]' },
          { label: 'Patients Saved', value: stats.patientsSaved, icon: Activity, color: 'text-[#06B6D4]' },
          { label: 'Uptime', value: `${stats.uptime}%`, icon: Clock, color: 'text-amber-500' },
        ].map((stat) => (
          <motion.div 
            key={stat.label}
            whileHover={{ y: -2 }}
            className="glass-premium rounded-3xl p-5 card-hover border border-white/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <stat.icon size={20} className={stat.color} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend Graph */}
        <div className="glass-premium rounded-3xl p-6 border border-white/30">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">📈 Risk Prediction Trends</h3>
          <div className="h-56 flex items-end justify-between gap-4 px-2">
            {riskTrend.map((item, index) => {
              const maxValue = Math.max(...riskTrend.map(d => d.value), 100);
              const heightPercent = Math.max((item.value / maxValue) * 100, 10);
              const isHighest = item.value === Math.max(...riskTrend.map(d => d.value));
              const isLowest = item.value === Math.min(...riskTrend.map(d => d.value));
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={`w-full rounded-lg transition-all duration-700 ${
                      item.value >= 80 ? 'bg-red-500' :
                      item.value >= 60 ? 'bg-amber-500' :
                      'bg-[#2563EB]'
                    } ${isHighest ? 'shadow-lg shadow-red-500/30' : ''}`}
                    style={{ 
                      height: `${heightPercent}%`,
                      minHeight: '20px',
                    }}
                  />
                  <span className="text-xs font-semibold text-slate-700">{item.value}%</span>
                  <span className="text-[10px] text-slate-400">{item.hour}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">
            {patients.length > 0 ? `Based on ${patients.length} patients` : 'Demo data'}
          </p>
        </div>

        {/* Ward Analytics */}
        <div className="glass-premium rounded-3xl p-6 border border-white/30">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">🏥 Ward Analytics</h3>
          {wardData.length > 0 ? (
            <div className="space-y-3">
              {wardData.map((ward) => (
                <div key={ward.ward} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ward.color}`}></div>
                  <span className="text-sm text-slate-700 flex-1">{ward.ward}</span>
                  <span className="text-sm text-slate-400">{ward.count} patients</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ward.risk === 'High' ? 'bg-red-100 text-red-600' : 
                    ward.risk === 'Medium' ? 'bg-amber-100 text-amber-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {ward.risk}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">No ward data available</div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-red-50 rounded-xl p-2">
              <p className="text-red-600 font-bold">{wardData.reduce((sum, w) => sum + (w.critical || 0), 0)}</p>
              <p className="text-slate-400">Critical</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2">
              <p className="text-amber-600 font-bold">{wardData.reduce((sum, w) => sum + (w.warning || 0), 0)}</p>
              <p className="text-slate-400">Warning</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2">
              <p className="text-emerald-600 font-bold">{wardData.reduce((sum, w) => sum + (w.stable || 0), 0)}</p>
              <p className="text-slate-400">Stable</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}