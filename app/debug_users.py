import os
import sys
import json
from dotenv import load_dotenv

# Setup path to include 'app' directory
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

load_dotenv()

from services.auth_service import list_users

def test_list_users():
    print("Testing list_users()...")
    try:
        users = list_users()
        print(f"Found {len(users)} users.")
        
        # This replicates the return in get_users()
        user_list = [{"username": u.username, "email": u.email, "approved": u.approved, "role": u.role} for u in users]
        print("Successfully serialized users to list of dicts.")
        print(user_list)
        
    except Exception as e:
        print(f"FAILED with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_list_users()
