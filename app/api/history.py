from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Prediction

from api.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_history(db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    data = db.query(Prediction).filter(Prediction.username == username).all()
    return data
