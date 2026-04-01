import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

load_dotenv()

def test_db():
    print("Testing DB connection...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not set in env.")
        return
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"DB Connection Success: {result.fetchone()}")
    except Exception as e:
        print(f"DB Connection Failed: {e}")

def test_model():
    print("\nTesting Model loading...")
    try:
        from services.ml_service import get_model_and_schema
        model, schema = get_model_and_schema()
        print(f"Model and Schema loaded successfully.")
        print(f"Model type: {type(model)}")
    except Exception as e:
        print(f"Model loading failed: {e}")

if __name__ == "__main__":
    test_db()
    test_model()
