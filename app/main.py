from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import psutil
import time
import json
import bcrypt
from pathlib import Path
from sqlalchemy.orm import Session
from db.database import get_db, LOG_FILE, engine, Base, logger
from db.models import User, Config, AlertConfig
from api import auth, predict, history, alert, train, data

app = FastAPI(title="BioNexus ML API (AWS Ready)")

# Root directory of the app
BASE_DIR = Path(__file__).resolve().parent

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard API Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(predict.router, prefix="/predict")
app.include_router(history.router, prefix="/history")
app.include_router(alert.router, prefix="/alert")
app.include_router(train.router, prefix="/train")
app.include_router(data.router)

@app.on_event("startup")
def startup_db_init():
    """Initializes the database schema and default records matching the reference blueprints."""
    logger.info("Initializing database schema on startup...")
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    try:
        # Default cookie config
        if not db.query(Config).filter(Config.key == "cookie").first():
            default_cookie = {
                'expiry_days': 30,
                'key': 'setup_key_v2_999',
                'name': 'bionexus_auth_v2_999'
            }
            db.add(Config(key="cookie", value=json.dumps(default_cookie)))
            logger.info("Default cookie configuration initialized.")

        # Default admin user
        if not db.query(User).filter(User.username == "admin").first():
            admin_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
            admin_user = User(
                username="admin",
                email="admin@example.com",
                name="System Admin",
                password=admin_hash,
                role="admin",
                roles=json.dumps(["admin", "user"]),
                approved=True
            )
            db.add(admin_user)
            logger.info("Default administrator 'admin' created (pass: admin123).")
        
        db.commit()
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Returns detailed system health as expected by the frontend."""
    # CPU and RAM
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    
    # DB Latency
    start_time = time.time()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        latency = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        logger.error(f"DB Health check failed: {e}")
        latency = -1
        
    # Models Count
    models_dir = BASE_DIR / "models"
    models_count = len(list(models_dir.glob("*.joblib"))) if models_dir.exists() else 0
    
    return {
        "status": "online",
        "cpu": cpu,
        "ram": ram,
        "db_latency": latency,
        "models_count": models_count
    }

@app.get("/api/logs")
def get_logs():
    """Returns the last 100 lines of the application log."""
    if not LOG_FILE.exists():
        return {"logs": "Log file not found."}
    
    try:
        with open(LOG_FILE, "r") as f:
            lines = f.readlines()
            return {"logs": "".join(lines[-100:])}
    except Exception as e:
        return {"logs": f"Error reading logs: {str(e)}"}

@app.delete("/api/logs")
def clear_logs():
    """Clears the application log."""
    if not LOG_FILE.exists():
        raise HTTPException(status_code=404, detail="Log file for BioNexus not found.")
    
    try:
        with open(LOG_FILE, "w") as f:
            f.write("")
        return {"message": "Logs cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount the frontend directory to serve static assets (React version in production)
frontend_path = BASE_DIR / "react-frontend" / "dist"
if not frontend_path.exists():
    frontend_path = BASE_DIR / "frontend"
    logger.info(f"Serving legacy frontend from {frontend_path}")
else:
    logger.info(f"Serving React frontend from {frontend_path}")

app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
