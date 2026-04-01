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

def check_db_config():
    username = "admin"
    print(f"Checking database for alert config of user: {username}...")
    
    try:
        with Session(engine) as session:
            # Check user first
            user = session.query(User).filter(User.username == username).first()
            if not user:
                print(f"[-] User '{username}' does not exist.")
            else:
                print(f"[+] User '{username}' exists. Role: {user.role}, Approved: {user.approved}")

            # Check alert config
            config = session.query(AlertConfig).filter(AlertConfig.username == username).first()
            if not config:
                print(f"[-] No alert configuration found for user '{username}'.")
            else:
                print(f"[+] Alert Configuration Found:")
                print(f"    - Email Enabled: {config.email_enabled}")
                print(f"    - Target Email: {config.target_email}")
                print(f"    - Titer Threshold: {config.titer_threshold}")
                print(f"    - Condition: {config.condition}")
                print(f"    - SMTP Server: {config.smtp_server}")
                print(f"    - SMTP Port: {config.smtp_port}")
                print(f"    - SMTP User: {config.smtp_user}")
                print(f"    - SMTP Pass Length: {len(config.smtp_pass) if config.smtp_pass else 0}")
                
            # Check for ALL users
            all_users = session.query(User).all()
            print(f"\n[+] Users in DB (Count: {len(all_users)}):")
            for u in all_users:
                print(f"    - {u.username} (Role: {u.role}, Approved: {u.approved})")

            all_configs = session.query(AlertConfig).all()
            print(f"\n[+] All Alert Configurations in DB (Count: {len(all_configs)}):")
            for c in all_configs:
                print(f"    - User: {c.username} | Email: {c.target_email} | Enabled: {c.email_enabled}")
            
    except Exception as e:
        print(f"[-] Error checking database: {e}")

if __name__ == "__main__":
    check_db_config()
