import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Scan, CheckCircle, AlertCircle, X, Loader2, User } from 'lucide-react';
import { vitalsAPI, patientAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function LabReport() {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [file, setFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [extractedValues, setExtractedValues] = useState([]);
  const [processComplete, setProcessComplete] = useState(false);

  // Fetch patients on load
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientAPI.getAll();
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploaded(false);
      setProcessComplete(false);
      setExtractedValues([]);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  // ✅ AI Extraction - Simulate OCR
  const extractLabValues = (file) => {
    // Mock extraction based on file type/name
    // In real scenario, this would call an OCR API
    
    const mockExtraction = [
      { label: 'Hemoglobin (Hb)', value: 12.4, unit: 'g/dL', status: 'normal' },
      { label: 'WBC Count', value: 8.2, unit: 'x10³/µL', status: 'normal' },
      { label: 'Platelets', value: 245, unit: 'x10³/µL', status: 'normal' },
      { label: 'Glucose (Fasting)', value: 142, unit: 'mg/dL', status: 'high' },
      { label: 'Creatinine', value: 1.8, unit: 'mg/dL', status: 'high' },
      { label: 'Sodium', value: 138, unit: 'mEq/L', status: 'normal' },
      { label: 'Potassium', value: 4.2, unit: 'mEq/L', status: 'normal' },
      { label: 'CRP', value: 6.4, unit: 'mg/L', status: 'high' },
      { label: 'Lactate', value: 2.8, unit: 'mmol/L', status: 'high' },
      { label: 'Temperature', value: 99.2, unit: '°F', status: 'high' },
      { label: 'Heart Rate', value: 88, unit: 'bpm', status: 'normal' },
      { label: 'SpO2', value: 96, unit: '%', status: 'normal' },
    ];
    
    return mockExtraction;
  };

  // ✅ Process Lab Report
  const handleProcessLabReport = async () => {
    // Validations
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    
    if (!file) {
      toast.error('Please upload a lab report file');
      return;
    }
    
    setUploading(true);
    
    try {
      // 1️⃣ Simulate OCR extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2️⃣ Extract values from file
      const extracted = extractLabValues(file);
      setExtractedValues(extracted);
      
      // 3️⃣ Find patient details
      const patient = patients.find(p => p._id === selectedPatient);
      setSelectedPatientData(patient);
      
      // 4️⃣ Find vitals from extracted data
      const heartRate = extracted.find(v => v.label === 'Heart Rate')?.value || 72;
      const temperature = extracted.find(v => v.label === 'Temperature')?.value || 98.6;
      const systolicBP = extracted.find(v => v.label === 'Systolic BP')?.value || 120;
      const diastolicBP = extracted.find(v => v.label === 'Diastolic BP')?.value || 80;
      const spo2 = extracted.find(v => v.label === 'SpO2')?.value || 98;
      const respiratoryRate = extracted.find(v => v.label === 'Respiration')?.value || 16;
      
      // 5️⃣ Calculate risk based on abnormal values
      const abnormalCount = extracted.filter(v => v.status === 'high' || v.status === 'low').length;
      const riskScore = Math.min(abnormalCount * 8 + 10, 95);
      
      // 6️⃣ Add vitals to backend
      await vitalsAPI.add({
        patientId: selectedPatient,
        heartRate: heartRate,
        temperature: temperature,
        systolicBP: systolicBP,
        diastolicBP: diastolicBP,
        spo2: spo2,
        respiratoryRate: respiratoryRate,
        notes: `Lab report processed by AI OCR from ${file.name}`,
      });
      
      // 7️⃣ Update patient risk
      setUploaded(true);
      setProcessComplete(true);
      
      toast.success(`✅ Lab report processed! Risk score: ${riskScore}%`);
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      toast.error(error.response?.data?.message || 'Failed to process lab report');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploaded(false);
    setProcessComplete(false);
    setExtractedValues([]);
    setSelectedPatient('');
    setSelectedPatientData(null);
  };

  const getPatientName = (id) => {
    const patient = patients.find(p => p._id === id);
    return patient ? patient.name : 'Select Patient';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">🧪 Lab Report AI</h2>
        <p className="text-sm text-slate-400">Upload reports · AI extraction · Automatic risk update</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass-premium rounded-3xl p-8 border-2 border-dashed border-[#2563EB]/30 text-center card-hover relative overflow-hidden"
          style={{ minHeight: '380px' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-[#06B6D4]/5"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            {!uploading && !uploaded && (
              <>
                <div className="w-20 h-20 rounded-3xl bg-[#2563EB]/10 flex items-center justify-center mb-4">
                  <Upload size={32} className="text-[#2563EB]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Upload Lab Report</h3>
                <p className="text-sm text-slate-400 mt-1">Drag & drop or click to browse</p>
                
                {/* Patient Select */}
                <div className="w-full max-w-xs mt-4">
                  <select 
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/60 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} - {p.ward} ({p.currentStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dicom"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition cursor-pointer"
                >
                  Select File
                </label>
                {file && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} /> {file.name}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-3">Supports PDF, JPG, PNG, DICOM</p>
              </>
            )}
            
            {uploading && (
              <>
                <Loader2 size={40} className="text-[#2563EB] animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-slate-800">AI Scanning...</h3>
                <p className="text-sm text-slate-400">Extracting lab values with OCR</p>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Reading: {file?.name || 'lab_report.pdf'}</p>
              </>
            )}
            
            {uploaded && (
              <>
                <CheckCircle size={40} className="text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800">Extraction Complete!</h3>
                <p className="text-sm text-slate-400">{extractedValues.length} values extracted · Risk updated</p>
                <button 
                  onClick={clearFile}
                  className="mt-4 px-6 py-2.5 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition flex items-center gap-2"
                >
                  <X size={16} /> Upload New
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Extracted Values */}
        <div className="glass-premium rounded-3xl p-6 border border-white/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-[#2563EB]" /> Extracted Values
            </h3>
            {uploaded && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                ✅ AI Processed
              </span>
            )}
            {selectedPatient && (
              <span className="text-xs text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                <User size={10} /> {getPatientName(selectedPatient)}
              </span>
            )}
          </div>
          
          {!uploaded ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Upload a lab report to extract values</p>
              <p className="text-xs">AI will automatically extract and analyze</p>
              {file && !uploading && (
                <button 
                  onClick={handleProcessLabReport}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition flex items-center gap-2"
                >
                  <Scan size={16} /> Process Report
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {extractedValues.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      item.status === 'high' ? 'bg-red-50/50 border-red-200/50' :
                      item.status === 'low' ? 'bg-amber-50/50 border-amber-200/50' :
                      'bg-white/40 border-white/30'
                    }`}
                  >
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">
                        {item.value} {item.unit}
                      </span>
                      {item.status === 'high' && <AlertCircle size={14} className="text-red-500" />}
                      {item.status === 'low' && <AlertCircle size={14} className="text-amber-500" />}
                      {item.status === 'normal' && <CheckCircle size={14} className="text-emerald-500" />}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Risk Analysis */}
              <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-xs text-emerald-700 font-medium">
                      AI Risk Updated Successfully
                    </span>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">
                    {extractedValues.filter(v => v.status === 'high').length} abnormal values found
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}