const axios = require('axios');

// Hugging Face Inference API
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// ✅ USE FLAN-T5 - Yeh free tier mein kaam karta hai
const MODEL = 'google/flan-t5-base';

const chatWithAI = async (userMessage, patientContext) => {
  try {
    // If no API key, use fallback
    if (!HUGGINGFACE_API_KEY) {
      console.log('⚠️ No Hugging Face API key found, using fallback');
      return getFallbackResponse(userMessage, patientContext);
    }

    console.log('🔑 API Key found, using model:', MODEL);

    // Build context from patient data
    let context = '';
    if (patientContext) {
      context = `
Patient: ${patientContext.name || 'N/A'}
Age: ${patientContext.age || 'N/A'}
Gender: ${patientContext.gender || 'N/A'}
Ward: ${patientContext.ward || 'N/A'}
Status: ${patientContext.status || 'STABLE'}
Risk: ${patientContext.risk || 0}%
HR: ${patientContext.heartRate || 'N/A'} bpm
Temp: ${patientContext.temperature || 'N/A'}°F
BP: ${patientContext.systolicBP || 'N/A'}/${patientContext.diastolicBP || 'N/A'}
SpO2: ${patientContext.spo2 || 'N/A'}%
WBC: ${patientContext.wbc || 'N/A'} x10³/µL
RBC: ${patientContext.rbc || 'N/A'} x10⁶/µL
Doctor: ${patientContext.doctor || 'Not Assigned'}
Nurse: ${patientContext.nurse || 'Not Assigned'}
      `;
    }

    // FLAN-T5 ke liye simple prompt
    const prompt = `Context: ${context || 'No specific patient'}\nQuestion: ${userMessage}\nAnswer:`;

    console.log('🤖 Sending to Hugging Face API...');

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          do_sample: true,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    console.log('✅ Hugging Face API Response status:', response.status);

    let reply = response.data?.[0]?.generated_text || '';
    reply = reply.replace('Answer:', '').trim();
    reply = reply.replace('Context:', '').trim();
    
    if (!reply || reply.length < 3) {
      console.log('⚠️ Empty response from API, using fallback');
      return getFallbackResponse(userMessage, patientContext);
    }

    console.log('📝 Response:', reply.substring(0, 100));
    return reply;

  } catch (error) {
    console.error('❌ Hugging Face API Error:', error.response?.data || error.message);
    console.log('⚠️ Using fallback response');
    return getFallbackResponse(userMessage, patientContext);
  }
};

