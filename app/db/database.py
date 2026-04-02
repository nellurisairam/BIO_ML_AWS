from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# Logging Configuration
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
LOG_DIR = BASE_DIR / "logs"
if not LOG_DIR.exists():
    LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "app.log"
logger = logging.getLogger("BioNexus")
logger.setLevel(logging.INFO)

if not logger.handlers:
    # 1MB per log file, keeping last 5
    handler = RotatingFileHandler(LOG_FILE, maxBytes=1024*1024, backupCount=5)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Also log to console for uvicorn visibility
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

logger.info("Logging initialized for BioNexus Backend.")

# Use provided Neon connection string as a fallback for the Render deployment
DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql://neondb_owner:npg_T0kLxlKt6ZDP@ep-divine-cake-am3nd1eo-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=1800
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
