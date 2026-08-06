import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, Check, 
  Building2, User, Shield, 
  Mail, Lock, Phone, Calendar,
  Award, CheckCircle, Activity,
  Stethoscope, FileCheck,
  AlertCircle, Eye, EyeOff,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, label: 'Role', icon: User },
  { id: 2, label: 'Account', icon: Mail },
  { id: 3, label: 'Details', icon: Building2 },
  { id: 4, label: 'Profile', icon: Award },
];

export default function Signup() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    hospitalName: '',
    hospitalCode: '',
    department: '',
    specialization: '',
    ward: 'ALL',
    licenseNumber: '',
    age: '',
    gender: 'Male',
  });

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.role) newErrors.role = 'Please select a role';
      if (!formData.name || formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
    }
    
    if (currentStep === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (formData.phone.length < 10) newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (currentStep === 3) {
      if (formData.role !== 'PATIENT') {
        if (!formData.hospitalName) newErrors.hospitalName = 'Hospital name is required';
        if (!formData.hospitalCode) newErrors.hospitalCode = 'Hospital code is required';
        if (!formData.department) newErrors.department = 'Department is required';
      }
    }
    
    if (currentStep === 4) {
      if (formData.role === 'DOCTOR' && !formData.licenseNumber) {
        newErrors.licenseNumber = 'License number is required for doctors';
      }
      if (formData.role === 'PATIENT' && !formData.age) {
        newErrors.age = 'Age is required for patients';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        hospitalName: formData.hospitalName,
        hospitalCode: formData.hospitalCode,
        specialization: formData.specialization,
        ward: formData.ward,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        department: formData.department,
        age: formData.age,
        gender: formData.gender,
      });
      
      setLoading(false);
      
      if (result.success) {
        toast.success('Account created successfully!');
        
        const loginResult = await login(formData.email, formData.password);
        if (loginResult.success) {
          if (formData.role === 'PATIENT') {
            navigate('/patient-dashboard');
          } else {
            navigate('/app/dashboard');
          }
        } else {
          navigate('/staff-login');
        }
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || 'Registration failed');
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-[#2563EB] font-semibold">
              <User size={18} /> Select Your Role
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].map((role) => (
                <motion.button
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setFormData({...formData, role});
                    setErrors({...errors, role: ''});
                  }}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    formData.role === role 
                      ? 'border-[#2563EB] bg-[#2563EB]/10' 
                      : 'border-slate-200 hover:border-[#2563EB]/50'
                  }`}
                >
                  <div className="text-3xl mb-1">
                    {role === 'ADMIN' && '🏥'}
                    {role === 'DOCTOR' && '👨‍⚕️'}
                    {role === 'NURSE' && '👩‍⚕️'}
                    {role === 'PATIENT' && '👤'}
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {role === 'ADMIN' && 'Hospital Admin'}
                    {role === 'DOCTOR' && 'Doctor'}
                    {role === 'NURSE' && 'Nurse'}
                    {role === 'PATIENT' && 'Patient'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {role === 'ADMIN' && 'Manage hospital'}
                    {role === 'DOCTOR' && 'Treat patients'}
                    {role === 'NURSE' && 'Record vitals'}
                    {role === 'PATIENT' && 'Access health records'}
                  </p>
                </motion.button>
              ))}
            </div>
            {errors.role && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} /> {errors.role}
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                  errors.name ? 'border-red-400' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 transition`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#2563EB] font-semibold">
              <Mail size={18} /> Account Details
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                  errors.email ? 'border-red-400' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                  errors.phone ? 'border-red-400' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                placeholder="+91 98765 43210"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.phone}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                    errors.password ? 'border-red-400' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 pr-10`}
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                    errors.confirmPassword ? 'border-red-400' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 pr-10`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#2563EB] font-semibold">
              <Building2 size={18} /> {formData.role === 'PATIENT' ? 'Personal Details' : 'Hospital Information'}
            </div>
            
            {formData.role !== 'PATIENT' ? (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Hospital Name</label>
                  <input
                    type="text"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                    className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                      errors.hospitalName ? 'border-red-400' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                    placeholder="e.g. City District Hospital"
                  />
                  {errors.hospitalName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.hospitalName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Hospital Code</label>
                  <input
                    type="text"
                    value={formData.hospitalCode}
                    onChange={(e) => setFormData({...formData, hospitalCode: e.target.value.toUpperCase()})}
                    className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                      errors.hospitalCode ? 'border-red-400' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                    placeholder="e.g. CDH-001"
                  />
                  {errors.hospitalCode && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.hospitalCode}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                      errors.department ? 'border-red-400' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                  >
                    <option value="">Select Department</option>
                    <option value="ICU">ICU / Critical Care</option>
                    <option value="Emergency">Emergency Department</option>
                    <option value="General Ward">General Ward</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Obstetrics">Obstetrics & Gynecology</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.department}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                      errors.age ? 'border-red-400' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                    placeholder="Your age"
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.age}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-[#2563EB] font-semibold">
              <Award size={18} /> Profile Setup
            </div>
            
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100/50 flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-700">Almost there!</p>
                <p className="text-xs text-emerald-600">Complete your profile to get started</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="e.g. Internal Medicine, Cardiology"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Ward</label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({...formData, ward: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                <option value="ALL">ALL Wards</option>
                <option value="ICU A">ICU A</option>
                <option value="ICU B">ICU B</option>
                <option value="Ward A">Ward A</option>
                <option value="Ward B">Ward B</option>
                <option value="Ward C">Ward C</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            
            {formData.role === 'DOCTOR' && (
              <div>
                <label className="text-sm font-medium text-slate-700">License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  className={`w-full px-4 py-3 bg-slate-50/80 rounded-xl border ${
                    errors.licenseNumber ? 'border-red-400' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30`}
                  placeholder="Medical License Number"
                />
                {errors.licenseNumber && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.licenseNumber}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 p-3 bg-blue-50/70 rounded-xl border border-blue-100/50">
              <input type="checkbox" className="rounded text-[#2563EB] focus:ring-[#2563EB]/30" required />
              <span className="text-sm text-slate-600">I agree to the Terms of Service and Privacy Policy</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-cyan-50/30">
      <div className="w-full max-w-4xl glass-premium rounded-3xl p-8 md:p-10 card-hover border border-white/30">
        <div className="flex items-center gap-3 mb-6">
          <img 
            src="/logo.png" 
            alt="SwasthAI Sentinel" 
            className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 object-contain"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-800">Create Account</h2>
            <p className="text-xs text-slate-400">Step {currentStep} of {steps.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex-1 flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${currentStep >= step.id ? 'text-[#2563EB]' : 'text-slate-300'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  currentStep >= step.id ? 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > step.id ? <Check size={14} /> : step.id}
                </div>
                <span className="text-xs hidden sm:inline font-medium">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-200 rounded-full">
                  <div className={`h-full rounded-full bg-[#2563EB] transition-all duration-500 ${
                    currentStep > step.id ? 'w-full' : 'w-0'
                  }`}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {renderStep()}
              
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 font-medium"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                
                {currentStep === steps.length ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Creating Account...
                      </span>
                    ) : (
                      <>Create Account <Check size={16} /></>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition hover:scale-[1.02]"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="glass-premium rounded-2xl p-6 border border-white/30 bg-gradient-to-br from-[#2563EB]/5 to-[#06B6D4]/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2563EB] mb-4">
                  <Activity size={18} /> Why SwasthAI?
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">✓ Predict sepsis 6-12 hours early</li>
                  <li className="flex items-start gap-2">✓ Explainable AI with SHAP</li>
                  <li className="flex items-start gap-2">✓ Works with sparse data</li>
                  <li className="flex items-start gap-2">✓ HIPAA compliant & secure</li>
                  <li className="flex items-start gap-2">✓ Trusted by 50+ hospitals</li>
                </ul>
                <div className="mt-4 p-3 bg-white/50 rounded-xl text-center text-xs text-slate-400">
                  🏥 Already have an account? <Link to="/staff-login" className="text-[#2563EB] font-medium hover:underline">Sign In</Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}