from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from db.database import get_db
from api.deps import get_current_user
from services.alert_service import get_alert_config, save_alert_config, test_smtp_connection

router = APIRouter()

class AlertConfigRequest(BaseModel):
    email_enabled: bool
    target_email: Optional[str] = None
    titer_threshold: float = 5.0
    condition: str = "above"
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None

@router.get("/")
def get_config(db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    from db.database import logger
    logger.info(f"Get alert configuration hit by {username}")
    config = get_alert_config(db, username)
    if not config:
        return {}
    return {
        "email_enabled": config.email_enabled,
        "target_email": config.target_email,
        "titer_threshold": config.titer_threshold,
        "condition": config.condition,
        "smtp_server": config.smtp_server,
        "smtp_port": config.smtp_port,
        "smtp_user": config.smtp_user,
        "smtp_pass": config.smtp_pass
    }

@router.post("/")
def save_config(req: AlertConfigRequest, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    from db.database import logger
    logger.info(f"Save config endpoint hit by {username}")
    try:
        config_data = req.dict()
        save_alert_config(db, username, config_data)
        return {"message": "Alert configuration saved"}
    except Exception as e:
        from db.database import logger
        logger.error(f"Error saving alert config for {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
@router.post("/test/")
def test_config(req: AlertConfigRequest, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    try:
        from services.alert_service import test_smtp_connection
        smtp_config = {
            "smtp_server": req.smtp_server,
            "smtp_port": req.smtp_port,
            "smtp_user": req.smtp_user,
            "smtp_pass": req.smtp_pass
        }
        success = test_smtp_connection(smtp_config, req.target_email)
        if success:
            return {"message": "Test email sent successfully"}
        else:
            raise Exception("SMTP Send failed. Check logs.")
    except Exception as e:
        from db.database import logger
        logger.error(f"Alert test failed for {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
