from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from db.database import get_db
from services.auth_service import authenticate_user, create_user, list_users, update_user_approval, delete_user as svc_delete_user, update_user_role

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        create_user(db, req.username, req.password, email=req.email, name=req.name)
        return {"message": "User created, awaiting admin approval"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials or user not approved")
    return {"message": "Login successful", "role": user.role}

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    try:
        users = list_users(db)
        return [{"username": u.username, "email": u.email, "approved": u.approved, "role": u.role} for u in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")

@router.post("/approve/{username}")
def approve_user(username: str, approved: bool = True, db: Session = Depends(get_db)):
    try:
        update_user_approval(db, username, approved)
        return {"message": f"User {username} {'approved' if approved else 'revoked'}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{username}")
def delete_user(username: str, db: Session = Depends(get_db)):
    try:
        svc_delete_user(db, username)
        return {"message": f"User {username} deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/role/{username}")
def update_role(username: str, role: str, db: Session = Depends(get_db)):
    try:
        update_user_role(db, username, role)
        return {"message": f"User {username} role updated to {role}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
