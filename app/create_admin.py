import sys
import os

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from services.auth_service import create_user
from db.database import engine
from sqlalchemy.orm import Session

def create_admin_user():
    username = "admin"
    password = "admin123"
    print(f"Creating admin user: {username}...")
    try:
        with Session(engine) as session:
            create_user(
                session,
                username=username,
                password=password,
                email="admin@bionexus.ml",
                name="System Admin",
                role="admin",
                approved=True
            )
        print(f"Admin user '{username}' created and approved successfully.")
    except Exception as e:
        print(f"Error creating admin user: {e}")

if __name__ == "__main__":
    create_admin_user()
