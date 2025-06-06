import requests
import json
from datetime import datetime, timedelta
import numpy as np

# Base URL for the API
BASE_URL = "http://localhost:8002"

def test_health():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/api/health")
    print("\nHealth Check Response:")
    print(json.dumps(response.json(), indent=2))

def test_anomaly_detection():
    """Test the anomaly detection endpoint"""
    # Generate some sample data with a few anomalies
    np.random.seed(42)
    normal_data = np.random.normal(100, 10, 90)  # 90 normal points
    anomalies = [150, 30, 160]  # 3 obvious anomalies
    data = np.concatenate([normal_data, anomalies])
    
    # Prepare the request
    payload = {
        "data": data.tolist(),
        "threshold": 0.95
    }
    
    # Make the request
    response = requests.post(
        f"{BASE_URL}/api/detect-anomalies",
        json=payload
    )
    
    print("\nAnomaly Detection Response:")
    print(json.dumps(response.json(), indent=2))

def test_prediction():
    """Test the prediction endpoint"""
    # Generate some sample time series data
    np.random.seed(42)
    data = np.random.normal(100, 10, 50).tolist()
    
    # Prepare the request
    payload = {
        "data": data,
        "horizon": 5,
        "confidence": 0.95
    }
    
    # Make the request
    response = requests.post(
        f"{BASE_URL}/api/predict",
        json=payload
    )
    
    print("\nPrediction Response:")
    print(json.dumps(response.json(), indent=2))

def test_analysis():
    """Test the analysis endpoint"""
    # Generate sample data points
    data_points = []
    base_time = datetime.now()
    np.random.seed(42)
    
    for i in range(50):
        data_points.append({
            "timestamp": (base_time + timedelta(hours=i)).isoformat(),
            "value": float(np.random.normal(100, 10)),
            "metric": "sales",
            "category": "retail"
        })
    
    # Prepare the request
    payload = {
        "data": data_points,
        "industry": "retail",
        "analysis_type": "trend",
        "parameters": {}
    }
    
    # Make the request
    response = requests.post(
        f"{BASE_URL}/api/analyze",
        json=payload
    )
    
    print("\nAnalysis Response:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("Testing API endpoints...")
    
    try:
        test_health()
        test_anomaly_detection()
        test_prediction()
        test_analysis()
    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to the server. Make sure it's running on port 8002.")
    except Exception as e:
        print(f"\nError: {str(e)}") 