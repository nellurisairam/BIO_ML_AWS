import joblib
import os
from pathlib import Path

app_dir = Path(__file__).resolve().parent.parent / "app"
model_path = app_dir / "models" / "model_gbr.joblib"

if os.path.exists(model_path):
    model = joblib.load(model_path)
    print(f"Model Type: {type(model)}")
    if hasattr(model, 'named_steps'):
        print(f"Pipeline steps: {model.named_steps.keys()}")
    else:
        print("Not a Pipeline")
else:
    print("Model not found")
