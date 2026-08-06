import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Menu, X, Play, ArrowRight, 
  Shield, Zap, Clock, Brain, 
  Users, Heart, Activity, 
  BarChart3, Bot, FileUp, 
  Bell, CheckCircle, Award,
  ChevronDown, ChevronUp,
  Mail, Phone, MapPin,
  Twitter, Linkedin, Github, Youtube,
  TrendingUp, FileText, BookOpen, Eye, Download
} from 'lucide-react';

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [counts, setCounts] = useState({ patients: 0, accuracy: 0, hours: 0, predictions: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts(prev => ({
        patients: Math.min(prev.patients + 2, 126),
        accuracy: Math.min(prev.accuracy + 1, 91),
        hours: Math.min(prev.hours + 0.1, 6),
        predictions: Math.min(prev.predictions + 4, 500),
      }));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const faqs = [
    { q: 'How does SwasthAI predict sepsis?', a: 'SwasthAI uses deep learning on EHR data, vitals, and lab results to detect sepsis patterns 6-12 hours before clinical deterioration.' },
    { q: 'Is it HIPAA compliant?', a: 'Yes, SwasthAI is fully HIPAA compliant with enterprise-grade security.' },
    { q: 'Can it work offline?', a: 'Yes, SwasthAI has offline mode with edge AI processing.' },
    { q: 'What data does it need?', a: 'Basic vitals (HR, BP, Temp, SpO2), lab results, and patient demographics.' },
    { q: 'How accurate is the prediction?', a: 'SwasthAI achieves 91% accuracy with 96% confidence.' },
  ];

  const team = [
    { name: 'Kadambari Limje', role: 'CEO & Co-founder', specialty: 'Critical Care Medicine', avatar: '👩‍⚕️' },
    { name: 'Atharva Kashikar', role: 'CTO & Co-founder', specialty: 'AI & ML Research', avatar: '👨‍💻' },
    { name: 'Anjali Mane', role: 'Head of Animation & Design', specialty: 'UI/UX & Motion Graphics', avatar: '🎨' },
    { name: 'Gunjan Kokase', role: 'Head of Research', specialty: 'Clinical Research & Analytics', avatar: '🔬' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="SwasthAI Sentinel" 
                className="h-12 w-auto rounded-xl shadow-lg shadow-blue-500/20 object-contain"
              />
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-slate-600 hover:text-[#2563EB] transition font-medium">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-[#2563EB] transition font-medium">How It Works</a>
              <a href="#about" className="text-slate-600 hover:text-[#2563EB] transition font-medium">About</a>
              <a href="#documentation" className="text-slate-600 hover:text-[#2563EB] transition font-medium">Documentation</a>
              <a href="#team" className="text-slate-600 hover:text-[#2563EB] transition font-medium">Team</a>
              <a href="#contact" className="text-slate-600 hover:text-[#2563EB] transition font-medium">Contact</a>
              <div className="flex items-center gap-3">
                <Link to="/staff-login" className="text-slate-700 font-semibold hover:text-[#2563EB] transition">Staff Login</Link>
                <span className="text-slate-300">|</span>
                <Link to="/patient-login" className="text-slate-700 font-semibold hover:text-[#2563EB] transition">Patient Login</Link>
              </div>
              <Link to="/signup" className="px-5 py-2 btn-primary rounded-xl text-sm">Get Started</Link>
            </div>
            
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2">
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden glass-premium px-4 py-4 space-y-3 border-t border-white/20">
            <a href="#features" className="block text-slate-600 font-medium">Features</a>
            <a href="#how-it-works" className="block text-slate-600 font-medium">How It Works</a>
            <a href="#about" className="block text-slate-600 font-medium">About</a>
            <a href="#documentation" className="block text-slate-600 font-medium">Documentation</a>
            <a href="#team" className="block text-slate-600 font-medium">Team</a>
            <Link to="/staff-login" className="block text-slate-700 font-semibold">Staff Login</Link>
            <Link to="/patient-login" className="block text-slate-700 font-semibold">Patient Login</Link>
            <Link to="/signup" className="block px-4 py-2 btn-primary rounded-xl text-center">Get Started</Link>
          </div>
        )}
      </nav>

      {/* ========== HERO ========== */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-cyan-50/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold mb-6">
                <Shield size={14} /> <span>FDA Cleared · HIPAA Compliant</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-slate-800">
                Predict Sepsis <br />
                <span className="gradient-text">Before It's Too Late.</span>
              </h1>
              <p className="text-lg text-slate-500 mt-4 max-w-lg leading-relaxed">
                AI-powered explainable clinical decision support system that predicts sepsis 
                6–12 hours before deterioration using sparse non-ICU patient data.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/signup" className="px-7 py-3.5 btn-primary rounded-2xl flex items-center gap-2 text-sm">
                  Explore Platform <ArrowRight size={18} />
                </Link>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="px-7 py-3.5 btn-secondary rounded-2xl flex items-center gap-2 text-slate-700 text-sm"
                >
                  <Play size={18} className="text-[#2563EB]" /> Watch Demo
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> No ICU required</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> Sparse data ready</span>
                <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-500" /> 91% accuracy</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/15 to-cyan-400/15 rounded-3xl blur-3xl animate-glow"></div>
              <div className="relative glass-premium rounded-3xl p-6 border border-white/30">
                <div className="bg-slate-50/80 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#2563EB]">🧠 AI COMMAND CENTER</span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 rounded-xl p-3 text-center border border-white/30">
                      <Brain size={22} className="text-[#2563EB] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Explainable AI</p>
                      <p className="text-[10px] text-slate-400">SHAP visualized</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-center border border-white/30">
                      <Zap size={22} className="text-[#2563EB] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">6-12 Hours</p>
                      <p className="text-[10px] text-slate-400">Early detection</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-center border border-white/30">
                      <Activity size={22} className="text-[#2563EB] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Live Monitoring</p>
                      <p className="text-[10px] text-slate-400">Real-time vitals</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-center border border-white/30">
                      <Bell size={22} className="text-[#2563EB] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Smart Alerts</p>
                      <p className="text-[10px] text-slate-400">Intelligent notifications</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white/70 rounded-xl p-2 text-center border border-white/30">
                      <p className="text-sm font-bold text-slate-800">126</p>
                      <p className="text-[10px] text-slate-400">Patients</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-2 text-center border border-white/30">
                      <p className="text-sm font-bold text-emerald-600">91%</p>
                      <p className="text-[10px] text-slate-400">Accuracy</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-2 text-center border border-white/30">
                      <p className="text-sm font-bold text-[#2563EB]">6h</p>
                      <p className="text-[10px] text-slate-400">Early</p>
                    </div>
                  </div>
                  <div className="h-10 flex items-center mt-3">
                    <svg viewBox="0 0 300 30" className="w-full animate-heartbeat">
                      <polyline points="0,15 20,15 30,6 40,24 55,9 70,21 85,8 100,20 115,11 130,23 145,13 160,21 175,9 190,18 205,12 220,24 235,14 250,20 265,10 280,15 300,15" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== VIDEO MODAL ========== */}
      <AnimatePresence>
        {showVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition flex items-center justify-center z-10"
              >
                <X size={24} />
              </button>
              {/* ✅ VIDEO - public/demo-vedio.mp4 */}
              <video 
                src="/demo-vedio.mp4" 
                controls 
                autoPlay 
                className="w-full"
                poster="/video-poster.jpg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== TRUSTED BY ========== */}
      <section className="py-12 border-t border-slate-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by leading healthcare institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <span className="text-xl font-bold text-slate-300">🏥 AIIMS</span>
            <span className="text-xl font-bold text-slate-300">🏥 Apollo</span>
            <span className="text-xl font-bold text-slate-300">🧬 ICMR</span>
            <span className="text-xl font-bold text-slate-300">🏥 Mayo Clinic</span>
            <span className="text-xl font-bold text-slate-300">🧠 WHO</span>
            <span className="text-xl font-bold text-slate-300">🏥 Stanford</span>
          </div>
        </div>
      </section>

      {/* ========== PLATFORM PREVIEW ========== */}
      <section className="py-16 md:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">Platform Preview</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">See <span className="gradient-text">SwasthAI</span> in action</h2>
            <p className="text-slate-500 mt-3">Explore our AI-powered dashboard and clinical tools</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="glass-premium rounded-3xl overflow-hidden card-hover group border border-white/30">
              <div className="relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1666214280429-d3985e2ef0b4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZG9jdG9ycyUyMHRhbGtpbmd8ZW58MHx8MHx8fDA%3D" 
                  alt="Command Center" 
                  className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 bg-[#2563EB]/90 backdrop-blur text-white text-[10px] font-semibold px-3 py-1 rounded-full">AI Powered</div>
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-slate-800">Command Center</h4>
                <p className="text-sm text-slate-500">Real-time patient monitoring with AI-powered risk prediction</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">👥 126 patients</span>
                  <span className="flex items-center gap-1">⚡ Live</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-premium rounded-3xl overflow-hidden card-hover group border border-white/30">
              <div className="relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1706777280252-5de52771cf13?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHBhdGllbnQlMjBjYXJlfGVufDB8fDB8fHww" 
                  alt="Patient Details" 
                  className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-semibold px-3 py-1 rounded-full">Explainable AI</div>
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-slate-800">Patient Details</h4>
                <p className="text-sm text-slate-500">Comprehensive patient view with SHAP risk explanations</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">📋 Vitals</span>
                  <span className="flex items-center gap-1">🧠 SHAP</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-premium rounded-3xl overflow-hidden card-hover group border border-white/30">
              <div className="relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1748609160056-7b95f30041f0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBhdGllbnQlMjBhbmFseXRpY3N8ZW58MHx8MHx8fDA%3D" 
                  alt="Analytics" 
                  className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 bg-[#06B6D4]/90 backdrop-blur text-white text-[10px] font-semibold px-3 py-1 rounded-full">Analytics</div>
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-slate-800">Analytics</h4>
                <p className="text-sm text-slate-500">Hospital performance metrics and AI accuracy trends</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">📊 Trends</span>
                  <span className="flex items-center gap-1">🎯 91% Accuracy</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== ABOUT ========== */}
      <section id="about" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}>
              <span className="text-[#2563EB] text-sm font-semibold">About Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">
                A compassionate effort to aid people out of <span className="gradient-text">difficult times</span>
              </h2>
              <p className="text-slate-500 mt-4 leading-relaxed">
                We are resolutely committed to provide our users with hospitals and their services 
                at their fingertips. SwasthAI Sentinel brings AI-powered early sepsis prediction to 
                district hospitals across India.
              </p>
              <Link to="/staff-login" className="inline-flex items-center gap-2 mt-6 px-6 py-3 btn-primary rounded-2xl">
                Explore <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} className="glass-premium rounded-3xl p-6 card-hover border border-white/30">
              <img 
                src="https://media.istockphoto.com/id/1142386206/photo/medicine-and-innovation-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=XSC_5NEC1WcZ3hzSLgMzthKfJsQfJpHActNMoR_Vchs=" 
                alt="Healthcare team" 
                className="rounded-2xl w-full h-64 object-cover"
              />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/60 rounded-xl p-2">
                  <p className="text-lg font-bold text-[#2563EB]">50+</p>
                  <p className="text-xs text-slate-400">Hospitals</p>
                </div>
                <div className="bg-white/60 rounded-xl p-2">
                  <p className="text-lg font-bold text-[#2563EB]">126</p>
                  <p className="text-xs text-slate-400">Patients</p>
                </div>
                <div className="bg-white/60 rounded-xl p-2">
                  <p className="text-lg font-bold text-[#2563EB]">91%</p>
                  <p className="text-xs text-slate-400">Accuracy</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-16 md:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">Everything you need to <span className="gradient-text">save lives</span></h2>
            <p className="text-slate-500 mt-3">AI-powered tools designed for district hospitals with limited resources</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Brain, label: 'Explainable AI', desc: 'SHAP visualizations for every prediction' },
              { icon: Zap, label: 'Early Prediction', desc: '6-12 hours before deterioration' },
              { icon: Activity, label: 'Live Monitoring', desc: 'Real-time vitals tracking' },
              { icon: Bell, label: 'Smart Alerts', desc: 'Intelligent notification system' },
              { icon: Bot, label: 'AI Assistant', desc: 'ChatGPT-like clinical support' },
              { icon: Clock, label: 'Clinical Timeline', desc: 'Patient deterioration history' },
              { icon: FileUp, label: 'Lab OCR', desc: 'AI-powered report extraction' },
              { icon: BarChart3, label: 'Analytics', desc: 'Hospital performance metrics' },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-premium rounded-2xl p-5 card-hover border border-white/30">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mb-3">
                  <feature.icon size={20} className="text-[#2563EB]" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{feature.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">From patient to <span className="gradient-text">prediction</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Patient', desc: 'Admission & monitoring' },
              { icon: Heart, label: 'Nurse', desc: 'Records vitals' },
              { icon: Brain, label: 'AI', desc: 'Processing & analysis' },
              { icon: TrendingUp, label: 'Prediction', desc: 'Risk assessment' },
              { icon: Bell, label: 'Doctor', desc: 'Alert & intervention' },
              { icon: CheckCircle, label: 'Treatment', desc: 'Early care' },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/20">
                  <step.icon size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{step.label}</p>
                <p className="text-xs text-slate-400">{step.desc}</p>
                {i < 5 && <div className="hidden md:block text-slate-300 text-xl mt-2">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATISTICS ========== */}
      <section className="py-16 md:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Patients Monitored', value: counts.patients, suffix: '', icon: Users },
              { label: 'Prediction Accuracy', value: counts.accuracy, suffix: '%', icon: Award },
              { label: 'Early Detection', value: counts.hours.toFixed(0), suffix: ' Hours', icon: Clock },
              { label: 'Predictions', value: counts.predictions, suffix: '+', icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass-premium rounded-3xl p-6 text-center card-hover border border-white/30">
                <stat.icon size={24} className="text-[#2563EB] mx-auto mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-slate-800">{stat.value}{stat.suffix}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TEAM ========== */}
      <section id="team" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">Our Team</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">Meet the <span className="gradient-text">experts</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-premium rounded-3xl p-6 text-center card-hover border border-white/30">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/20">{member.avatar}</div>
                <h4 className="font-semibold text-slate-800 mt-3">{member.name}</h4>
                <p className="text-xs text-[#2563EB] font-medium">{member.role}</p>
                <p className="text-xs text-slate-400 mt-1">{member.specialty}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== RESOURCES & DOCUMENTATION ========== */}
      <section id="documentation" className="py-16 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">Resources</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">
              Learn more about <span className="gradient-text">SwasthAI</span>
            </h2>
            <p className="text-slate-500 mt-3">
              Access documentation, video tutorials, and research papers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ✅ DOCUMENTATION CARD - opens research.pdf */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              className="glass-premium rounded-2xl p-6 card-hover text-center border border-white/30 cursor-pointer group"
              onClick={() => window.open('/research.pdf', '_blank')}
            >
              <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#2563EB]/20 transition">
                <FileText size={24} className="text-[#2563EB]" />
              </div>
              <h4 className="font-semibold text-slate-800">Documentation</h4>
              <p className="text-xs text-slate-400 mt-1">Complete API and integration guides</p>
              <span className="inline-block mt-3 text-xs text-[#2563EB] font-medium group-hover:underline">
                View PDF →
              </span>
            </motion.div>

            {/* ✅ VIDEO TUTORIALS CARD - opens demo-vedio.mp4 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="glass-premium rounded-2xl p-6 card-hover text-center border border-white/30 cursor-pointer group"
              onClick={() => {
                // Open video in modal or new tab
                const videoWindow = window.open('', '_blank');
                videoWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head><title>SwasthAI Video Tutorial</title></head>
                    <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                      <video controls autoplay style="max-width:90%;max-height:90vh;" src="/demo-vedio.mp4"></video>
                    </body>
                  </html>
                `);
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#06B6D4]/20 transition">
                <Play size={24} className="text-[#06B6D4]" />
              </div>
              <h4 className="font-semibold text-slate-800">Video Tutorials</h4>
              <p className="text-xs text-slate-400 mt-1">Step-by-step platform walkthrough</p>
              <span className="inline-block mt-3 text-xs text-[#06B6D4] font-medium group-hover:underline">
                Watch Now →
              </span>
            </motion.div>

            {/* ✅ RESEARCH PAPERS CARD - opens research.pdf */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="glass-premium rounded-2xl p-6 card-hover text-center border border-white/30 cursor-pointer group"
              onClick={() => window.open('/research.pdf', '_blank')}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition">
                <BookOpen size={24} className="text-emerald-500" />
              </div>
              <h4 className="font-semibold text-slate-800">Research Papers</h4>
              <p className="text-xs text-slate-400 mt-1">Clinical validation and case studies</p>
              <span className="inline-block mt-3 text-xs text-emerald-500 font-medium group-hover:underline">
                Read More →
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#2563EB] text-sm font-semibold">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">Frequently asked <span className="gradient-text">questions</span></h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-premium rounded-2xl overflow-hidden border border-white/30">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/20 transition"
                >
                  <span className="font-medium text-slate-800 text-sm">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={18} className="text-[#2563EB] flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed border-t border-white/20 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CONTACT ========== */}
      <section id="contact" className="py-16 md:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-[#2563EB] text-sm font-semibold">Contact</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-2">Get in <span className="gradient-text">touch</span></h2>
              <p className="text-slate-500 mt-3">Have questions? We'd love to hear from you.</p>
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-3 text-sm text-slate-600"><Mail size={18} className="text-[#2563EB]" /> hello@swasthai.com</div>
                <div className="flex items-center gap-3 text-sm text-slate-600"><Phone size={18} className="text-[#2563EB]" /> +91 1800-123-4567</div>
                <div className="flex items-center gap-3 text-sm text-slate-600"><MapPin size={18} className="text-[#2563EB]" /> Bengaluru, India</div>
              </div>
            </div>
            <div className="glass-premium rounded-3xl p-6 card-hover border border-white/30">
              <form className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-white/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input type="email" className="w-full px-4 py-3 bg-white/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Message</label>
                  <textarea rows="3" className="w-full px-4 py-3 bg-white/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"></textarea>
                </div>
                <button type="submit" className="w-full py-3.5 btn-primary rounded-2xl">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/logo.png" 
                  alt="SwasthAI Sentinel" 
                  className="w-10 h-10 rounded-xl brightness-0 invert object-contain"
                />
                <span className="text-lg font-bold">SwasthAI <span className="text-[#06B6D4]">Sentinel</span></span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs">AI-powered sepsis prediction for district hospitals.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#about" className="hover:text-white transition">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#team" className="hover:text-white transition">Team</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">HIPAA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 SwasthAI Sentinel. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition"><Twitter size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition"><Linkedin size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition"><Github size={18} /></a>
              <a href="#" className="text-slate-400 hover:text-white transition"><Youtube size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}