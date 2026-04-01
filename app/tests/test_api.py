import pytest
from fastapi.testclient import TestClient
import os
import sys

# Add 'app' directory to sys.path
app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from sqlalchemy.orm import sessionmaker
from main import app
from db.database import get_db, Base, engine

import io
import time
from sqlalchemy import inspect

# Use separate test database or mock if possible, but keep using engine for now
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Diagnostic: check tables at startup
print(f"DEBUG: Tables in engine: {inspect(engine).get_table_names()}")

client = TestClient(app)

# Use a unique username for each test run to avoid UniqueViolation
TEST_USER = f"user_{int(time.time())}"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "BioNexus AWS API running"}

def test_auth_registration_and_login():
    # Test register
    reg_resp = client.post("/auth/register", json={"username": TEST_USER, "password": "password123"})
    assert reg_resp.status_code == 200
    
    # Approve user
    app_resp = client.post(f"/auth/approve/{TEST_USER}", params={"approved": True})
    assert app_resp.status_code == 200

    # Test login
    login_resp = client.post("/auth/login", json={"username": TEST_USER, "password": "password123"})
    assert login_resp.status_code == 200
    assert login_resp.json()["message"] == "Login successful"

def test_predict():
    # Create a dummy CSV
    csv_content = "Glucose_gL,Dissolved_Oxygen_percent,Product_Titer_gL,Cell_Viability_percent,Agitation_RPM\n5.0,80.0,1.2,99.0,200\n4.5,75.0,1.5,98.5,210"
    file = io.BytesIO(csv_content.encode())
    
    # Force dynamic username via dependency
    from api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    
    response = client.post(
        "/predict/",
        files={"file": ("test.csv", file, "text/csv")}
    )
    assert response.status_code == 200
    assert "results" in response.json()
    assert response.json()["model_name"] == "model.joblib"

def test_history():
    response = client.get(f"/history/{TEST_USER}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Ensure our prediction from before is there
    assert len(response.json()) > 0
