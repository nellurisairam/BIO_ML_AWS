import pandas as pd
import numpy as np
import json
import os
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV
from sklearn.metrics import r2_score
import logging

logger = logging.getLogger("BioNexus")

def train_new_model(df: pd.DataFrame, target_col: str, model_filename: str, schema_filename: str):
    try:
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in data.")
        
        # 1. Preprocess (Simplified version of the reference app's logic)
        df_clean = df.copy()
        df_clean.columns = df_clean.columns.str.strip()
        df_clean = df_clean.dropna(subset=[target_col])
        
        # Derived features as in reference
        if "Glucose_gL" in df_clean.columns:
            df_clean["Glucose_Consumption_Rate"] = df_clean["Glucose_gL"].diff().fillna(0)
        
        # Split features and target
        X = df_clean.drop(columns=[target_col])
        # Select only numeric features for this simple RidgeCV
        X = X.select_dtypes(include=[np.number])
        y = df_clean[target_col]
        
        # 2. Build Pipeline
        pipe = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('model', RidgeCV(alphas=np.logspace(-3, 3, 13), cv=5))
        ])
        
        pipe.fit(X, y)
        
        # 3. Save Artifacts
        base_dir = Path(__file__).resolve().parent.parent
        models_dir = base_dir / "models"
        models_dir.mkdir(exist_ok=True)
        
        model_path = models_dir / model_filename
        schema_path = models_dir / schema_filename
        
        joblib.dump(pipe, model_path)
        
        schema = {
            'target': target_col,
            'features': X.columns.tolist(),
            'dtypes': {c: str(X[c].dtype) for c in X.columns},
            'trained_rows': int(len(df_clean))
        }
        
        with open(schema_path, 'w') as f:
            json.dump(schema, f, indent=2)
            
        train_preds = pipe.predict(X)
        r2 = r2_score(y, train_preds)
        
        return {
            "success": True,
            "r2_score": float(r2),
            "model_path": str(model_path),
            "schema_path": str(schema_path)
        }
    except Exception as e:
        logger.error(f"Training error: {e}")
        return {"success": False, "error": str(e)}
