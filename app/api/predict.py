import tempfile
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Prediction
import pandas as pd
import json
from services.prediction_service import run_prediction
from services.alert_service import check_and_send_alerts
from utils.s3 import upload_file
from api.deps import get_current_user
import uuid

router = APIRouter()

@router.post("/")
async def predict(
    background_tasks: BackgroundTasks,
    model_name: str = "model_ridgecv.joblib",
    schema_name: str = "feature_schema.json",
    use_sample: bool = False,
    file: UploadFile = File(None), 
    db: Session = Depends(get_db),
    username: str = Depends(get_current_user)
):
    # Use cross-platform temporary file
    temp_path = None
    try:
        from pathlib import Path
        if use_sample:
            # Use local sample data
            base_dir = Path(__file__).resolve().parent.parent
            sample_path = base_dir / "sample_data" / "bioreactor_ml_dataset.csv"
            if not sample_path.exists():
                raise HTTPException(status_code=404, detail="Sample dataset not found on server")
            df = pd.read_csv(sample_path)
            temp_path = None # No temp file to clean up
        else:
            if not file:
                raise HTTPException(status_code=400, detail="No file uploaded and use_sample is false")
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
                content = await file.read()
                tmp.write(content)
                temp_path = tmp.name
            df = pd.read_csv(temp_path)
            
        result = run_prediction(df, model_name, schema_name)
        result["model_name"] = model_name

        # upload to S3 (non-blocking)
        if not use_sample and temp_path:
            s3_key = f"uploads/{uuid.uuid4()}.csv"
            # Define a helper to upload and then delete
            def upload_and_clean(path, key):
                try:
                    upload_file(path, key)
                finally:
                    if os.path.exists(path):
                        os.remove(path)
            background_tasks.add_task(upload_and_clean, temp_path, s3_key)
            temp_path = None # Prevent the finally block from deleting it here

        # Save to DB
        new_prediction = Prediction(
            username=username,
            inputs=json.dumps(df.to_dict(orient='records')),
            result=json.dumps(result["results"]),
            model_name=result["model_name"]
        )
        db.add(new_prediction)
        db.commit()

        # Check and send alerts (non-blocking)
        from services.alert_service import check_and_send_alerts_background
        background_tasks.add_task(check_and_send_alerts_background, username, result)

        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
