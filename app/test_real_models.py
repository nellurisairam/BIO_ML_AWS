import pandas as pd
import os
import sys

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from services.prediction_service import run_prediction

def test_real_prediction():
    print("--- Starting Real Model Verification ---")
    
    # 1. Load sample data
    sample_path = os.path.join(app_dir, "sample_data", "new_samples.csv")
    if not os.path.exists(sample_path):
        print(f"Error: Sample data not found at {sample_path}")
        return

    df = pd.read_csv(sample_path)
    print(f"Loaded sample data with {len(df)} rows.")

    # 2. Run prediction
    try:
        print("Running prediction with real model assets...")
        result = run_prediction(df)
        
        print("\n--- Prediction Results ---")
        print(f"Model Name: {result.get('model_name', 'GBR (Reference)')}")
        print(f"Prediction Count: {result['count']}")
        print(f"First 5 Predictions: {result['predictions'][:5]}")
        
        if result['count'] > 0:
            print("\nSUCCESS: Real model integration verified.")
        else:
            print("\nWARNING: Prediction count is zero.")
            
    except Exception as e:
        print(f"\nERROR during prediction: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_real_prediction()
