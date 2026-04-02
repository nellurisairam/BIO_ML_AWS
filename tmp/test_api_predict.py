import requests
import os

BASE_URL = "http://127.0.0.1:8000"

def test_api_predict(model_name):
    print(f"\n--- Testing API Predict with {model_name} ---")
    url = f"{BASE_URL}/predict/?model_name={model_name}&use_sample=true"
    headers = {"X-User": "testuser"}
    try:
        response = requests.post(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: Predicted {data['count']} rows.")
            print(f"First 3: {data['results'][:3]}")
        else:
            print(f"ERROR {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Ensure server is running for this test to work
    # Since I don't know if it's running, I'll try to check psutil or something.
    import psutil
    server_running = any("uvicorn" in p.name().lower() for p in psutil.process_iter())
    if not server_running:
        print("Server not running. Skipping API test.")
    else:
        test_api_predict("model_ridgecv.joblib")
        test_api_predict("model_gbr.joblib")
