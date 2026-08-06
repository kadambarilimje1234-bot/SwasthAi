import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Activity, User, Heart, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PatientLogin() {
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
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        const user = result.user;
        if (user?.role === 'PATIENT') {
          toast.success('Welcome back, Patient!');
          navigate('/patient-dashboard');
        } else {
          toast.error('This account is not registered as a patient');
          setError('Please use patient account to login');
        }
      } else {
        setError('Invalid credentials. Please try again.');
        toast.error('Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop&crop=center" 
          alt="Patient Care" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#06B6D4]/80 via-[#2563EB]/60 to-[#2563EB]/40"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="/logo.png" 
              alt="SwasthAI Sentinel" 
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur p-2 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold">SwasthAI Sentinel</h1>
              <p className="text-sm text-white/70">Patient Portal</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl p-6 mb-6 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl animate-heartbeat">👤</div>
              <div>
                <p className="text-sm font-medium">Patient Dashboard</p>
                <p className="text-2xl font-bold">Your Health</p>
                <p className="text-sm text-white/70">Real-time monitoring</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-white/70">Privacy</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-white/70">Monitoring</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <Shield size={14} />
            <span>HIPAA compliant · Secure</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User size={24} className="text-[#06B6D4]" />
              <h2 className="text-2xl font-bold text-slate-800">Patient Login</h2>
            </div>
            <p className="text-slate-400 text-sm">Access your health records</p>
          </div>

          <div className="flex gap-3 mb-6">
            <Link to="/staff-login" className="flex-1 py-2.5 rounded-xl text-slate-400 hover:text-slate-700 font-medium text-sm text-center border border-transparent hover:border-slate-200 transition">Staff</Link>
            <button className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white font-semibold text-sm shadow-lg shadow-cyan-500/20">Patient</button>
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] transition" 
                  placeholder="patient@swasthai.com"
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
                  className="w-full pl-11 pr-12 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] transition" 
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
                <input type="checkbox" className="rounded border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4]/30" /> Remember me
              </label>
              <a href="#" className="text-[#06B6D4] font-medium hover:underline">Forgot Password?</a>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#06B6D4] to-[#2563EB] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link to="/about" className="hover:text-[#06B6D4] transition">About Us</Link>
            <span>·</span>
            <Link to="/staff-login" className="hover:text-[#06B6D4] transition">Staff Login</Link>
            <span>·</span>
            <span className="text-[#06B6D4] font-medium">Patient Login</span>
            <span>·</span>
            <Link to="/resources" className="hover:text-[#06B6D4] transition">Resources</Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-xs text-slate-500 flex items-center gap-2">
            <Heart size={14} className="text-[#06B6D4]" />
            <span>Demo: <strong>patient@swasthai.com</strong> / <strong>patient123</strong></span>
          </div>

          <div className="mt-3 text-center text-xs text-slate-400">
            Don't have an account? <Link to="/signup" className="text-[#06B6D4] font-medium hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}