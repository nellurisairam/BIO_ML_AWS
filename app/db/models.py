import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from db.database import Base

class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True)
    email = Column(String)
    name = Column(String)
    password = Column(String)
    role = Column(String, default="user")
    roles = Column(String)  # JSON string
    approved = Column(Boolean, default=False)
    logged_in = Column(Boolean, default=False)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, ForeignKey("users.username"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    inputs = Column(String)   # JSON string
    result = Column(String)   # JSON string
    model_name = Column(String, default="Bioreactor_v1")

class Config(Base):
    __tablename__ = "config"

    key = Column(String, primary_key=True)
    value = Column(String) # JSON string

class AlertConfig(Base):
    __tablename__ = "alerts"

    username = Column(String, ForeignKey("users.username"), primary_key=True)
    email_enabled = Column(Boolean, default=False)
    target_email = Column(String)
    titer_threshold = Column(Float, default=5.0)
    condition = Column(String, default="above")
    smtp_server = Column(String)
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String)
    smtp_pass = Column(String)
