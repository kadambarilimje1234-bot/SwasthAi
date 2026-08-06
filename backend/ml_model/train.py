#!/usr/bin/env python3
"""
SwasthAI Sepsis Prediction Model Training
Uses sepsis_demo_dataset.xlsx for training
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
import pickle
import os
import json
import warnings
warnings.filterwarnings('ignore')

print("🔄 Loading dataset...")

# Load dataset
df = pd.read_excel('sepsis_demo_dataset.xlsx', sheet_name='SepsisDataset')

print(f"✅ Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
print(f"📊 Columns: {df.columns.tolist()}")

# Feature columns
feature_columns = ['HR', 'Temp', 'SBP', 'Resp', 'O2Sat', 'WBC', 'Age']
target_column = 'SepsisLabel'

# Prepare features and target
X = df[feature_columns].values
y = df[target_column].values

print(f"\n📊 Feature shape: {X.shape}")
print(f"🎯 Target distribution:")
print(f"   No Sepsis (0): {np.sum(y == 0)}")
print(f"   Sepsis (1): {np.sum(y == 1)}")
print(f"   Sepsis Rate: {np.sum(y == 1) / len(y) * 100:.2f}%")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n📊 Training set: {len(X_train)} samples")
print(f"📊 Testing set: {len(X_test)} samples")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Feature names for importance
feature_names = ['HeartRate', 'Temperature', 'SBP', 'Respiration', 'O2Sat', 'WBC', 'Age']

# Train Random Forest model
print("\n🔄 Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)

model.fit(X_train_scaled, y_train)

# Evaluate
y_pred = model.predict(X_test_scaled)
y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_pred_proba)

print(f"\n✅ Model Performance:")
print(f"   Accuracy: {accuracy:.4f}")
print(f"   ROC-AUC: {roc_auc:.4f}")
print(f"\n📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=['No Sepsis', 'Sepsis']))

# Feature importance
feature_importance = dict(zip(feature_names, model.feature_importances_))
print(f"\n📊 Feature Importance:")
for feat, imp in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
    print(f"   {feat}: {imp:.4f}")

# Save model and scaler
model_dir = os.path.dirname(__file__)
with open(os.path.join(model_dir, 'model.pkl'), 'wb') as f:
    pickle.dump(model, f)

with open(os.path.join(model_dir, 'scaler.pkl'), 'wb') as f:
    pickle.dump(scaler, f)

# Save feature names and metadata
metadata = {
    'feature_names': feature_names,
    'feature_columns': feature_columns,
    'accuracy': float(accuracy),
    'roc_auc': float(roc_auc),
    'feature_importance': feature_importance,
    'n_estimators': 150,
    'max_depth': 12,
    'model_type': 'RandomForestClassifier'
}

with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Model saved to: {model_dir}/model.pkl")
print(f"✅ Scaler saved to: {model_dir}/scaler.pkl")
print(f"✅ Metadata saved to: {model_dir}/metadata.json")

print("\n🎉 Training complete!")