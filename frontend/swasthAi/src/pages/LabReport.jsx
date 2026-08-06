import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Scan, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { vitalsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function LabReport() {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [file, setFile] = useState(null);
  const [extractedValues, setExtractedValues] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploaded(false);
    }
  };

  const handleUpload = async () => {

    // validations
  
    setUploading(true);
  
    setTimeout(async () => {
  
      // mock values
  
      try {
        await vitalsAPI.add({
          patientId: selectedPatient,
          temperature: 99.8,
          heartRate: 85,
          systolicBP: 120,
          diastolicBP: 80,
          spo2: 97,
          respiratoryRate: 18,
          notes: 'Lab report processed by AI OCR',
        });
  
      } catch(error) {
        console.error(error);
      }
  
    }, 2500);
  
  };  // IMPORTANT
  
  
  const clearFile = () => {
    setFile(null);
    setUploaded(false);
    setExtractedValues([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Lab Report AI</h2>
        <p className="text-sm text-slate-400">Upload reports · AI extraction · Automatic risk update</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass-premium rounded-3xl p-8 border-2 border-dashed border-[#2563EB]/30 text-center card-hover relative overflow-hidden"
          style={{ minHeight: '350px' }}
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
                
                <div className="w-full max-w-xs mt-4">
                  <select 
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-2 bg-white/60 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  >
                    <option value="">Select Patient</option>
                    <option value="PAT-2024-001">Rahul Sharma</option>
                    <option value="PAT-2024-002">Priya Patel</option>
                    <option value="PAT-2024-003">Amit Singh</option>
                  </select>
                </div>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
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
        <div className="glass-premium rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-[#2563EB]" /> Extracted Values
            </h3>
            {uploaded && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                AI Processed
              </span>
            )}
          </div>
          
          {!uploaded ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Upload a lab report to extract values</p>
              <p className="text-xs">AI will automatically extract and analyze</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {extractedValues.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2.5 bg-white/40 rounded-xl border border-white/30"
                  >
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{item.value} {item.unit}</span>
                      {item.status === 'high' && <AlertCircle size={14} className="text-red-500" />}
                      {item.status === 'low' && <AlertCircle size={14} className="text-amber-500" />}
                      {item.status === 'normal' && <CheckCircle size={14} className="text-emerald-500" />}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/50 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-xs text-emerald-700 font-medium">AI Risk Updated: 91% → 94%</span>
              </div>
              <button 
                onClick={handleUpload}
                className="mt-3 w-full py-2.5 btn-primary rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <Upload size={16} /> Process Lab Report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}