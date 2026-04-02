import joblib
import os
from pathlib import Path

app_dir = Path(__file__).resolve().parent.parent / "app"
model_path = app_dir / "models" / "model_gbr.joblib"

if os.path.exists(model_path):
    model = joblib.load(model_path)
    model_step = model.named_steps.get('model') or model.steps[-1][1]
    print(f"Model step name: {model_step}")
    print(f"Model step type: {type(model_step)}")
else:
    print("Model not found")
