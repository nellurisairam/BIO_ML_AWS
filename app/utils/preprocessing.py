import pandas as pd
import numpy as np

def preprocess(df):
    df = df.copy()
    df.columns = df.columns.str.strip()
    df = df.dropna()

    # Derived features from reference app
    if "Glucose_gL" in df.columns:
        df["Glucose_Consumption_Rate"] = df["Glucose_gL"].diff().fillna(0)
    
    if "Dissolved_Oxygen_percent" in df.columns:
        df["DO_Change"] = df["Dissolved_Oxygen_percent"].diff().fillna(0)
        
    if "Product_Titer_gL" in df.columns and "Cell_Viability_percent" in df.columns:
        # Avoid division by zero
        df["Specific_Productivity"] = df["Product_Titer_gL"] / df["Cell_Viability_percent"].replace(0, np.nan)
        df["Specific_Productivity"] = df["Specific_Productivity"].fillna(0)

    # Simplified Agitation scaling if present
    if "Agitation_RPM" in df.columns:
        df["Agitation_Normalized"] = (df["Agitation_RPM"] - df["Agitation_RPM"].mean()) / (df["Agitation_RPM"].std() + 1e-9)

    # Flags
    if "Product_Titer_gL" in df.columns:
        df["High_Titer_Flag"] = (df["Product_Titer_gL"] > 1).astype(int)
    if "Cell_Viability_percent" in df.columns:
        df["Low_Viability_Flag"] = (df["Cell_Viability_percent"] < 98).astype(int)

    return df

def align_columns(df, schema):
    features = schema["features"]
    X = pd.DataFrame(index=df.index)
    
    # Fuzzy mapping for common bio-process parameters
    mapping = {
        "Time_hours": ["Time", "time", "Hour", "hour", "T"],
        "Temperature_C": ["Temp", "temp", "Temperature", "temperature"],
        "pH": ["ph", "PH"],
        "Dissolved_Oxygen_percent": ["DO", "do", "Oxygen", "oxygen", "Dissolved_Oxygen"],
        "Glucose_gL": ["Glucose", "glucose", "Gluc"],
        "Agitation_RPM": ["Agitation", "agitation", "RPM", "rpm", "Agit"],
        "Cell_Viability_percent": ["Viability", "viability", "Cell_V", "Cell_Viability"],
        "Product_Titer_gL": ["Titer", "titer", "Product", "Yield", "P"]
    }

    for col in features:
        if col in df.columns:
            X[col] = df[col]
            continue
        
        # Try fuzzy match
        found = False
        if col in mapping:
            for alias in mapping[col]:
                if alias in df.columns:
                    X[col] = df[alias]
                    found = True
                    break
        
        if not found:
            X[col] = 0
            
    return X[features], {}
