import sys
import os

# Setup path to include 'app' directory
root_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(root_dir, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from db.database import engine
from db.models import AlertConfig, User
from sqlalchemy.orm import Session

def seed_alert_config():
    username = "admin" # Assuming user is admin
    target_email = "sairam95505@gmail.com"
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    smtp_user = "sairam95505@gmail.com"
    smtp_pass = "rgymlcravbemzpgw" # Spaces removed for standard app password format
    
    print(f"Manually seeding alert config for user: {username}...")
    
    try:
        with Session(engine) as session:
            # First ensure admin user exists
            user_exists = session.query(User).filter(User.username == username).first()
            if not user_exists:
                print(f"Error: User '{username}' does not exist in the database. Please run create_admin.py first.")
                return

            alert = session.query(AlertConfig).filter(AlertConfig.username == username).first()
            if not alert:
                alert = AlertConfig(username=username)
                session.add(alert)
            
            alert.email_enabled = True
            alert.target_email = target_email
            alert.titer_threshold = 5.0
            alert.condition = "above"
            alert.smtp_server = smtp_server
            alert.smtp_port = smtp_port
            alert.smtp_user = smtp_user
            alert.smtp_pass = smtp_pass
            
            session.commit()
            print("Successfully updated alert configuration in database.")
            
    except Exception as e:
        print(f"Error seeding alert config: {e}")

if __name__ == "__main__":
    seed_alert_config()
