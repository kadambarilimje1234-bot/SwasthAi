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
    // ✅ Use only valid department values
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

    // ============ CREATE PATIENTS ============
    const patientsData = [
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
        vitals: { heartRate: 72, temperature: 98.6, systolicBP: 120, diastolicBP: 80, spo2: 98, respiratoryRate: 16 }
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
        vitals: { heartRate: 68, temperature: 98.4, systolicBP: 110, diastolicBP: 72, spo2: 99, respiratoryRate: 15 }
      },
      {
        name: 'Amit Singh',
        age: 45,
        gender: 'Male',
        ward: 'Ward C',
        bedNumber: 'C-312',
        diagnosis: 'Fever',
        medicalHistory: ['Asthma'],
        allergies: ['Sulfa'],
        contactNumber: '+91 98765 43212',
        email: 'amit@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 15,
        currentStatus: 'STABLE',
        aiConfidence: 88,
        vitals: { heartRate: 78, temperature: 99.2, systolicBP: 115, diastolicBP: 75, spo2: 97, respiratoryRate: 17 }
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
        vitals: { heartRate: 72, temperature: 98.6, systolicBP: 110, diastolicBP: 72, spo2: 98, respiratoryRate: 16 }
      },
      {
        name: 'Vikram Joshi',
        age: 65,
        gender: 'Male',
        ward: 'Ward B',
        bedNumber: 'B-108',
        diagnosis: 'COPD Exacerbation',
        medicalHistory: ['COPD', 'Smoking'],
        allergies: [],
        contactNumber: '+91 98765 43214',
        email: 'vikram@swasthai.com',
        assignedDoctor: doctor._id,
        assignedNurse: nurse._id,
        currentRisk: 18,
        currentStatus: 'STABLE',
        aiConfidence: 86,
        vitals: { heartRate: 85, temperature: 99.8, systolicBP: 125, diastolicBP: 78, spo2: 94, respiratoryRate: 20 }
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

      // Create vitals
      const vitals = new Vitals({
        patient: patient._id,
        ...vitalsData,
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

      // Create prediction
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
          { feature: 'Heart Rate', impact: 8, direction: 'positive' }
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

      console.log(`✅ Patient created: ${patient.name} (${patientData.currentRisk}%)`);
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();