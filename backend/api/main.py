from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime
import joblib
import json
from scipy import stats
import logging
from .universal import UniversalAnalytics
import math
from .sentiment_analysis import analyze_sentiment, SentimentRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Analytics Platform Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class DataPoint(BaseModel):
    timestamp: datetime
    value: float
    metric: str
    category: Optional[str] = None

class AnalysisRequest(BaseModel):
    data: List[DataPoint]
    industry: str
    analysis_type: str
    parameters: Optional[Dict[str, Any]] = None

class PredictionRequest(BaseModel):
    data: List[float]
    horizon: int
    confidence: float

class AnomalyDetectionRequest(BaseModel):
    data: List[float]
    threshold: float = 0.95

class CorrelationRequest(BaseModel):
    data: List[List[float]]

class ForecastRequest(BaseModel):
    data: List[float]
    config: Dict[str, Any]

class TimeSeriesAnalysisRequest(BaseModel):
    data: List[float]
    config: Dict[str, Any]

# Analytics Engine
class AnalyticsEngine:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.initialize_models()

    def initialize_models(self):
        """Initialize ML models for different industries"""
        industries = ['finance', 'healthcare', 'retail', 'manufacturing', 'energy']
        for industry in industries:
            self.models[industry] = {
                'prediction': RandomForestRegressor(n_estimators=100),
                'anomaly': IsolationForest(contamination=0.1)
            }
            self.scalers[industry] = StandardScaler()

    def prepare_data(self, data: List[DataPoint]) -> pd.DataFrame:
        """Convert data points to DataFrame"""
        df = pd.DataFrame([{
            'timestamp': dp.timestamp,
            'value': dp.value,
            'metric': dp.metric,
            'category': dp.category
        } for dp in data])
        return df

    def calculate_statistics(self, data: List[float]) -> Dict[str, float]:
        """Calculate basic statistics"""
        return {
            'mean': float(np.mean(data)),
            'median': float(np.median(data)),
            'std': float(np.std(data)),
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'skewness': float(stats.skew(data)),
            'kurtosis': float(stats.kurtosis(data))
        }

    def detect_trends(self, data: List[float]) -> Dict[str, Any]:
        """Detect trends in time series data"""
        x = np.arange(len(data))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
        
        return {
            'trend': 'upward' if slope > 0 else 'downward',
            'strength': abs(r_value),
            'slope': float(slope),
            'p_value': float(p_value)
        }

    def predict_future_values(self, data: List[float], horizon: int, confidence: float) -> Dict[str, Any]:
        """Predict future values using ML model"""
        try:
            # Prepare data
            X = np.array(range(len(data))).reshape(-1, 1)
            y = np.array(data)
            
            # Train model
            model = RandomForestRegressor(n_estimators=100)
            model.fit(X, y)
            
            # Generate predictions
            future_X = np.array(range(len(data), len(data) + horizon)).reshape(-1, 1)
            predictions = model.predict(future_X)
            
            # Calculate confidence intervals
            std_dev = np.std(predictions)
            z_score = stats.norm.ppf((1 + confidence) / 2)
            margin = z_score * std_dev
            
            return {
                'predictions': predictions.tolist(),
                'confidence_intervals': {
                    'lower': (predictions - margin).tolist(),
                    'upper': (predictions + margin).tolist()
                },
                'confidence': confidence
            }
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            raise HTTPException(status_code=500, detail="Prediction failed")

    def detect_anomalies(self, data: List[float], threshold: float = 0.95) -> List[Dict[str, Any]]:
        """Detect anomalies in time series data"""
        try:
            # Prepare data
            X = np.array(data).reshape(-1, 1)
            
            # Train anomaly detection model
            model = IsolationForest(contamination=0.1)
            predictions = model.fit_predict(X)
            
            # Calculate anomaly scores
            scores = model.score_samples(X)
            threshold_score = np.percentile(scores, (1 - threshold) * 100)
            
            anomalies = []
            for i, (score, pred) in enumerate(zip(scores, predictions)):
                if score < threshold_score:
                    anomalies.append({
                        'index': i,
                        'value': float(data[i]),
                        'score': float(score),
                        'severity': float((threshold_score - score) / threshold_score)
                    })
            
            return anomalies
        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}")
            raise HTTPException(status_code=500, detail="Anomaly detection failed")

    def generate_insights(self, data: List[DataPoint], industry: str) -> List[Dict[str, Any]]:
        """Generate insights based on data analysis"""
        try:
            df = self.prepare_data(data)
            insights = []
            
            # Calculate basic statistics
            stats = self.calculate_statistics(df['value'].tolist())
            
            # Detect trends
            trends = self.detect_trends(df['value'].tolist())
            
            # Generate insights based on statistics and trends
            if trends['strength'] > 0.7:
                insights.append({
                    'type': 'trend',
                    'title': f"Strong {trends['trend']} trend detected",
                    'description': f"The data shows a strong {trends['trend']} trend with {trends['strength']:.2%} confidence",
                    'confidence': float(trends['strength']),
                    'impact': 'high' if abs(trends['slope']) > 0.5 else 'medium'
                })
            
            if stats['kurtosis'] > 2:
                insights.append({
                    'type': 'distribution',
                    'title': "Unusual data distribution detected",
                    'description': "The data shows significant outliers and non-normal distribution",
                    'confidence': 0.8,
                    'impact': 'medium'
                })
            
            return insights
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            raise HTTPException(status_code=500, detail="Insight generation failed")

# Initialize analytics engine
analytics_engine = AnalyticsEngine()

# API Endpoints
@app.post("/api/analyze")
async def analyze_data(request: AnalysisRequest):
    """Analyze data and return insights"""
    try:
        insights = analytics_engine.generate_insights(request.data, request.industry)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predict_values(request: PredictionRequest):
    """Predict future values"""
    try:
        predictions = analytics_engine.predict_future_values(
            request.data,
            request.horizon,
            request.confidence
        )
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect-anomalies")
async def detect_anomalies(request: AnomalyDetectionRequest):
    """Detect anomalies in data"""
    try:
        anomalies = analytics_engine.detect_anomalies(request.data, request.threshold)
        return {"anomalies": anomalies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/advanced/correlation")
async def analyze_correlation(request: CorrelationRequest):
    """Analyze correlation between multiple time series"""
    try:
        # Implementation for correlation analysis
        return {"message": "Correlation analysis endpoint"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/advanced/forecast")
async def forecast(request: ForecastRequest):
    """Generate advanced forecasts"""
    try:
        # Implementation for advanced forecasting
        return {"message": "Forecast endpoint"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/advanced/analyze")
async def analyze_time_series(request: TimeSeriesAnalysisRequest):
    """Perform advanced time series analysis"""
    try:
        # Initialize UniversalAnalytics if not already done
        if not hasattr(app.state, 'universal_analytics'):
            app.state.universal_analytics = UniversalAnalytics()
        
        # Perform the analysis
        results = await app.state.universal_analytics.advanced_time_series_analysis(
            request.data,
            request.config
        )
        return results
    except Exception as e:
        logger.error(f"Time series analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze", response_model=Dict)
async def analyze_sentiment_endpoint(request: SentimentRequest):
    """Analyze sentiment of provided texts"""
    try:
        return analyze_sentiment(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"} 