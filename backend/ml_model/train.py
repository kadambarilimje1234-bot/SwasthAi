#!/usr/bin/env python3
"""
SwasthAI Sepsis Prediction Model Training - ENHANCED VERSION
Includes WBC, RBC, and other clinical features
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, 
    roc_auc_score, roc_curve, precision_recall_curve,
    f1_score, recall_score, precision_score
)
from sklearn.utils import class_weight
import pickle
import os
import json
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("🧠 SwasthAI Sepsis Prediction Model Training - ENHANCED")
print("=" * 60)

# ============================================
# FEATURE DEFINITION
# ============================================
FEATURE_COLUMNS = [
    'HR',           # Heart Rate (bpm)
    'Temp',         # Temperature (°F)
    'SBP',          # Systolic Blood Pressure (mmHg)
    'DBP',          # Diastolic Blood Pressure (mmHg)
    'Resp',         # Respiratory Rate (/min)
    'O2Sat',        # Oxygen Saturation (%)
    'WBC',          # White Blood Cell Count (cells/µL)
    'RBC',          # Red Blood Cell Count (cells/µL)
    'Hgb',          # Hemoglobin (g/dL)
    'Hct',          # Hematocrit (%)
    'Plt',          # Platelet Count (cells/µL)
    'Lactate',      # Lactate (mmol/L)
    'Creatinine',   # Creatinine (mg/dL)
    'BUN',          # Blood Urea Nitrogen (mg/dL)
    'Glucose',      # Blood Glucose (mg/dL)
    'Age',          # Age (years)
    'Gender'        # Gender (0=Male, 1=Female)
]

TARGET_COLUMN = 'SepsisLabel'

# ============================================
# GENERATE SYNTHETIC DATASET
# ============================================
def generate_sepsis_dataset(n_samples=2000, seed=42):
    """Generate realistic synthetic dataset with sepsis cases"""
    np.random.seed(seed)
    
    # Normal patients (60%)
    n_normal = int(n_samples * 0.6)
    # Sepsis patients (40%)
    n_sepsis = n_samples - n_normal
    
    print(f"\n📊 Generating {n_samples} samples...")
    print(f"   Normal: {n_normal} ({n_normal/n_samples*100:.1f}%)")
    print(f"   Sepsis: {n_sepsis} ({n_sepsis/n_samples*100:.1f}%)")
    
    # ===== NORMAL PATIENTS =====
    normal_data = {
        'HR': np.random.normal(72, 10, n_normal),
        'Temp': np.random.normal(98.6, 0.5, n_normal),
        'SBP': np.random.normal(118, 12, n_normal),
        'DBP': np.random.normal(76, 8, n_normal),
        'Resp': np.random.normal(16, 2, n_normal),
        'O2Sat': np.random.normal(97.5, 1.5, n_normal),
        'WBC': np.random.normal(7500, 1500, n_normal),
        'RBC': np.random.normal(5.0, 0.4, n_normal),
        'Hgb': np.random.normal(14.0, 1.5, n_normal),
        'Hct': np.random.normal(42, 4, n_normal),
        'Plt': np.random.normal(250000, 50000, n_normal),
        'Lactate': np.random.exponential(0.8, n_normal),
        'Creatinine': np.random.normal(1.0, 0.2, n_normal),
        'BUN': np.random.normal(14, 4, n_normal),
        'Glucose': np.random.normal(100, 15, n_normal),
        'Age': np.random.normal(45, 18, n_normal),
        'Gender': np.random.binomial(1, 0.5, n_normal)
    }
    
    # ===== SEPSIS PATIENTS =====
    sepsis_data = {
        'HR': np.random.normal(115, 18, n_sepsis),
        'Temp': np.random.normal(101.5, 1.5, n_sepsis),
        'SBP': np.random.normal(92, 18, n_sepsis),
        'DBP': np.random.normal(58, 12, n_sepsis),
        'Resp': np.random.normal(24, 6, n_sepsis),
        'O2Sat': np.random.normal(90, 6, n_sepsis),
        'WBC': np.random.normal(14000, 5000, n_sepsis),
        'RBC': np.random.normal(4.0, 0.6, n_sepsis),  # Lower RBC in sepsis
        'Hgb': np.random.normal(11.0, 1.8, n_sepsis),  # Lower Hgb in sepsis
        'Hct': np.random.normal(33, 6, n_sepsis),      # Lower Hct in sepsis
        'Plt': np.random.normal(150000, 60000, n_sepsis),  # Lower platelets
        'Lactate': np.random.exponential(2.5, n_sepsis),   # Higher lactate
        'Creatinine': np.random.normal(1.8, 0.8, n_sepsis),  # Higher creatinine
        'BUN': np.random.normal(25, 12, n_sepsis),      # Higher BUN
        'Glucose': np.random.normal(130, 35, n_sepsis), # Higher glucose
        'Age': np.random.normal(58, 20, n_sepsis),      # Older
        'Gender': np.random.binomial(1, 0.5, n_sepsis)
    }
    
    # Combine
    df_normal = pd.DataFrame(normal_data)
    df_sepsis = pd.DataFrame(sepsis_data)
    
    # Add labels
    df_normal[TARGET_COLUMN] = 0
    df_sepsis[TARGET_COLUMN] = 1
    
    # Combine and shuffle
    df = pd.concat([df_normal, df_sepsis], ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    
    # Clean data (clip extreme values)
    for col in FEATURE_COLUMNS:
        if col in df.columns:
            lower = df[col].quantile(0.01)
            upper = df[col].quantile(0.99)
            df[col] = df[col].clip(lower, upper)
    
    return df

# ============================================
# LOAD OR GENERATE DATA
# ============================================
try:
    # Try to load from Excel
    df = pd.read_excel('sepsis_demo_dataset.xlsx', sheet_name='SepsisDataset')
    print(f"\n✅ Loaded dataset from Excel: {len(df)} rows")
    
    # Ensure all features exist
    missing_cols = set(FEATURE_COLUMNS) - set(df.columns)
    if missing_cols:
        print(f"⚠️ Missing columns: {missing_cols}")
        print("   Generating synthetic data for missing columns...")
        
        # Generate synthetic data for missing columns
        for col in missing_cols:
            if col == 'RBC':
                df[col] = np.random.normal(4.5, 0.5, len(df))
            elif col == 'Hgb':
                df[col] = np.random.normal(13, 1.5, len(df))
            elif col == 'Hct':
                df[col] = np.random.normal(40, 4, len(df))
            elif col == 'Plt':
                df[col] = np.random.normal(200000, 50000, len(df))
            elif col == 'Lactate':
                df[col] = np.random.exponential(1.0, len(df))
            elif col == 'Creatinine':
                df[col] = np.random.normal(1.2, 0.4, len(df))
            elif col == 'BUN':
                df[col] = np.random.normal(16, 5, len(df))
            elif col == 'Glucose':
                df[col] = np.random.normal(110, 20, len(df))
            elif col == 'DBP':
                df[col] = df['SBP'] * 0.6 + np.random.normal(0, 5, len(df))
            elif col == 'Gender':
                df[col] = np.random.binomial(1, 0.5, len(df))
    
except FileNotFoundError:
    print("\n⚠️ Excel file not found. Generating synthetic dataset...")
    df = generate_sepsis_dataset(n_samples=2000)

# ============================================
# PREPARE DATA
# ============================================
print(f"\n📊 Dataset shape: {df.shape}")
print(f"📊 Columns: {df.columns.tolist()}")

# Check target distribution
y = df[TARGET_COLUMN].values
print(f"\n🎯 Target Distribution:")
print(f"   No Sepsis (0): {np.sum(y == 0)} ({np.sum(y == 0)/len(y)*100:.1f}%)")
print(f"   Sepsis (1): {np.sum(y == 1)} ({np.sum(y == 1)/len(y)*100:.1f}%)")

# Prepare features
X = df[FEATURE_COLUMNS].values

# Compute class weights
class_weights = class_weight.compute_class_weight('balanced', classes=np.unique(y), y=y)
print(f"\n📊 Class Weights: {class_weights}")

# ============================================
# SPLIT DATA
# ============================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n📊 Training set: {len(X_train)} samples")
print(f"📊 Testing set: {len(X_test)} samples")

# ============================================
# SCALE FEATURES
# ============================================
scaler = RobustScaler()  # More robust to outliers
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ============================================
# TRAIN ENSEMBLE MODEL
# ============================================
print("\n🔄 Training ensemble model...")

# 1. Random Forest
rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=18,
    min_samples_split=3,
    min_samples_leaf=1,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)

# 2. Gradient Boosting
gb = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    random_state=42
)

# 3. Logistic Regression with balanced weights
lr = LogisticRegression(
    max_iter=1000,
    class_weight='balanced',
    random_state=42,
    C=1.0
)

# 4. SVM
svm = SVC(
    probability=True,
    class_weight='balanced',
    random_state=42,
    kernel='rbf',
    C=1.0,
    gamma='scale'
)

# Train individual models
print("\n📊 Training Random Forest...")
rf.fit(X_train_scaled, y_train)

print("📊 Training Gradient Boosting...")
gb.fit(X_train_scaled, y_train)

print("📊 Training Logistic Regression...")
lr.fit(X_train_scaled, y_train)

print("📊 Training SVM...")
svm.fit(X_train_scaled, y_train)

# ============================================
# ENSEMBLE MODEL (Voting Classifier)
# ============================================
ensemble = VotingClassifier(
    estimators=[
        ('rf', rf),
        ('gb', gb),
        ('lr', lr),
        ('svm', svm)
    ],
    voting='soft',
    weights=[1.5, 1.2, 0.8, 0.8]  # Weighted voting
)

print("\n🔄 Training ensemble model...")
ensemble.fit(X_train_scaled, y_train)

# ============================================
# EVALUATE MODELS
# ============================================
def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate model and return metrics"""
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    f1 = f1_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    
    cm = confusion_matrix(y_test, y_pred)
    
    return {
        'accuracy': accuracy,
        'roc_auc': roc_auc,
        'f1_score': f1,
        'recall': recall,
        'precision': precision,
        'confusion_matrix': cm,
        'y_pred': y_pred,
        'y_pred_proba': y_pred_proba
    }

