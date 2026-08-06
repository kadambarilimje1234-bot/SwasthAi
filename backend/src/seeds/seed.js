const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Patient = require('../models/Patient');
const Vitals = require('../models/Vitals');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const Timeline = require('../models/Timeline');
const DataQuality = require('../models/DataQuality');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ============ CLEAR ALL COLLECTIONS ============
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Patient.deleteMany({});
    await Vitals.deleteMany({});
    await Prediction.deleteMany({});
    await Alert.deleteMany({});
    await Timeline.deleteMany({});
    await DataQuality.deleteMany({});
    console.log('🗑️ All collections cleared');

    // ============ CREATE HOSPITAL ============
    const hospital = await Hospital.create({
      hospitalName: 'City District Hospital',
      hospitalCode: 'CDH-001',
      address: {
        street: '123 Main Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001'
      },
      phone: '+91 22 1234 5678',
      email: 'contact@cdh.org',
      departments: ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Cardiology'],
      totalBeds: 200,
      availableBeds: 45
    });
    console.log('🏥 Hospital created');

    // ============ CREATE USERS ============
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@swasthai.com',
      password: adminPassword,
      role: 'ADMIN',
      hospital: hospital._id
    });

    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const doctor = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@swasthai.com',
      password: doctorPassword,
      role: 'DOCTOR',
      hospital: hospital._id,
      ward: 'ICU A',
      specialization: 'Internal Medicine',
      department: 'ICU'
    });

    const nursePassword = await bcrypt.hash('nurse123', 10);
    const nurse = await User.create({
      name: 'Nurse Rajesh Kumar',
      email: 'nurse@swasthai.com',
      password: nursePassword,
      role: 'NURSE',
      hospital: hospital._id,
      ward: 'ICU A'
    });

    // ============ CREATE PATIENT USER ============
    const patientUserPassword = await bcrypt.hash('patient123', 10);
    const patientUser = await User.create({
      name: 'Rahul Sharma',
      email: 'patient@swasthai.com',
      password: patientUserPassword,
      role: 'PATIENT',
      hospital: hospital._id,
      isActive: true
    });
    console.log('👤 Patient user created: patient@swasthai.com / patient123');

    console.log('👤 All users created');

    // ============ CREATE PATIENTS (STABLE, WARNING, CRITICAL) WITH WBC & RBC ==========
    const patientsData = [
      // ========== STABLE PATIENTS (Low Risk: 0-20%) ==========
      {
        name: 'Rahul Sharma',
        age: 58,
        gender: 'Male',
        ward: 'ICU A',
        bedNumber: 'A-101',
        diagnosis: 'Pneumonia with Sepsis',
        medicalHistory: ['Hypertension', 'Diabetes Type 2'],
        allergies: ['Penicillin'],
        contactNumber: '+91 98765 43210',
        email: 'patient@swasthai.com',
        userId: patientUser._id,
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 12,
        currentStatus: 'STABLE',
        aiConfidence: 92,
        vitals: { 
          heartRate: 72, 
          temperature: 98.6, 
          systolicBP: 120, 
          diastolicBP: 80, 
          spo2: 98, 
          respiratoryRate: 16,
          wbc: 7.2,   // ✅ Normal WBC (4.5-11.0)
          rbc: 5.1    // ✅ Normal RBC (4.5-5.9)
        }
      },
      {
        name: 'Priya Patel',
        age: 72,
        gender: 'Female',
        ward: 'ICU B',
        bedNumber: 'B-205',
        diagnosis: 'Urinary Tract Infection',
        medicalHistory: ['Heart Disease'],
        allergies: [],
        contactNumber: '+91 98765 43211',
        email: 'priya@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 8,
        currentStatus: 'STABLE',
        aiConfidence: 90,
        vitals: { 
          heartRate: 68, 
          temperature: 98.4, 
          systolicBP: 110, 
          diastolicBP: 72, 
          spo2: 99, 
          respiratoryRate: 15,
          wbc: 6.8,
          rbc: 4.8
        }
      },
      {
        name: 'Sneha Reddy',
        age: 34,
        gender: 'Female',
        ward: 'Ward A',
        bedNumber: 'A-215',
        diagnosis: 'Observation',
        medicalHistory: [],
        allergies: [],
        contactNumber: '+91 98765 43213',
        email: 'sneha@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 5,
        currentStatus: 'STABLE',
        aiConfidence: 85,
        vitals: { 
          heartRate: 72, 
          temperature: 98.6, 
          systolicBP: 110, 
          diastolicBP: 72, 
          spo2: 98, 
          respiratoryRate: 16,
          wbc: 7.0,
          rbc: 5.0
        }
      },

      // ========== WARNING PATIENTS (Medium Risk: 21-60%) ==========
      {
        name: 'Amit Singh',
        age: 45,
        gender: 'Male',
        ward: 'Ward C',
        bedNumber: 'C-312',
        diagnosis: 'Fever with infection',
        medicalHistory: ['Asthma'],
        allergies: ['Sulfa'],
        contactNumber: '+91 98765 43212',
        email: 'amit@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 42,
        currentStatus: 'WARNING',
        aiConfidence: 88,
        vitals: { 
          heartRate: 82, 
          temperature: 100.2, 
          systolicBP: 125, 
          diastolicBP: 78, 
          spo2: 96, 
          respiratoryRate: 19,
          wbc: 14.5,  // ✅ Elevated WBC - Infection
          rbc: 4.9
        }
      },
      {
        name: 'Deepak Kumar',
        age: 55,
        gender: 'Male',
        ward: 'ICU B',
        bedNumber: 'B-108',
        diagnosis: 'COPD Exacerbation',
        medicalHistory: ['COPD', 'Smoking'],
        allergies: [],
        contactNumber: '+91 98765 43214',
        email: 'deepak@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 38,
        currentStatus: 'WARNING',
        aiConfidence: 86,
        vitals: { 
          heartRate: 85, 
          temperature: 99.8, 
          systolicBP: 135, 
          diastolicBP: 82, 
          spo2: 94, 
          respiratoryRate: 20,
          wbc: 12.3,
          rbc: 5.2
        }
      },
      {
        name: 'Meera Iyer',
        age: 48,
        gender: 'Female',
        ward: 'Ward B',
        bedNumber: 'B-205',
        diagnosis: 'Severe Anemia',
        medicalHistory: ['Thyroid'],
        allergies: [],
        contactNumber: '+91 98765 43215',
        email: 'meera@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 55,
        currentStatus: 'WARNING',
        aiConfidence: 82,
        vitals: { 
          heartRate: 90, 
          temperature: 99.2, 
          systolicBP: 100, 
          diastolicBP: 65, 
          spo2: 97, 
          respiratoryRate: 18,
          wbc: 11.8,
          rbc: 3.2    // ✅ Low RBC - Anemia
        }
      },

      // ========== CRITICAL PATIENTS (High Risk: 61-100%) ==========
      {
        name: 'Vikram Joshi',
        age: 65,
        gender: 'Male',
        ward: 'ICU A',
        bedNumber: 'A-301',
        diagnosis: 'Septic Shock',
        medicalHistory: ['Diabetes Type 2', 'Heart Disease'],
        allergies: [],
        contactNumber: '+91 98765 43216',
        email: 'vikram@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 85,
        currentStatus: 'CRITICAL',
        aiConfidence: 80,
        vitals: { 
          heartRate: 110, 
          temperature: 102.4, 
          systolicBP: 90, 
          diastolicBP: 60, 
          spo2: 89, 
          respiratoryRate: 24,
          wbc: 22.5,  // ✅ Very High WBC - Severe Infection
          rbc: 4.1
        }
      },
      {
        name: 'Sunita Devi',
        age: 78,
        gender: 'Female',
        ward: 'ICU A',
        bedNumber: 'A-302',
        diagnosis: 'Stroke with complications',
        medicalHistory: ['Hypertension', 'Stroke'],
        allergies: ['Aspirin'],
        contactNumber: '+91 98765 43217',
        email: 'sunita@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 92,
        currentStatus: 'CRITICAL',
        aiConfidence: 78,
        vitals: { 
          heartRate: 95, 
          temperature: 100.8, 
          systolicBP: 180, 
          diastolicBP: 100, 
          spo2: 92, 
          respiratoryRate: 22,
          wbc: 18.7,
          rbc: 3.8
        }
      },
      {
        name: 'Rajesh Kumar',
        age: 52,
        gender: 'Male',
        ward: 'ICU B',
        bedNumber: 'B-309',
        diagnosis: 'ARDS / Respiratory Failure',
        medicalHistory: ['Smoking', 'COPD'],
        allergies: [],
        contactNumber: '+91 98765 43218',
        email: 'rajesh@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 75,
        currentStatus: 'CRITICAL',
        aiConfidence: 83,
        vitals: { 
          heartRate: 100, 
          temperature: 99.6, 
          systolicBP: 140, 
          diastolicBP: 85, 
          spo2: 87, 
          respiratoryRate: 26,
          wbc: 16.3,
          rbc: 4.5
        }
      }
    ];

    const createdPatients = [];

    for (const pData of patientsData) {
      const { vitals: vitalsData, ...patientData } = pData;

      const patient = new Patient({
        ...patientData,
        patientId: `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        mrn: `MRN-${Date.now()}`,
        createdBy: admin._id,
        riskHistory: [patientData.currentRisk],
        statusHistory: [{
          status: patientData.currentStatus,
          timestamp: new Date(),
          reason: 'Patient admitted'
        }]
      });

      await patient.save();
      createdPatients.push(patient);

      // ============ CREATE VITALS WITH WBC & RBC ============
      const vitals = new Vitals({
        patient: patient._id,
        heartRate: vitalsData.heartRate,
        temperature: vitalsData.temperature,
        systolicBP: vitalsData.systolicBP,
        diastolicBP: vitalsData.diastolicBP,
        spo2: vitalsData.spo2,
        respiratoryRate: vitalsData.respiratoryRate,
        wbc: vitalsData.wbc || null,      // ✅ NEW
        rbc: vitalsData.rbc || null,      // ✅ NEW
        recordedBy: nurse._id,
        isAbnormal: patientData.currentRisk >= 60,
        riskScore: patientData.currentRisk,
        sepsisProbability: patientData.currentRisk / 100,
        dataQuality: {
          completenessScore: 100,
          missingFields: [],
          imputationMethod: 'none'
        }
      });
      await vitals.save();

      // ============ CREATE PREDICTION WITH WBC & RBC FACTORS ============
      const prediction = new Prediction({
        patient: patient._id,
        vitals: vitals._id,
        riskScore: patientData.currentRisk,
        riskLevel: patientData.currentRisk >= 80 ? 'CRITICAL' : 
                   patientData.currentRisk >= 60 ? 'HIGH' : 
                   patientData.currentRisk >= 40 ? 'MEDIUM' : 'LOW',
        confidence: patientData.aiConfidence || 88,
        predictedFor: new Date(Date.now() + 6 * 60 * 60 * 1000),
        modelVersion: 'v2.0',
        status: patientData.currentStatus,
        topFactors: [
          { feature: 'Temperature', impact: 10, direction: 'positive' },
          { feature: 'Heart Rate', impact: 8, direction: 'positive' },
          { feature: 'WBC', impact: 7, direction: 'positive' },   // ✅ NEW
          { feature: 'RBC', impact: 3, direction: 'negative' },   // ✅ NEW
          { feature: 'SpO2', impact: 5, direction: 'negative' }
        ],
        recommendations: ['Monitor vitals every 2 hours']
      });
      await prediction.save();

      patient.vitalsHistory.push(vitals._id);
      patient.predictions.push(prediction._id);
      await patient.save();

      // Timeline
      const timeline = new Timeline({
        patient: patient._id,
        eventType: 'ADMISSION',
        title: 'Patient Admitted',
        description: `Admitted to ${patientData.ward}`,
        eventTime: new Date(),
        createdBy: admin._id,
        isImportant: true
      });
      await timeline.save();

      console.log(`✅ Patient created: ${patient.name} (${patientData.currentRisk}%) - ${patientData.currentStatus} | WBC: ${vitalsData.wbc || 'N/A'} | RBC: ${vitalsData.rbc || 'N/A'}`);
    }

    // Update patient user reference
    if (patientUser) {
      patientUser.patientId = createdPatients[0]?._id || null;
      await patientUser.save();
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Seed completed successfully!');
    console.log(`👤 Admin: admin@swasthai.com / admin123`);
    console.log(`👤 Doctor: doctor@swasthai.com / doctor123`);
    console.log(`👤 Nurse: nurse@swasthai.com / nurse123`);
    console.log(`👤 Patient: patient@swasthai.com / patient123`);
    console.log(`📊 ${createdPatients.length} patients created`);
    console.log(`   ✅ STABLE: 3 patients (Normal WBC & RBC)`);
    console.log(`   ⚠️ WARNING: 3 patients (Elevated WBC, Low RBC)`);
    console.log(`   🔴 CRITICAL: 3 patients (Very High WBC)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();