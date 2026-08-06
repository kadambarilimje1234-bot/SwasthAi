// Helper functions

// Generate random MRN
exports.generateMRN = () => {
    const prefix = 'MRN';
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${random}`;
  };
  
  // Calculate age from date of birth
  exports.calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Format date
  exports.formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if vitals are abnormal
  exports.isVitalsAbnormal = (vitals) => {
    const { heartRate, temperature, systolicBP, diastolicBP, spo2, respirationRate } = vitals;
    
    return (
      heartRate > 100 || heartRate < 60 ||
      temperature > 100.4 || temperature < 97.0 ||
      systolicBP > 140 || systolicBP < 90 ||
      diastolicBP > 90 || diastolicBP < 60 ||
      spo2 < 95 ||
      respirationRate > 22 || respirationRate < 12
    );
  };
  
  // Get status from risk score
  exports.getStatusFromRisk = (riskScore) => {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'WARNING';
    return 'STABLE';
  };