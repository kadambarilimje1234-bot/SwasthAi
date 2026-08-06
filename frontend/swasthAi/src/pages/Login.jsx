import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield, Activity, Heart, Chrome, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@swasthai.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Welcome back, Dr. Sharma!');
    setTimeout(() => navigate('/app/dashboard'), 800);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#2563EB] to-[#06B6D4] p-12 items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold">SwasthAI Sentinel</h1>
              <p className="text-sm text-white/70">AI Early Sepsis Prediction</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border-white/20 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl animate-heartbeat">❤️</div>
              <div>
                <p className="text-sm font-medium">Predicting sepsis</p>
                <p className="text-2xl font-bold">6-12 hours early</p>
                <p className="text-sm text-white/70">with 96% confidence</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">126</p>
              <p className="text-xs text-white/70">Patients monitored</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold">91%</p>
              <p className="text-xs text-white/70">Accuracy</p>
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
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your clinical dashboard</p>
          </div>

          <div className="flex gap-3 mb-6">
            <button className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm">Sign In</button>
            <Link to="/signup" className="flex-1 py-2.5 rounded-xl text-slate-400 hover:text-slate-700 font-medium text-sm text-center border border-transparent hover:border-slate-200 transition">
              Sign Up
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition" 
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input type="checkbox" className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30" /> Remember me
              </label>
              <a href="#" className="text-[#2563EB] font-medium hover:underline">Forgot password?</a>
            </div>
            <button type="submit" className="w-full py-3.5 btn-primary rounded-2xl flex items-center justify-center gap-2">
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-slate-400">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition text-sm font-medium text-slate-600 flex items-center justify-center gap-2 hover:shadow-md">
              <Chrome size={18} className="text-[#2563EB]" /> Google
            </button>
            <button className="py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition text-sm font-medium text-slate-600 flex items-center justify-center gap-2 hover:shadow-md">
              <Monitor size={18} className="text-[#2563EB]" /> Microsoft
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our <a href="#" className="text-[#2563EB]">Terms</a> & <a href="#" className="text-[#2563EB]">Privacy Policy</a>
          </p>

          <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-xs text-slate-500 flex items-center gap-2">
            <Activity size={14} className="text-[#2563EB]" />
            <span>Demo: <strong>demo@swasthai.com</strong> / <strong>password123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}