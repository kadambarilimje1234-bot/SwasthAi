import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Activity, UserCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      toast.success('Welcome to SwasthAI Sentinel!');
      navigate('/app/dashboard');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop&crop=center" 
          alt="Modern Hospital" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/80 via-[#2563EB]/60 to-[#06B6D4]/40"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="/logo.png" 
              alt="SwasthAI Sentinel" 
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur p-2 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold">SwasthAI Sentinel</h1>
              <p className="text-sm text-white/70">Staff Portal</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl p-6 mb-6 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl animate-heartbeat">🏥</div>
              <div>
                <p className="text-sm font-medium">Staff Dashboard</p>
                <p className="text-2xl font-bold">AI-Powered</p>
                <p className="text-sm text-white/70">Sepsis Prediction</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">91%</p>
              <p className="text-xs text-white/70">AI Accuracy</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">6h</p>
              <p className="text-xs text-white/70">Early Detection</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <Shield size={14} />
            <span>HIPAA compliant · Enterprise grade</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserCircle size={24} className="text-[#2563EB]" />
              <h2 className="text-2xl font-bold text-slate-800">Staff Login</h2>
            </div>
            <p className="text-slate-400 text-sm">For Doctors, Nurses & Hospital Admins</p>
          </div>

          <div className="flex gap-3 mb-6">
            <button className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold text-sm shadow-lg shadow-blue-500/20">Staff</button>
            <Link to="/patient-login" className="flex-1 py-2.5 rounded-xl text-slate-400 hover:text-slate-700 font-medium text-sm text-center border border-transparent hover:border-slate-200 transition">Patient</Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition" 
                  placeholder="staff@swasthai.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition" 
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30" /> Remember me
              </label>
              <a href="#" className="text-[#2563EB] font-medium hover:underline">Forgot Password?</a>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : (
                <>Login <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link to="/about" className="hover:text-[#2563EB] transition">About Us</Link>
            <span>·</span>
            <span className="text-[#2563EB] font-medium">Staff Login</span>
            <span>·</span>
            <Link to="/patient-login" className="hover:text-[#2563EB] transition">Patient Login</Link>
            <span>·</span>
            <Link to="/resources" className="hover:text-[#2563EB] transition">Resources</Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-xs text-slate-500 flex items-center gap-2">
            <Activity size={14} className="text-[#2563EB]" />
            <span>Demo: <strong>admin@swasthai.com</strong> / <strong>admin123</strong></span>
          </div>

          <div className="mt-3 text-center text-xs text-slate-400">
            Don't have an account? <Link to="/signup" className="text-[#2563EB] font-medium hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}