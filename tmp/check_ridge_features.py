import joblib
import os
from pathlib import Path

app_dir = Path(__file__).resolve().parent.parent / "app"
model_path = app_dir / "models" / "model_ridgecv.joblib"

if os.path.exists(model_path):
    model = joblib.load(model_path)
    model_step = model.named_steps.get('model') or model.steps[-1][1]
    if hasattr(model_step, 'n_features_in_'):
        print(f"Model expects {model_step.n_features_in_} features.")
    else:
        print("n_features_in_ attribute not found.")
else:
    print("Model not found")
