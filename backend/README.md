# Analytics Platform Backend

This is the backend service for the Unified Analytics Platform. It provides advanced analytics capabilities, including data analysis, predictions, and anomaly detection.

## Features

- Advanced data analysis with statistical calculations
- Time series predictions using machine learning
- Anomaly detection in time series data
- Industry-specific analytics models
- Real-time data processing
- RESTful API endpoints

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

The server will start at `http://localhost:8000`

## API Endpoints

### 1. Analyze Data
```http
POST /api/analyze
```
Analyzes data and returns insights.

Request body:
```json
{
    "data": [
        {
            "timestamp": "2024-01-01T00:00:00",
            "value": 100.5,
            "metric": "sales",
            "category": "retail"
        }
    ],
    "industry": "retail",
    "analysis_type": "trend",
    "parameters": {}
}
```

### 2. Predict Values
```http
POST /api/predict
```
Predicts future values based on historical data.

Request body:
```json
{
    "data": [100.5, 102.3, 101.8, 103.2],
    "horizon": 5,
    "confidence": 0.95
}
```

### 3. Detect Anomalies
```http
POST /api/detect-anomalies
```
Detects anomalies in time series data.

Request body:
```json
{
    "data": [100.5, 102.3, 101.8, 103.2],
    "threshold": 0.95
}
```

### 4. Health Check
```http
GET /api/health
```
Returns the health status of the API.

## Integration with Frontend

To integrate with the frontend React application:

1. Update the API base URL in your frontend configuration
2. Use the provided API endpoints in your frontend components
3. Handle the responses appropriately in your UI

Example frontend API call:
```typescript
const analyzeData = async (data: DataPoint[]) => {
    const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data,
            industry: 'retail',
            analysis_type: 'trend'
        })
    });
    return await response.json();
};
```

## Performance Optimization

The backend includes several performance optimizations:

1. Caching of trained models
2. Efficient data preprocessing
3. Parallel processing for large datasets
4. Optimized memory usage
5. Industry-specific model initialization

## Error Handling

The API includes comprehensive error handling:

1. Input validation
2. Data type checking
3. Error logging
4. Meaningful error messages
5. HTTP status codes

## Security

For production deployment:

1. Update CORS settings with specific origins
2. Implement authentication
3. Use HTTPS
4. Add rate limiting
5. Implement request validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 