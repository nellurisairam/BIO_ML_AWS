import pandas as pd
import os
import sys
from pathlib import Path

# Setup path to include 'app' directory
app_dir = Path(__file__).resolve().parent.parent / "app"
sys.path.insert(0, str(app_dir))

from services.prediction_service import run_prediction

def test_model(model_name):
    print(f"\n--- Testing {model_name} ---")
    sample_path = app_dir / "sample_data" / "new_samples.csv"
    if not sample_path.exists():
        print(f"Error: Sample data not found at {sample_path}")
        return

    df = pd.read_csv(sample_path)
    try:
        result = run_prediction(df, model_name=model_name)
        print(f"SUCCESS: Predicted {result['count']} rows.")
        print(f"First 3: {result['results'][:3]}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_model("model_ridgecv.joblib")
    test_model("model_gbr.joblib")
    test_model("model_linear.joblib")
