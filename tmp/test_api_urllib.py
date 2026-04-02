import urllib.request
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def test_api_predict(model_name):
    print(f"\n--- Testing API Predict via urllib with {model_name} ---")
    url = f"{BASE_URL}/predict/?model_name={model_name}&use_sample=true"
    
    req = urllib.request.Request(url, method="POST")
    req.add_header("X-User", "testuser")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                print(f"SUCCESS: Predicted {data['count']} rows.")
                print(f"First 3: {data['results'][:3]}")
            else:
                print(f"ERROR {response.status}: {response.read().decode()}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api_predict("model_ridgecv.joblib")
    test_api_predict("model_gbr.joblib")
