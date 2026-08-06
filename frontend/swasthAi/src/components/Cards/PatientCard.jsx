import { motion } from 'framer-motion';
import { User, Clock, AlertCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientCard({ patient }) {
  const isCritical = patient.status === 'CRITICAL';
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`glass rounded-3xl p-6 border ${isCritical ? 'border-red-400/50 shadow-red-500/10' : 'border-amber-400/50 shadow-amber-500/10'} card-hover relative overflow-hidden`}
    >
      {isCritical && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{patient.name}</h3>
              <p className="text-xs text-slate-400">{patient.age}y · {patient.gender} · {patient.ward}</p>
            </div>
          </div>
          <div className={`text-xs font-bold px-3 py-1 rounded-full ${isCritical ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600'}`}>
            {patient.status}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle 
                cx="32" cy="32" r="28" fill="none" 
                stroke={isCritical ? '#EF4444' : '#F59E0B'} 
                strokeWidth="4" 
                strokeDasharray={`${patient.risk * 1.76} 176`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
              {patient.risk}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">AI detected</p>
            <p className="text-sm font-medium text-slate-700">Possible deterioration in {patient.time}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={`/patient/${patient.id}`} className="flex-1 py-2 text-center text-sm font-medium bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition">
            <Eye size={16} className="inline mr-1" /> View
          </Link>
          <button className="flex-1 py-2 text-center text-sm font-medium bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition">
            <AlertCircle size={16} className="inline mr-1" /> Alert
          </button>
        </div>
      </div>
    </motion.div>
  );
}