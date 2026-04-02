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
    from utils.s3 import download_file
    import os
    
    if not model_name.endswith(".joblib"):
        model_name += ".joblib"
    if not schema_name.endswith(".json"):
        schema_name += ".json"
    
    model_path = os.path.join(MODEL_DIR, model_name)
    schema_path = os.path.join(MODEL_DIR, schema_name)
    
    # ─── S3 Synchronization ───
    bucket = os.getenv("S3_BUCKET")
    if bucket:
        try:
            if not os.path.exists(model_path):
                from db.database import logger
                logger.info(f"Downloading model {model_name} from S3 bucket {bucket}...")
                # The 'models/' prefix inside S3 is common practice
                download_file(f"models/{model_name}", model_path)
            
            if not os.path.exists(schema_path):
                download_file(f"models/{schema_name}", schema_path)
        except Exception as e:
            from db.database import logger
            logger.error(f"S3 Download failed: {e}. Falling back to local/cached assets.")
            
    if model_path not in _models_cache:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file {model_name} not found locally or in S3.")
        _models_cache[model_path] = joblib.load(model_path)
        
    if schema_path not in _schemas_cache:
        if not os.path.exists(schema_path):
            raise FileNotFoundError(f"Schema file {schema_name} not found locally or in S3.")
        with open(schema_path) as f:
            _schemas_cache[schema_path] = json.load(f)

    return _models_cache[model_path], _schemas_cache[schema_path]
