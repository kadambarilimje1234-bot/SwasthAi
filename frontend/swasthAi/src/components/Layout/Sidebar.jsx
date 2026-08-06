import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Bot, 
  AlertTriangle, 
  FileUp, 
  BarChart3,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/app/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/app/patients', icon: User, label: 'Patient View' },
  { path: '/app/assistant', icon: Bot, label: 'AI Assistant' },
  { path: '/app/emergency', icon: AlertTriangle, label: 'Emergency' },
  { path: '/app/lab', icon: FileUp, label: 'Lab Reports' },
  { path: '/app/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-20 glass border-r border-white/30 flex flex-col items-center py-6 gap-2">
      {/* ✅ LOGO PNG */}
      <img 
        src="/logo.png" 
        alt="SwasthAI Sentinel" 
        className="w-12 h-12 rounded-2xl shadow-lg shadow-blue-500/20 mb-4 object-contain"
      />
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-white/60 shadow-md text-primary' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-white/40'
              }`
            }
          >
            <Icon size={22} />
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
      <button 
        onClick={logout}
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition"
      >
        <LogOut size={22} />
      </button>
    </aside>
  );
}