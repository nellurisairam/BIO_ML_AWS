import sys
import os

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from db.database import engine, Base, logger
import db.models  # Ensure models are registered
from db.models import Config
from sqlalchemy.orm import Session
import json

def init_db():
    logger.info("Initializing database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        
        # Initialize default config if not present
        with Session(engine) as session:
            cookie_exists = session.query(Config).filter(Config.key == "cookie").first()
            if not cookie_exists:
                default_cookie = {
                    'expiry_days': 30,
                    'key': 'bn_key_v3_77',
                    'name': 'bn_auth_v3_77'
                }
                new_config = Config(key="cookie", value=json.dumps(default_cookie))
                session.add(new_config)
                session.commit()
                logger.info("Default cookie configuration initialized.")
        
        logger.info("Database initialization complete.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