print("\n" + "=" * 60)
print("📊 MODEL PERFORMANCE COMPARISON")
print("=" * 60)

models = {
    'Random Forest': rf,
    'Gradient Boosting': gb,
    'Logistic Regression': lr,
    'SVM': svm,
    'Ensemble': ensemble
}

results = {}
for name, model in models.items():
    results[name] = evaluate_model(model, X_test_scaled, y_test, name)
    print(f"\n{name}:")
    print(f"   Accuracy: {results[name]['accuracy']:.4f}")
    print(f"   ROC-AUC: {results[name]['roc_auc']:.4f}")
    print(f"   F1 Score: {results[name]['f1_score']:.4f}")
    print(f"   Recall: {results[name]['recall']:.4f}")
    print(f"   Precision: {results[name]['precision']:.4f}")
    cm = results[name]['confusion_matrix']
    print(f"   Confusion Matrix: [[{cm[0][0]}, {cm[0][1]}], [{cm[1][0]}, {cm[1][1]}]]")

# ============================================
# FIND OPTIMAL THRESHOLD
# ============================================
print("\n🔍 Finding optimal threshold...")

# Use ensemble for threshold optimization
y_pred_proba_ensemble = results['Ensemble']['y_pred_proba']

# Precision-Recall curve
precision, recall, thresholds = precision_recall_curve(y_test, y_pred_proba_ensemble)

