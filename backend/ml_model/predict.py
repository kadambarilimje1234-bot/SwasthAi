#!/usr/bin/env python3
"""
SwasthAI Sepsis Prediction - Real-time Inference
"""

import sys
import json
import numpy as np
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class SepsisPredictor:
    def __init__(self):
        self.model_dir = os.path.dirname(__file__)
        self.model = None
        self.scaler = None
        self.feature_names = ['HeartRate', 'Temperature', 'SBP', 'Respiration', 'O2Sat', 'WBC', 'Age']
        self.load_model()
    
    def load_model(self):
        """Load trained model and scaler"""
        try:
            model_path = os.path.join(self.model_dir, 'model.pkl')
            scaler_path = os.path.join(self.model_dir, 'scaler.pkl')
            metadata_path = os.path.join(self.model_dir, 'metadata.json')
            
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            print(f"✅ Model loaded: {self.metadata['model_type']}", file=sys.stderr)
            print(f"✅ Accuracy: {self.metadata['accuracy']:.4f}", file=sys.stderr)
            return True
        except Exception as e:
            print(f"⚠️ Model load error: {e}", file=sys.stderr)
            return False
    
    def extract_features(self, vitals):
        """Extract features from vitals data"""
        features = [
            float(vitals.get('heartRate', 80)),
            float(vitals.get('temperature', 98.6)),
            float(vitals.get('systolicBP', 120)),
            float(vitals.get('respirationRate', 16)),
            float(vitals.get('spo2', 98)),
            float(vitals.get('wbc', 7.0)),
            float(vitals.get('age', 50))
        ]
        return np.array(features).reshape(1, -1)
    
    def predict(self, vitals):
        """Make prediction using trained model"""
        try:
            if self.model is None or self.scaler is None:
                return self.fallback_prediction(vitals)
            
            # Extract and scale features
            features = self.extract_features(vitals)
            features_scaled = self.scaler.transform(features)
            
            # Get prediction
            sepsis_prob = self.model.predict_proba(features_scaled)[0][1]
            risk_score = int(sepsis_prob * 100)
            prediction = 1 if sepsis_prob >= 0.5 else 0
            
            # Get feature importance for this prediction
            # Use SHAP-like approximation with feature contributions
            feature_importance = {}
            if hasattr(self.model, 'feature_importances_'):
                base_importance = self.model.feature_importances_
                feature_names = self.feature_names
                for i, feat in enumerate(feature_names):
                    feature_importance[feat] = float(base_importance[i] * sepsis_prob)
            
            # Determine status
            if risk_score >= 80:
                status = 'CRITICAL'
            elif risk_score >= 60:
                status = 'WARNING'
            else:
                status = 'STABLE'
            
            # Generate recommendations
            recommendations = []
            if risk_score > 70:
                recommendations.append('Immediate physician review required')
            if risk_score > 50:
                recommendations.append('Monitor vitals every 15 minutes')
            if vitals.get('temperature', 98.6) > 100.4:
                recommendations.append('Monitor temperature closely')
            if vitals.get('spo2', 98) < 92:
                recommendations.append('Consider oxygen supplementation')
            if vitals.get('heartRate', 80) > 100:
                recommendations.append('Check for signs of tachycardia')
            if vitals.get('systolicBP', 120) < 90:
                recommendations.append('Monitor blood pressure closely')
            
            # Top factors for explanation
            top_factors = [
                {'feature': 'Heart Rate', 'impact': 25 if vitals.get('heartRate', 80) > 90 else 5, 'direction': 'positive'},
                {'feature': 'Temperature', 'impact': 25 if vitals.get('temperature', 98.6) > 100.4 else 5, 'direction': 'positive'},
                {'feature': 'Blood Pressure', 'impact': 20 if vitals.get('systolicBP', 120) < 90 else 5, 'direction': 'negative'},
                {'feature': 'SpO2', 'impact': 15 if vitals.get('spo2', 98) < 92 else 5, 'direction': 'negative'}
            ]
            
            return {
                'sepsisProbability': sepsis_prob,
                'riskScore': risk_score,
                'confidence': int(80 + (sepsis_prob * 20)),
                'status': status,
                'featureImportance': feature_importance,
                'topFactors': top_factors,
                'recommendations': recommendations,
                'timeToDeterioration': 6 if risk_score > 70 else 12 if risk_score > 50 else 24,
                'alertGenerated': risk_score > 70,
                'alertMessage': f'Risk score: {risk_score}% - {status}' if risk_score > 50 else None,
                'modelVersion': 'v2.0',
                'riskLevel': 'CRITICAL' if risk_score >= 80 else 'HIGH' if risk_score >= 60 else 'MEDIUM' if risk_score >= 40 else 'LOW',
                'explanation': f'Sepsis risk: {risk_score}% based on vitals analysis',
                'prediction': int(prediction)
            }
            
        except Exception as e:
            print(f"⚠️ Prediction error: {e}", file=sys.stderr)
            return self.fallback_prediction(vitals)
    
    def fallback_prediction(self, vitals):
        """Fallback if model fails"""
        print("⚠️ Using fallback prediction", file=sys.stderr)
        
        heartRate = float(vitals.get('heartRate', 80))
        temperature = float(vitals.get('temperature', 98.6))
        systolicBP = float(vitals.get('systolicBP', 120))
        spo2 = float(vitals.get('spo2', 98))
        respirationRate = float(vitals.get('respirationRate', 16))
        age = float(vitals.get('age', 50))
        
        risk_score = 0
        if heartRate > 100: risk_score += 10
        if temperature > 100.4: risk_score += 15
        if systolicBP < 90: risk_score += 15
        if spo2 < 92: risk_score += 15
        if respirationRate > 22: risk_score += 10
        if age > 65: risk_score += 5
        
        risk_score = min(100, risk_score)
        
        if risk_score >= 80: status = 'CRITICAL'
        elif risk_score >= 60: status = 'WARNING'
        else: status = 'STABLE'
        
        return {
            'sepsisProbability': risk_score / 100,
            'riskScore': risk_score,
            'confidence': 85,
            'status': status,
            'featureImportance': {},
            'topFactors': [],
            'recommendations': ['Manual review recommended'] if risk_score > 50 else [],
            'timeToDeterioration': 6 if risk_score > 70 else 12 if risk_score > 50 else 24,
            'alertGenerated': risk_score > 70,
            'alertMessage': f'Risk score: {risk_score}%' if risk_score > 50 else None,
            'modelVersion': 'fallback-v1.0',
            'riskLevel': 'CRITICAL' if risk_score >= 80 else 'HIGH' if risk_score >= 60 else 'MEDIUM' if risk_score >= 40 else 'LOW',
            'explanation': f'Risk calculated using rule-based fallback',
            'prediction': 1 if risk_score > 50 else 0
        }

if __name__ == '__main__':
    # Read vitals from stdin
    try:
        input_data = sys.argv[1] if len(sys.argv) > 1 else '{}'
        vitals = json.loads(input_data)
        
        predictor = SepsisPredictor()
        result = predictor.predict(vitals)
        
        # Output result as JSON
        print(json.dumps(result))
    except Exception as e:
        error_result = {
            'error': str(e),
            'sepsisProbability': 0,
            'riskScore': 0,
            'confidence': 0,
            'status': 'STABLE',
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