import joblib
import json
import os
from utils.s3 import download_file

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")
SCHEMA_DEFAULT = os.path.join(MODEL_DIR, "feature_schema.json")

_models_cache = {}
_schemas_cache = {}

def get_model_and_schema(model_name: str = "model.joblib", schema_name: str = "feature_schema.json"):
    if not model_name.endswith(".joblib"):
        model_name += ".joblib"
    if not schema_name.endswith(".json"):
        schema_name += ".json"
    
    model_path = os.path.join(MODEL_DIR, model_name)
    schema_path = os.path.join(MODEL_DIR, schema_name)
    
            
    if model_path not in _models_cache:
        if not os.path.exists(model_path):
            # Try to see if wait, maybe fallback to model_gbr.joblib?
            raise FileNotFoundError(f"Model file not found at {model_path}")
        _models_cache[model_path] = joblib.load(model_path)
        
    if schema_path not in _schemas_cache:
        if not os.path.exists(schema_path):
            raise FileNotFoundError(f"Schema file not found at {schema_path}")
        with open(schema_path) as f:
            _schemas_cache[schema_path] = json.load(f)

    return _models_cache[model_path], _schemas_cache[schema_path]