// ============ FALLBACK RESPONSES ============
const getFallbackResponse = (message, patient) => {
  const msg = message.toLowerCase().trim();
  const p = patient || {};

  // === WBC ===
  if (msg.includes('wbc') || msg.includes('white blood')) {
    const wbc = p.wbc;
    if (wbc === 'N/A' || !wbc) return "❌ WBC data not available for this patient.";
    if (wbc > 11) return `⚠️ **WBC Alert:** ${wbc} x10³/µL (Elevated). Normal is 4.5-11.0. This may indicate infection or inflammation. Recommend: Blood culture, monitor temperature, consult infectious disease specialist.`;
    if (wbc < 4.5) return `⚠️ **WBC Alert:** ${wbc} x10³/µL (Low). Normal is 4.5-11.0. This may indicate viral infection or bone marrow issues. Recommend: Repeat test, check for viral symptoms, consult hematologist.`;
    return `✅ **WBC Normal:** ${wbc} x10³/µL. Normal range is 4.5-11.0. Continue regular monitoring.`;
  }

  // === RBC ===
  if (msg.includes('rbc') || msg.includes('red blood')) {
    const rbc = p.rbc;
    if (rbc === 'N/A' || !rbc) return "❌ RBC data not available for this patient.";
    if (rbc < 4.5) return `⚠️ **RBC Alert:** ${rbc} x10⁶/µL (Low). Normal is 4.5-5.9. This may indicate anemia or nutritional deficiency. Recommend: Check iron, B12, folate levels. Consider dietary changes or supplements.`;
    if (rbc > 5.9) return `⚠️ **RBC Alert:** ${rbc} x10⁶/µL (High). Normal is 4.5-5.9. May indicate dehydration or other conditions. Recommend: Check hydration status, repeat test.`;
    return `✅ **RBC Normal:** ${rbc} x10⁶/µL. Normal range is 4.5-5.9. Continue regular monitoring.`;
  }

  // === VITALS ===
  if (msg.includes('vitals') || msg.includes('vital') || msg.includes('health overview')) {
    return `📊 **Vitals Summary**\n\n❤️ Heart Rate: ${p.heartRate || 'N/A'} bpm (Normal: 60-100)\n🌡️ Temperature: ${p.temperature || 'N/A'}°F (Normal: 97.0-100.4)\n🩸 BP: ${p.systolicBP || 'N/A'}/${p.diastolicBP || 'N/A'} mmHg (Normal: 90-140/60-90)\n💨 SpO2: ${p.spo2 || 'N/A'}% (Normal: 95-100)\n🫁 Respiration: ${p.respiratoryRate || 'N/A'}/min (Normal: 12-22)\n🧬 WBC: ${p.wbc || 'N/A'} x10³/µL\n🧬 RBC: ${p.rbc || 'N/A'} x10⁶/µL`;
  }

  // === RISK ===
  if (msg.includes('risk') || msg.includes('danger') || msg.includes('critical')) {
    const risk = p.risk || 0;
    const level = risk >= 80 ? '🔴 CRITICAL' : risk >= 60 ? '🟡 HIGH' : risk >= 40 ? '🟠 MEDIUM' : '🟢 LOW';
    return `🎯 **Risk Assessment**\n\n📊 Risk Score: ${risk}%\n⚠️ Risk Level: ${level}\n\n${risk >= 80 ? '🚨 **IMMEDIATE ACTION REQUIRED!**\n• Alert the medical team\n• Start emergency protocol\n• Continuous monitoring' : risk >= 60 ? '📊 **Monitor Closely:**\n• Check vitals every 2 hours\n• Inform attending doctor' : '✅ **Routine Monitoring:**\n• Continue regular checkups\n• Follow treatment plan'}`;
  }

  // === PATIENT INFO ===
  if (msg.includes('patient') && (msg.includes('info') || msg.includes('details'))) {
    return `📋 **Patient Information**\n\n👤 Name: ${p.name || 'N/A'}\n📅 Age: ${p.age || 'N/A'} years\n⚥ Gender: ${p.gender || 'N/A'}\n🏥 Ward: ${p.ward || 'N/A'}\n🩺 Diagnosis: ${p.diagnosis || 'Not specified'}\n📊 Status: ${p.status || 'STABLE'}\n👨‍⚕️ Doctor: ${p.doctor || 'Not Assigned'}\n👩‍⚕️ Nurse: ${p.nurse || 'Not Assigned'}`;
  }

  // === DOCTOR ===
  if (msg.includes('doctor') || msg.includes('physician')) {
    return `👨‍⚕️ **Doctor Information**\n\n📋 Assigned Doctor: ${p.doctor || 'Not Assigned'}\n🏥 Hospital: City District Hospital\n📞 Contact: Available during clinic hours\n\n💡 Schedule follow-up appointment if needed.`;
  }

  // === NURSE ===
  if (msg.includes('nurse')) {
    return `👩‍⚕️ **Nurse Information**\n\n📋 Assigned Nurse: ${p.nurse || 'Not Assigned'}\n🏥 Ward: ${p.ward || 'N/A'}\n📞 Contact: Available during shift hours`;
  }

  // === ALL PATIENTS ===
  if (msg.includes('all patients') || msg.includes('total patients')) {
    return `📋 **Patient Overview**\n\n👥 Total Patients: ${p.totalPatients || 'N/A'}\n🔴 Critical: ${p.criticalCount || 0}\n🟡 Warning: ${p.warningCount || 0}\n🟢 Stable: ${p.stableCount || 0}`;
  }

  // === HELP ===
  if (msg.includes('help') || msg.includes('what can you do') || msg.includes('commands')) {
    return `🤖 **I can help you with:**\n\n📊 "Show patient vitals"\n🎯 "What is the risk score?"\n🧬 "WBC count" or "RBC count"\n👨‍⚕️ "Who is the doctor?"\n📋 "Patient info"\n🔴 "Any emergencies?"\n\n💡 Just ask naturally!`;
  }

  // === EMERGENCY ===
  if (msg.includes('emergency') || msg.includes('alert') || msg.includes('urgent')) {
    return `🚨 **Emergency Protocol**\n\n⚠️ If this is a medical emergency:\n• Call 911 immediately\n• Alert the code team\n• Start emergency procedures\n\n📋 For non-emergency clinical questions, I'm here to help!`;
  }

  // === GREETING ===
  if (msg.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    return `👋 ${timeGreeting}! I'm your AI Clinical Assistant.\n\n${p.name ? `I see you're looking at ${p.name}'s profile. ` : ''}How can I help you today?\n\n💡 Try asking about vitals, risk score, WBC, RBC, or patient info.`;
  }

  // === DEFAULT ===
  return `🤖 I understand you're asking about: "${message}"\n\n💡 Here are some things you can ask:\n• "Show vitals" - View all vitals\n• "Risk score" - Check risk level\n• "WBC count" - White blood cells\n• "RBC count" - Red blood cells\n• "Patient info" - Full details\n• "Help" - See all commands\n\n${p.name ? `📋 Currently viewing: ${p.name}` : '👤 Select a patient for specific information.'}`;
};

module.exports = { chatWithAI };