# Find threshold that maximizes F1 score
f1_scores = 2 * (precision[:-1] * recall[:-1]) / (precision[:-1] + recall[:-1] + 1e-10)
optimal_idx = np.argmax(f1_scores)
optimal_threshold_f1 = thresholds[optimal_idx] if optimal_idx < len(thresholds) else 0.45

# Find threshold for 90% recall
recall_90_idx = np.where(recall[:-1] >= 0.90)[0]
if len(recall_90_idx) > 0:
    optimal_threshold_recall = thresholds[min(recall_90_idx[0], len(thresholds)-1)]
else:
    optimal_threshold_recall = 0.40

# Use the better threshold
optimal_threshold = (optimal_threshold_f1 + optimal_threshold_recall) / 2
optimal_threshold = max(0.35, min(0.55, optimal_threshold))

print(f"\n✅ Optimal Threshold (F1): {optimal_threshold_f1:.4f}")
print(f"✅ Optimal Threshold (90% Recall): {optimal_threshold_recall:.4f}")
print(f"✅ Final Optimal Threshold: {optimal_threshold:.4f}")

# ============================================
# FEATURE IMPORTANCE
# ============================================
feature_importance = dict(zip(FEATURE_COLUMNS, rf.feature_importances_))

print("\n📊 Feature Importance (Random Forest):")
for feat, imp in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
    print(f"   {feat}: {imp:.4f}")

