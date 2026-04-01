from fastapi import APIRouter, HTTPException
from pathlib import Path
import os

router = APIRouter(prefix="/api/data", tags=["data"])

@router.get("/sample")
async def get_sample_data():
    """Returns the content of the primary sample dataset for immediate exploration."""
    # Construct absolute path to ensure accuracy across environments
    base_dir = Path(__file__).resolve().parent.parent
    sample_path = base_dir / "sample_data" / "bioreactor_ml_dataset.csv"
    
    print(f"DEBUG: Attempting to load sample data from: {sample_path}")
    
    if not sample_path.exists():
        # Fallback search if current pathing is tricky (sometimes happens in certain dev containers)
        print(f"DEBUG: {sample_path} NOT FOUND. Looking for alternative match...")
        alt_path = Path(os.getcwd()) / "app" / "sample_data" / "bioreactor_ml_dataset.csv"
        if alt_path.exists():
            sample_path = alt_path
            print(f"DEBUG: Found alternative match at: {sample_path}")
        else:
            raise HTTPException(status_code=404, detail=f"Sample dataset not found at {sample_path}")
        
    try:
        with open(sample_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"filename": "bioreactor_ml_dataset.csv", "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
