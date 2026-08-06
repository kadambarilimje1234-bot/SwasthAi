import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import StaffLogin from './pages/StaffLogin';
import PatientLogin from './pages/PatientLogin';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import ClinicalAssistant from './pages/ClinicalAssistant';
import EmergencyCommand from './pages/EmergencyCommand';
import LabReport from './pages/LabReport';
import Analytics from './pages/Analytics';
import Layout from './components/Layout/Layout';
import FloatingAI from './components/FloatingAI';
import logo from '../public/logo.png';  

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/staff-login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          className: 'glass-premium rounded-2xl',
          duration: 4000,
        }} 
      />
      <Routes>
        <Route path="/" element={<><Landing /><FloatingAI /></>} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Patient Dashboard - No Layout */}
        <Route path="/patient-dashboard" element={
          <ProtectedRoute>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        
        {/* Staff Dashboard - With Layout */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patient/:id" element={<PatientDetail />} />
          <Route path="assistant" element={<ClinicalAssistant />} />
          <Route path="emergency" element={<EmergencyCommand />} />
          <Route path="lab" element={<LabReport />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;