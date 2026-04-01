import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db, Base, engine
from sqlalchemy.orm import sessionmaker
import os

# Use a separate test database or mock everything
# For simplicity in this environment, I'll mock the external dependencies if possible
# or just run against a temporary sqlite db

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "BioNexus AWS API running"}

def test_auth_registration_and_login():
    # Test register
    reg_resp = client.post("/auth/register?username=testuser&password=password123")
    assert reg_resp.status_code == 200
    
    # Test login
    login_resp = client.post("/auth/login?username=testuser&password=password123")
    assert login_resp.status_code == 200
    assert login_resp.json() == {"message": "Login successful"}

def test_history():
    response = client.get("/history/testuser")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
