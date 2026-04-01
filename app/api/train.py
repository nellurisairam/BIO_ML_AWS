from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from services import training_service
import pandas as pd
import io

router = APIRouter()

@router.post("/")
async def train_model(
    file: UploadFile = File(...),
    target_col: str = Body("Product_Titer_gL"),
    model_name: str = Body("model_custom.joblib"),
    schema_name: str = Body("feature_schema_custom.json")
):
    try:
        # 1. Load CSV
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # 2. Train
        result = training_service.train_new_model(
            df, target_col, model_name, schema_name
        )
        
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
