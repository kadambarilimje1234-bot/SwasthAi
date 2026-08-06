#!/usr/bin/env python3
"""
SwasthAI Sepsis Prediction - Enhanced with WBC, RBC, and more features
"""

import sys
import json
import numpy as np
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class SepsisPredictorEnhanced:
    def __init__(self):
        self.model_dir = os.path.dirname(__file__)
        self.model = None
        self.scaler = None
        self.optimal_threshold = 0.45
        self.feature_columns = [
            'HR', 'Temp', 'SBP', 'DBP', 'Resp', 'O2Sat',
            'WBC', 'RBC', 'Hgb', 'Hct', 'Plt',
            'Lactate', 'Creatinine', 'BUN', 'Glucose',
            'Age', 'Gender'
        ]
        self.load_model()
    
    def load_model(self):
        """Load trained model and scaler"""
        try:
            # Try enhanced model first
            model_path = os.path.join(self.model_dir, 'model_enhanced.pkl')
            scaler_path = os.path.join(self.model_dir, 'scaler_enhanced.pkl')
            metadata_path = os.path.join(self.model_dir, 'metadata_enhanced.json')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        self.metadata = json.load(f)
                        self.optimal_threshold = self.metadata.get('optimal_threshold', 0.45)
                    print(f"✅ Enhanced model loaded", file=sys.stderr)
                    print(f"✅ Accuracy: {self.metadata.get('accuracy', 0):.4f}", file=sys.stderr)
                    print(f"✅ ROC-AUC: {self.metadata.get('roc_auc', 0):.4f}", file=sys.stderr)
                    print(f"✅ Optimal Threshold: {self.optimal_threshold:.4f}", file=sys.stderr)
                return True
            
            # Fallback to regular model
            model_path = os.path.join(self.model_dir, 'model.pkl')
            scaler_path = os.path.join(self.model_dir, 'scaler.pkl')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print(f"✅ Using fallback model", file=sys.stderr)
                return True
            
            print("⚠️ No model files found, using enhanced fallback", file=sys.stderr)
            return False
            
        except Exception as e:
            print(f"⚠️ Model load error: {e}, using fallback", file=sys.stderr)
            return False
    
    def extract_features(self, vitals):
        """Extract features from vitals data with all 17 features"""
        features = []
        for col in self.feature_columns:
            if col == 'HR':
                features.append(float(vitals.get('heartRate', vitals.get('HR', 80))))
            elif col == 'Temp':
                features.append(float(vitals.get('temperature', vitals.get('Temp', 98.6))))
            elif col == 'SBP':
                features.append(float(vitals.get('systolicBP', vitals.get('SBP', 120))))
            elif col == 'DBP':
                features.append(float(vitals.get('diastolicBP', vitals.get('DBP', 76))))
            elif col == 'Resp':
                features.append(float(vitals.get('respirationRate', vitals.get('Resp', 16))))
            elif col == 'O2Sat':
                features.append(float(vitals.get('spo2', vitals.get('O2Sat', 98))))
            elif col == 'WBC':
                features.append(float(vitals.get('wbc', vitals.get('WBC', 7500))))
            elif col == 'RBC':
                features.append(float(vitals.get('rbc', vitals.get('RBC', 4.8))))
            elif col == 'Hgb':
                features.append(float(vitals.get('hemoglobin', vitals.get('Hgb', 13.5))))
            elif col == 'Hct':
                features.append(float(vitals.get('hematocrit', vitals.get('Hct', 40))))
            elif col == 'Plt':
                features.append(float(vitals.get('platelets', vitals.get('Plt', 220000))))
            elif col == 'Lactate':
                features.append(float(vitals.get('lactate', vitals.get('Lactate', 1.0))))
            elif col == 'Creatinine':
                features.append(float(vitals.get('creatinine', vitals.get('Creatinine', 1.0))))
            elif col == 'BUN':
                features.append(float(vitals.get('bun', vitals.get('BUN', 14))))
            elif col == 'Glucose':
                features.append(float(vitals.get('glucose', vitals.get('Glucose', 100))))
            elif col == 'Age':
                features.append(float(vitals.get('age', vitals.get('Age', 50))))
            elif col == 'Gender':
                features.append(float(vitals.get('gender', vitals.get('Gender', 0))))
        
        return np.array(features).reshape(1, -1)
    
    def calculate_sirs(self, vitals):
        """Calculate SIRS criteria count"""
        hr = float(vitals.get('heartRate', vitals.get('HR', 80)))
        temp = float(vitals.get('temperature', vitals.get('Temp', 98.6)))
        rr = float(vitals.get('respirationRate', vitals.get('Resp', 16)))
        wbc = float(vitals.get('wbc', vitals.get('WBC', 7500)))
        
        sirs_count = 0
        if hr > 90:
            sirs_count += 1
        if temp >= 100.4 or temp < 97.0:
            sirs_count += 1
        if rr > 20:
            sirs_count += 1
        if wbc > 12000 or wbc < 4000:
            sirs_count += 1
        
        return sirs_count
    
    def calculate_qsofa(self, vitals):
        """Calculate qSOFA score"""
        rr = float(vitals.get('respirationRate', vitals.get('Resp', 16)))
        sbp = float(vitals.get('systolicBP', vitals.get('SBP', 120)))
        gcs = float(vitals.get('gcs', vitals.get('GCS', 15)))
        
        qsofa = 0
        if rr >= 22:
            qsofa += 1
        if sbp <= 100:
            qsofa += 1
        if gcs < 15:
            qsofa += 1
        
        return qsofa
    
    def emergency_sepsis_check(self, vitals):
        """Hardcoded emergency sepsis detection with more criteria"""
        hr = float(vitals.get('heartRate', vitals.get('HR', 80)))
        temp = float(vitals.get('temperature', vitals.get('Temp', 98.6)))
        sbp = float(vitals.get('systolicBP', vitals.get('SBP', 120)))
        spo2 = float(vitals.get('spo2', vitals.get('O2Sat', 98)))
        rr = float(vitals.get('respirationRate', vitals.get('Resp', 16)))
        wbc = float(vitals.get('wbc', vitals.get('WBC', 7500)))
        lactate = float(vitals.get('lactate', vitals.get('Lactate', 1.0)))
        age = float(vitals.get('age', vitals.get('Age', 50)))
        rbc = float(vitals.get('rbc', vitals.get('RBC', 4.8)))
        hgb = float(vitals.get('hemoglobin', vitals.get('Hgb', 13.5)))
        plt = float(vitals.get('platelets', vitals.get('Plt', 220000)))
        
        sirs_count = self.calculate_sirs(vitals)
        qsofa = self.calculate_qsofa(vitals)
        
        critical_count = 0
        if hr > 110: critical_count += 1
        if temp > 102.0: critical_count += 1
        if temp < 96.0: critical_count += 1
        if sbp < 90: critical_count += 1
        if spo2 < 90: critical_count += 1
        if lactate > 2.5: critical_count += 1
        if age > 70: critical_count += 1
        if rbc < 3.5: critical_count += 1
        if hgb < 10: critical_count += 1
        if plt < 100000: critical_count += 1
        
        # Sepsis detection with enhanced criteria
        if sirs_count >= 3 and critical_count >= 2:
            return {'is_sepsis': True, 'severity': 'CRITICAL', 'risk': 95, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
        elif sirs_count >= 2 and critical_count >= 1:
            return {'is_sepsis': True, 'severity': 'HIGH', 'risk': 80, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
        elif sirs_count >= 2:
            return {'is_sepsis': True, 'severity': 'MEDIUM', 'risk': 60, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
        elif sirs_count >= 1 and critical_count >= 1:
            return {'is_sepsis': True, 'severity': 'MEDIUM', 'risk': 50, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
        elif qsofa >= 2:
            return {'is_sepsis': True, 'severity': 'HIGH', 'risk': 70, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
        else:
            return {'is_sepsis': False, 'severity': 'LOW', 'risk': 10, 
                    'sirs_count': sirs_count, 'qsofa': qsofa}
    
    def predict(self, vitals):
        """Make prediction using trained model with all features"""
        try:
            # Calculate scores
            sirs_count = self.calculate_sirs(vitals)
            qsofa = self.calculate_qsofa(vitals)
            
            # Emergency check
            emergency = self.emergency_sepsis_check(vitals)
            
            # Try model prediction
            if self.model is not None and self.scaler is not None:
                features = self.extract_features(vitals)
                features_scaled = self.scaler.transform(features)
                
                # Get prediction
                sepsis_prob = float(self.model.predict_proba(features_scaled)[0][1])
                risk_score = int(sepsis_prob * 100)
                
                # Boost risk based on SIRS and qSOFA
                if sirs_count >= 2:
                    risk_score = min(100, int(risk_score * 1.3))
                if sirs_count >= 3:
                    risk_score = min(100, int(risk_score * 1.6))
                if sirs_count >= 4:
                    risk_score = min(100, int(risk_score * 2.0))
                if qsofa >= 2:
                    risk_score = min(100, int(risk_score * 1.5))
                
                prediction = 1 if sepsis_prob >= self.optimal_threshold else 0
            else:
                risk_score, sepsis_prob = self.enhanced_fallback(vitals, sirs_count, qsofa)
                prediction = 1 if risk_score > 45 else 0
            
            # Use emergency risk if higher
            if emergency['is_sepsis'] and emergency['risk'] > risk_score:
                risk_score = emergency['risk']
                sepsis_prob = risk_score / 100
            
            # Ensure minimum risk based on scores
            if sirs_count >= 3 and risk_score < 70:
                risk_score = 70 + (sirs_count - 3) * 5
            if sirs_count >= 4 and risk_score < 85:
                risk_score = 85
            if qsofa >= 2 and risk_score < 60:
                risk_score = 60
            
            risk_score = min(100, max(0, risk_score))
            
            # Status determination
            if risk_score >= 75:
                status = 'CRITICAL'
                risk_level = 'CRITICAL'
            elif risk_score >= 60:
                status = 'WARNING'
                risk_level = 'HIGH'
            elif risk_score >= 45:
                status = 'WARNING'
                risk_level = 'MEDIUM'
            elif risk_score >= 30:
                status = 'MONITOR'
                risk_level = 'MEDIUM'
            else:
                status = 'STABLE'
                risk_level = 'LOW'
            
            # Build recommendations
            recommendations = self.build_recommendations(vitals, risk_score, sirs_count, qsofa)
            
            # Top factors
            top_factors = self.get_top_factors(vitals, risk_score)
            
            # Time to deterioration
            time_to_deterioration = self.calculate_time_to_deterioration(risk_score, sirs_count, qsofa)
            
            # Alert
            alert_generated = risk_score >= 60 or emergency['is_sepsis']
            alert_message = None
            if risk_score >= 75:
                alert_message = f'🚨 CRITICAL: {risk_score}% sepsis risk - IMMEDIATE ACTION REQUIRED'
            elif risk_score >= 60:
                alert_message = f'⚠️ HIGH: {risk_score}% sepsis risk - Urgent assessment needed'
            elif risk_score >= 45:
                alert_message = f'⚠️ MEDIUM: {risk_score}% sepsis risk - Monitor closely'
            
            return {
                'sepsisProbability': sepsis_prob,
                'riskScore': risk_score,
                'confidence': min(98, int(80 + (sepsis_prob * 18))),
                'status': status,
                'sirsCount': sirs_count,
                'qsofaScore': qsofa,
                'featureImportance': {},
                'topFactors': top_factors,
                'recommendations': recommendations,
                'timeToDeterioration': time_to_deterioration,
                'alertGenerated': alert_generated,
                'alertMessage': alert_message,
                'modelVersion': 'v3.0-enhanced-rbc-wbc',
                'riskLevel': risk_level,
                'explanation': f'Risk score {risk_score}% based on {sirs_count} SIRS criteria, qSOFA={qsofa}',
                'prediction': 1 if risk_score >= 50 else 0,
                'wbc': float(vitals.get('wbc', vitals.get('WBC', 7500))),
                'rbc': float(vitals.get('rbc', vitals.get('RBC', 4.8)))
            }
            
        except Exception as e:
            print(f"⚠️ Prediction error: {e}", file=sys.stderr)
            return self.fallback_prediction(vitals)
    
    def build_recommendations(self, vitals, risk_score, sirs_count, qsofa):
        """Build clinical recommendations based on risk"""
        recommendations = []
        
        if risk_score >= 75:
            recommendations.append('🚨 CRITICAL: IMMEDIATE PHYSICIAN REVIEW REQUIRED')
            recommendations.append('📋 STAT Labs: CBC with differential, Blood Culture, Lactate, CRP, PCT')
            recommendations.append('💉 START SEPSIS PROTOCOL IMMEDIATELY')
            recommendations.append('🆘 Consider ICU Transfer')
            recommendations.append('⏰ Monitor vitals every 5-10 minutes')
            recommendations.append('💊 Administer broad-spectrum antibiotics STAT')
        
        if risk_score >= 60:
            recommendations.append('⚠️ HIGH RISK: Urgent clinical assessment needed')
            recommendations.append('⏰ Monitor vitals every 15 minutes')
            recommendations.append('🧪 Repeat lab work in 1-2 hours')
            recommendations.append('💉 Consider IV fluid bolus if hypotensive')
        
        if risk_score >= 45:
            recommendations.append('📊 Monitor vitals every 30 minutes')
            recommendations.append('🧪 Repeat lab work in 2-4 hours')
        
        if float(vitals.get('temperature', vitals.get('Temp', 98.6))) >= 100.4:
            recommendations.append('🌡️ Monitor temperature closely')
        if float(vitals.get('spo2', vitals.get('O2Sat', 98))) < 92:
            recommendations.append('💨 Consider oxygen supplementation')
        if float(vitals.get('heartRate', vitals.get('HR', 80))) > 100:
            recommendations.append('❤️ Check for signs of tachycardia')
        if float(vitals.get('systolicBP', vitals.get('SBP', 120))) < 90:
            recommendations.append('📊 Monitor blood pressure closely')
            recommendations.append('💉 Consider IV fluid bolus')
        if sirs_count >= 2:
            recommendations.append(f'⚠️ {sirs_count} SIRS criteria met - Monitor for sepsis')
        if qsofa >= 2:
            recommendations.append(f'⚠️ qSOFA score {qsofa} - High risk of sepsis')
        
        return recommendations
    
    def get_top_factors(self, vitals, risk_score):
        """Get top factors contributing to risk"""
        top_factors = []
        
        hr = float(vitals.get('heartRate', vitals.get('HR', 80)))
        temp = float(vitals.get('temperature', vitals.get('Temp', 98.6)))
        sbp = float(vitals.get('systolicBP', vitals.get('SBP', 120)))
        spo2 = float(vitals.get('spo2', vitals.get('O2Sat', 98)))
        rr = float(vitals.get('respirationRate', vitals.get('Resp', 16)))
        wbc = float(vitals.get('wbc', vitals.get('WBC', 7500)))
        rbc = float(vitals.get('rbc', vitals.get('RBC', 4.8)))
        hgb = float(vitals.get('hemoglobin', vitals.get('Hgb', 13.5)))
        plt = float(vitals.get('platelets', vitals.get('Plt', 220000)))
        lactate = float(vitals.get('lactate', vitals.get('Lactate', 1.0)))
        age = float(vitals.get('age', vitals.get('Age', 50)))
        
        # Heart Rate
        if hr > 130:
            top_factors.append({'feature': 'Heart Rate', 'impact': 30, 'direction': 'positive'})
        elif hr > 110:
            top_factors.append({'feature': 'Heart Rate', 'impact': 22, 'direction': 'positive'})
        elif hr > 90:
            top_factors.append({'feature': 'Heart Rate', 'impact': 14, 'direction': 'positive'})
        
        # Temperature
        if temp >= 103.0:
            top_factors.append({'feature': 'Temperature', 'impact': 35, 'direction': 'positive'})
        elif temp >= 102.0:
            top_factors.append({'feature': 'Temperature', 'impact': 28, 'direction': 'positive'})
        elif temp >= 100.4:
            top_factors.append({'feature': 'Temperature', 'impact': 20, 'direction': 'positive'})
        elif temp < 96.0:
            top_factors.append({'feature': 'Temperature (Low)', 'impact': 30, 'direction': 'negative'})
        elif temp < 97.0:
            top_factors.append({'feature': 'Temperature (Low)', 'impact': 20, 'direction': 'negative'})
        
        # Blood Pressure
        if sbp < 70:
            top_factors.append({'feature': 'Blood Pressure', 'impact': 35, 'direction': 'negative'})
        elif sbp < 80:
            top_factors.append({'feature': 'Blood Pressure', 'impact': 28, 'direction': 'negative'})
        elif sbp < 90:
            top_factors.append({'feature': 'Blood Pressure', 'impact': 20, 'direction': 'negative'})
        
        # SpO2
        if spo2 < 80:
            top_factors.append({'feature': 'SpO2', 'impact': 35, 'direction': 'negative'})
        elif spo2 < 85:
            top_factors.append({'feature': 'SpO2', 'impact': 28, 'direction': 'negative'})
        elif spo2 < 90:
            top_factors.append({'feature': 'SpO2', 'impact': 18, 'direction': 'negative'})
        elif spo2 < 92:
            top_factors.append({'feature': 'SpO2', 'impact': 12, 'direction': 'negative'})
        
        # Respiratory Rate
        if rr > 30:
            top_factors.append({'feature': 'Respiration', 'impact': 28, 'direction': 'positive'})
        elif rr > 28:
            top_factors.append({'feature': 'Respiration', 'impact': 22, 'direction': 'positive'})
        elif rr > 24:
            top_factors.append({'feature': 'Respiration', 'impact': 16, 'direction': 'positive'})
        elif rr > 20:
            top_factors.append({'feature': 'Respiration', 'impact': 10, 'direction': 'positive'})
        
        # WBC
        if wbc > 20000:
            top_factors.append({'feature': 'WBC', 'impact': 25, 'direction': 'positive'})
        elif wbc > 15000:
            top_factors.append({'feature': 'WBC', 'impact': 18, 'direction': 'positive'})
        elif wbc > 12000:
            top_factors.append({'feature': 'WBC', 'impact': 12, 'direction': 'positive'})
        elif wbc < 3000:
            top_factors.append({'feature': 'WBC (Low)', 'impact': 22, 'direction': 'negative'})
        elif wbc < 4000:
            top_factors.append({'feature': 'WBC (Low)', 'impact': 15, 'direction': 'negative'})
        
        # RBC
        if rbc < 3.0:
            top_factors.append({'feature': 'RBC', 'impact': 20, 'direction': 'negative'})
        elif rbc < 3.5:
            top_factors.append({'feature': 'RBC', 'impact': 14, 'direction': 'negative'})
        elif rbc < 4.0:
            top_factors.append({'feature': 'RBC', 'impact': 8, 'direction': 'negative'})
        
        # Hemoglobin
        if hgb < 8:
            top_factors.append({'feature': 'Hemoglobin', 'impact': 22, 'direction': 'negative'})
        elif hgb < 10:
            top_factors.append({'feature': 'Hemoglobin', 'impact': 15, 'direction': 'negative'})
        elif hgb < 11:
            top_factors.append({'feature': 'Hemoglobin', 'impact': 8, 'direction': 'negative'})
        
        # Platelets
        if plt < 50000:
            top_factors.append({'feature': 'Platelets', 'impact': 20, 'direction': 'negative'})
        elif plt < 100000:
            top_factors.append({'feature': 'Platelets', 'impact': 12, 'direction': 'negative'})
        elif plt < 150000:
            top_factors.append({'feature': 'Platelets', 'impact': 6, 'direction': 'negative'})
        
        # Lactate
        if lactate > 4.0:
            top_factors.append({'feature': 'Lactate', 'impact': 25, 'direction': 'positive'})
        elif lactate > 3.0:
            top_factors.append({'feature': 'Lactate', 'impact': 18, 'direction': 'positive'})
        elif lactate > 2.5:
            top_factors.append({'feature': 'Lactate', 'impact': 12, 'direction': 'positive'})
        elif lactate > 2.0:
            top_factors.append({'feature': 'Lactate', 'impact': 8, 'direction': 'positive'})
        
        # Age
        if age > 80:
            top_factors.append({'feature': 'Age', 'impact': 18, 'direction': 'positive'})
        elif age > 70:
            top_factors.append({'feature': 'Age', 'impact': 12, 'direction': 'positive'})
        elif age > 65:
            top_factors.append({'feature': 'Age', 'impact': 8, 'direction': 'positive'})
        
        # Sort and limit
        top_factors.sort(key=lambda x: x['impact'], reverse=True)
        top_factors = top_factors[:5]
        
        if not top_factors:
            top_factors.append({'feature': 'All vitals normal', 'impact': 5, 'direction': 'positive'})
        
        return top_factors
    
    def calculate_time_to_deterioration(self, risk_score, sirs_count, qsofa):
        """Calculate estimated time to deterioration in hours"""
        time = 24
        if risk_score >= 75:
            time = 2
        elif risk_score >= 65:
            time = 4
        elif risk_score >= 55:
            time = 8
        elif risk_score >= 45:
            time = 12
        elif risk_score >= 30:
            time = 18
        
        # Adjust for SIRS
        if sirs_count >= 4:
            time = max(1, time - 4)
        elif sirs_count >= 3:
            time = max(2, time - 2)
        
        # Adjust for qSOFA
        if qsofa >= 2:
            time = max(1, time - 3)
        
        return max(1, time)
    
    def enhanced_fallback(self, vitals, sirs_count, qsofa):
        """Enhanced fallback with all features"""
        hr = float(vitals.get('heartRate', vitals.get('HR', 80)))
        temp = float(vitals.get('temperature', vitals.get('Temp', 98.6)))
        sbp = float(vitals.get('systolicBP', vitals.get('SBP', 120)))
        spo2 = float(vitals.get('spo2', vitals.get('O2Sat', 98)))
        rr = float(vitals.get('respirationRate', vitals.get('Resp', 16)))
        age = float(vitals.get('age', vitals.get('Age', 50)))
        wbc = float(vitals.get('wbc', vitals.get('WBC', 7500)))
        rbc = float(vitals.get('rbc', vitals.get('RBC', 4.8)))
        hgb = float(vitals.get('hemoglobin', vitals.get('Hgb', 13.5)))
        plt = float(vitals.get('platelets', vitals.get('Plt', 220000)))
        lactate = float(vitals.get('lactate', vitals.get('Lactate', 1.0)))
        creatinine = float(vitals.get('creatinine', vitals.get('Creatinine', 1.0)))
        
        risk = 0
        
        # HR
        if hr > 130: risk += 30
        elif hr > 110: risk += 22
        elif hr > 90: risk += 14
        elif hr < 50: risk += 18
        
        # Temperature
        if temp >= 103.0: risk += 35
        elif temp >= 102.0: risk += 28
        elif temp >= 100.4: risk += 20
        elif temp < 96.0: risk += 30
        elif temp < 97.0: risk += 20
        
        # SBP
        if sbp < 70: risk += 35
        elif sbp < 80: risk += 28
        elif sbp < 90: risk += 20
        elif sbp < 100: risk += 12
        
        # SpO2
        if spo2 < 80: risk += 35
        elif spo2 < 85: risk += 28
        elif spo2 < 88: risk += 20
        elif spo2 < 90: risk += 15
        elif spo2 < 92: risk += 10
        
        # RR
        if rr > 30: risk += 28
        elif rr > 28: risk += 22
        elif rr > 24: risk += 16
        elif rr > 20: risk += 10
        elif rr < 10: risk += 18
        
        # WBC
        if wbc > 20000: risk += 25
        elif wbc > 15000: risk += 18
        elif wbc > 12000: risk += 12
        elif wbc < 3000: risk += 22
        elif wbc < 4000: risk += 15
        
        # RBC
        if rbc < 3.0: risk += 20
        elif rbc < 3.5: risk += 14
        elif rbc < 4.0: risk += 8
        
        # Hemoglobin
        if hgb < 8: risk += 22
        elif hgb < 10: risk += 15
        elif hgb < 11: risk += 8
        
        # Platelets
        if plt < 50000: risk += 20
        elif plt < 100000: risk += 12
        elif plt < 150000: risk += 6
        
        # Lactate
        if lactate > 4.0: risk += 25
        elif lactate > 3.0: risk += 18
        elif lactate > 2.5: risk += 12
        elif lactate > 2.0: risk += 8
        
        # Creatinine
        if creatinine > 3.0: risk += 25
        elif creatinine > 2.0: risk += 18
        elif creatinine > 1.5: risk += 12
        elif creatinine > 1.2: risk += 6
        
        # Age
        if age > 80: risk += 18
        elif age > 70: risk += 12
        elif age > 65: risk += 8
        
        # SIRS multiplier
        if sirs_count >= 4:
            risk = int(risk * 2.2)
        elif sirs_count >= 3:
            risk = int(risk * 1.8)
        elif sirs_count >= 2:
            risk = int(risk * 1.4)
        
        # qSOFA multiplier
        if qsofa >= 2:
            risk = int(risk * 1.5)
        elif qsofa >= 1:
            risk = int(risk * 1.2)
        
        if sirs_count >= 3 and risk < 70:
            risk = 70 + (sirs_count - 3) * 5
        if sirs_count >= 4 and risk < 85:
            risk = 85
        if qsofa >= 2 and risk < 60:
            risk = 60
        
        risk = min(100, max(0, risk))
        sepsis_prob = risk / 100
        
        return risk, sepsis_prob
    
    def fallback_prediction(self, vitals):
        """Fallback if model fails"""
        print("⚠️ Using fallback prediction", file=sys.stderr)
        
        sirs_count = self.calculate_sirs(vitals)
        qsofa = self.calculate_qsofa(vitals)
        risk_score, sepsis_prob = self.enhanced_fallback(vitals, sirs_count, qsofa)
        
        if risk_score >= 75:
            status = 'CRITICAL'
            risk_level = 'CRITICAL'
        elif risk_score >= 60:
            status = 'WARNING'
            risk_level = 'HIGH'
        elif risk_score >= 45:
            status = 'WARNING'
            risk_level = 'MEDIUM'
        elif risk_score >= 30:
            status = 'MONITOR'
            risk_level = 'MEDIUM'
        else:
            status = 'STABLE'
            risk_level = 'LOW'
        
        return {
            'sepsisProbability': sepsis_prob,
            'riskScore': risk_score,
            'confidence': 85,
            'status': status,
            'sirsCount': sirs_count,
            'qsofaScore': qsofa,
            'featureImportance': {},
            'topFactors': [],
            'recommendations': ['Manual review recommended'] if risk_score > 50 else [],
            'timeToDeterioration': 6 if risk_score > 70 else 12 if risk_score > 50 else 24,
            'alertGenerated': risk_score > 60,
            'alertMessage': f'Risk score: {risk_score}%' if risk_score > 45 else None,
            'modelVersion': 'fallback-v3.0-enhanced',
            'riskLevel': risk_level,
            'explanation': f'Risk calculated using enhanced fallback with {sirs_count} SIRS criteria, qSOFA={qsofa}',
            'prediction': 1 if risk_score > 50 else 0
        }


if __name__ == '__main__':
    try:
        input_data = sys.argv[1] if len(sys.argv) > 1 else '{}'
        vitals = json.loads(input_data)
        
        predictor = SepsisPredictorEnhanced()
        result = predictor.predict(vitals)
        
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            'error': str(e),
            'sepsisProbability': 0,
            'riskScore': 0,
            'confidence': 0,
            'status': 'STABLE',
            'sirsCount': 0,
            'qsofaScore': 0,
            'featureImportance': {},
            'topFactors': [],
            'recommendations': [],
            'timeToDeterioration': None,
            'alertGenerated': False,
            'alertMessage': None,
            'modelVersion': 'error',
            'riskLevel': 'LOW',
            'explanation': 'Error in prediction',
            'prediction': 0
        }
        print(json.dumps(error_result))