# ============================================
# SAVE MODEL AND SCALER
# ============================================
model_dir = os.path.dirname(__file__)

print("\n💾 Saving model artifacts...")

# Save ensemble model
with open(os.path.join(model_dir, 'model_enhanced.pkl'), 'wb') as f:
    pickle.dump(ensemble, f)

# Save individual models (for backup)
with open(os.path.join(model_dir, 'model_rf.pkl'), 'wb') as f:
    pickle.dump(rf, f)

with open(os.path.join(model_dir, 'model_gb.pkl'), 'wb') as f:
    pickle.dump(gb, f)

# Save scaler
with open(os.path.join(model_dir, 'scaler_enhanced.pkl'), 'wb') as f:
    pickle.dump(scaler, f)

# Save feature columns
with open(os.path.join(model_dir, 'feature_columns.json'), 'w') as f:
    json.dump(FEATURE_COLUMNS, f, indent=2)

# ============================================
# SAVE METADATA
# ============================================
metadata = {
    'feature_columns': FEATURE_COLUMNS,
    'feature_names': FEATURE_COLUMNS,
    'accuracy': float(results['Ensemble']['accuracy']),
    'roc_auc': float(results['Ensemble']['roc_auc']),
    'f1_score': float(results['Ensemble']['f1_score']),
    'recall': float(results['Ensemble']['recall']),
    'precision': float(results['Ensemble']['precision']),
    'optimal_threshold': float(optimal_threshold),
    'feature_importance': feature_importance,
    'model_type': 'VotingClassifier (RF+GB+LR+SVM)',
    'n_estimators': 300,
    'max_depth': 18,
    'confusion_matrix': results['Ensemble']['confusion_matrix'].tolist(),
    'class_weights': class_weights.tolist(),
    'sample_count': len(df),
    'sepsis_rate': float(np.sum(y == 1) / len(y)),
    'model_version': 'v3.0-enhanced-rbc-wbc',
    'individual_model_results': {
        name: {
            'accuracy': results[name]['accuracy'],
            'roc_auc': results[name]['roc_auc'],
            'f1_score': results[name]['f1_score'],
            'recall': results[name]['recall'],
            'precision': results[name]['precision']
        }
        for name in models.keys()
    }
}

with open(os.path.join(model_dir, 'metadata_enhanced.json'), 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Model saved to: {model_dir}/model_enhanced.pkl")
print(f"✅ Scaler saved to: {model_dir}/scaler_enhanced.pkl")
print(f"✅ Metadata saved to: {model_dir}/metadata_enhanced.json")
print(f"✅ Feature columns saved to: {model_dir}/feature_columns.json")

print("\n" + "=" * 60)
print("🎉 TRAINING COMPLETE!")
print("=" * 60)