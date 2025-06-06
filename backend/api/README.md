# Analytics Platform Backend API

This is the backend API for the Analytics Platform, providing various data analysis and machine learning capabilities.

## Features

- FastAPI-based REST API
- Regression analysis (simple, multiple, polynomial)
- Time series analysis
- Anomaly detection
- Predictive analytics
- Universal analytics integration

## Directory Structure

```
backend/
├── api/
│   ├── __init__.py
│   ├── main.py          # FastAPI app entry point
│   ├── universal.py     # UniversalAnalytics class
│   ├── regression.py    # Regression analysis module
│   ├── regression_analyzer.py  # Regression analyzer implementation
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Documentation
├── venv/                # Virtual environment
└── __pycache__/         # Python cache
```

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

3. Run the API:
```bash
uvicorn main:app --reload
```

## API Endpoints

### Basic Analysis
- `POST /api/analyze` - Analyze data and return insights
- `POST /api/predict` - Predict future values
- `POST /api/detect-anomalies` - Detect anomalies in data

### Advanced Analysis
- `POST /api/advanced/correlation` - Analyze correlation between multiple time series
- `POST /api/advanced/forecast` - Generate advanced forecasts
- `POST /api/advanced/analyze` - Perform advanced time series analysis

### Health Check
- `GET /api/health` - Check API health status

## Data Models

### DataPoint
```python
{
    "timestamp": datetime,
    "value": float,
    "metric": str,
    "category": Optional[str]
}
```

### AnalysisRequest
```python
{
    "data": List[DataPoint],
    "industry": str,
    "analysis_type": str,
    "parameters": Optional[Dict[str, Any]]
}
```

### PredictionRequest
```python
{
    "data": List[float],
    "horizon": int,
    "confidence": float
}
```

## Development

### Adding New Features
1. Create new modules in the `api` directory
2. Add new endpoints in `main.py`
3. Update requirements.txt if needed
4. Update documentation

### Testing
Run tests using pytest:
```bash
pytest
```

### Code Style
Follow PEP 8 guidelines and use type hints.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License 