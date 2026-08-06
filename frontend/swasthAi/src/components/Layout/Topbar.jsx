import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserCircle, X, Activity, Calendar, Pill, FileText, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function TopBar() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New Lab Report', message: 'CBC report for Rahul Sharma is ready', time: '5 min ago', type: 'lab', icon: FileText },
    { id: 2, title: 'Appointment Reminder', message: 'Dr. Priya Sharma tomorrow at 10:00 AM', time: '1 hour ago', type: 'appointment', icon: Calendar },
    { id: 3, title: 'Medication Alert', message: 'Amoxicillin 500mg dose due for Rahul Sharma', time: '2 hours ago', type: 'medication', icon: Pill },
    { id: 4, title: 'AI Alert', message: 'Patient Amit Singh showing warning signs', time: '3 hours ago', type: 'alert', icon: Activity },
    { id: 5, title: 'New Message', message: 'Dr. Sharma sent you a message', time: '5 hours ago', type: 'message', icon: MessageCircle },
  ];

  const unreadCount = notifications.length;

  const getNotificationColor = (type) => {
    switch(type) {
      case 'alert': return 'border-red-500/30 bg-red-50/50';
      case 'lab': return 'border-blue-500/30 bg-blue-50/50';
      case 'appointment': return 'border-emerald-500/30 bg-emerald-50/50';
      case 'medication': return 'border-amber-500/30 bg-amber-50/50';
      default: return 'border-slate-200/30 bg-slate-50/50';
    }
  };

  return (
    <header className="glass-premium mx-4 mt-4 rounded-3xl px-6 py-3 flex items-center justify-between relative z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 text-emerald-600 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">AI Monitoring Active</span>
          <span className="text-slate-400">· 126 patients</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* ========== NOTIFICATION ========== */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-2xl bg-white/40 backdrop-blur-sm flex items-center justify-center relative border border-white/40 hover:bg-white/60 transition"
          >
            <Bell size={18} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* ✅ NOTIFICATION DROPDOWN - HIGH Z-INDEX */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-80 max-h-[420px] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 z-[9999] p-3"
                style={{ transformOrigin: 'top right' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Bell size={14} className="text-[#2563EB]" />
                    Notifications
                  </h4>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-3 rounded-xl border ${getNotificationColor(notif.type)} hover:shadow-md transition cursor-pointer`}
                        onClick={() => {
                          setShowNotifications(false);
                          toast.info(`Opening: ${notif.title}`);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0">
                            <notif.icon size={14} className="text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <button 
                    onClick={() => {
                      setShowNotifications(false);
                      toast.success('All notifications marked as read');
                    }}
                    className="w-full mt-2 py-1.5 text-xs text-[#2563EB] font-medium hover:bg-blue-50/50 rounded-lg transition border-t border-white/20 pt-2"
                  >
                    Mark all as read
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========== USER PROFILE ========== */}
        <button className="flex items-center gap-2 glass-premium rounded-2xl px-3 py-1.5 border border-white/40 hover:bg-white/60 transition">
          <UserCircle size={20} className="text-primary" />
          <span className="text-sm font-medium text-slate-700">
            {user?.name || 'Loading...'}
          </span>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {user?.role || 'User'}
          </span>
        </button>
      </div>
    </header>
  );
}