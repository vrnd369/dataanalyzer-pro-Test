from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime
import joblib
import json
from scipy import stats
import logging
from api.universal import universal_analytics
import math
import asyncio
from typing import Set

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

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except WebSocketDisconnect:
                self.disconnect(connection)

manager = ConnectionManager()

# Data Models
class DataField(BaseModel):
    name: str
    value: Union[float, str]
    type: str

class AnalysisRequest(BaseModel):
    data: List[DataField]
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

class TextRequest(BaseModel):
    texts: List[str]

# Analytics Engine
class AnalyticsEngine:
    def __init__(self):
        self.universal_analytics = universal_analytics

    def prepare_data(self, data: List[DataField]) -> Dict[str, Any]:
        """Convert data fields to appropriate format for analysis"""
        numeric_data = {}
        text_data = {}
        
        for field in data:
            if field.type == 'number':
                try:
                    numeric_data[field.name] = float(field.value)
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert {field.name} to number")
            else:
                text_data[field.name] = str(field.value)
        
        return {
            'numeric': numeric_data,
            'text': text_data
        }

    async def analyze_data(self, data: List[DataField], analysis_type: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Perform analysis based on data type and analysis type"""
        try:
            prepared_data = self.prepare_data(data)
            results = {}

            # Basic statistics for numeric data
            if prepared_data['numeric']:
                numeric_values = list(prepared_data['numeric'].values())
                results['statistics'] = {
                    'mean': float(np.mean(numeric_values)),
                    'median': float(np.median(numeric_values)),
                    'std': float(np.std(numeric_values)),
                    'min': float(np.min(numeric_values)),
                    'max': float(np.max(numeric_values))
                }

                # Perform specific analysis based on type
                if analysis_type == 'time_series':
                    results['time_series'] = await self.universal_analytics.advanced_time_series_analysis(
                        numeric_values,
                        parameters or {}
                    )
                elif analysis_type == 'anomaly':
                    results['anomalies'] = await self.universal_analytics.advanced_anomaly_detection(
                        numeric_values,
                        parameters or {}
                    )
                elif analysis_type == 'correlation':
                    results['correlation'] = await self.universal_analytics.advanced_correlation_analysis(
                        prepared_data['numeric']
                    )
                elif analysis_type == 'industry':
                    industry = (parameters or {}).get('industry', '').lower()
                    # Example: Custom logic for finance industry
                    if industry == 'finance':
                        results['industry_insights'] = {
                            'note': 'Finance industry: focus on revenue growth and risk management.',
                            'custom_metric': prepared_data['numeric'].get('revenue', 0) * 1.1  # Example calculation
                        }
                    elif industry == 'healthcare':
                        results['industry_insights'] = {
                            'note': 'Healthcare industry: patient satisfaction and compliance are key.',
                            'custom_metric': prepared_data['numeric'].get('customers', 0) * 0.8
                        }
                    else:
                        results['industry_insights'] = {
                            'note': f'No custom logic for industry: {industry}'
                        }

            # Text analysis if available
            if prepared_data['text']:
                results['text_analysis'] = {
                    'field_count': len(prepared_data['text']),
                    'fields': list(prepared_data['text'].keys())
                }

            return results

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

# Initialize analytics engine
analytics_engine = AnalyticsEngine()

# API Endpoints
@app.post("/api/analyze")
async def analyze_data(request: AnalysisRequest):
    """Analyze data with specified analysis type"""
    try:
        results = await analytics_engine.analyze_data(
            request.data,
            request.analysis_type,
            request.parameters
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast the message to all connected clients
            await manager.broadcast(f"Message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

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
        # Extract threshold from config if provided, otherwise use default
        threshold = request.config.get('threshold', 0.95) if hasattr(request, 'config') else 0.95
        
        # Validate data
        if not request.data or len(request.data) < 2:
            raise HTTPException(status_code=422, detail="Data must contain at least 2 points")
            
        # Check for invalid values
        if any(not isinstance(x, (int, float)) or math.isnan(x) or math.isinf(x) for x in request.data):
            raise HTTPException(status_code=422, detail="Data contains invalid values (NaN or infinite)")
            
        anomalies = await universal_analytics.advanced_anomaly_detection(
            request.data,
            {'threshold': threshold}
        )
        return {"anomalies": anomalies}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@app.post("/api/advanced/correlation")
async def analyze_correlation(request: CorrelationRequest):
    correlations = await universal_analytics.advanced_correlation_analysis(
        request.data
    )
    return correlations

@app.post("/api/advanced/forecast")
async def forecast(request: ForecastRequest):
    forecast = await universal_analytics.advanced_forecasting(
        request.data,
        request.config
    )
    return forecast

@app.post("/api/advanced/analyze")
async def analyze_time_series(request: TimeSeriesAnalysisRequest):
    """Perform advanced time series analysis"""
    try:
        results = await universal_analytics.advanced_time_series_analysis(
            request.data,
            request.config
        )
        return results
    except Exception as e:
        logger.error(f"Time series analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/summarize")
async def analyze_summarize(req: TextRequest):
    if not req.texts or not any(t.strip() for t in req.texts):
        return {"error": "No valid text provided for summarization."}
    
    try:
        # Simple extractive summarization for now
        text = req.texts[0]  # Take first text for now
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Calculate sentence scores based on word frequency
        word_freq = {}
        for sentence in sentences:
            for word in sentence.lower().split():
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Score sentences
        sentence_scores = []
        for sentence in sentences:
            score = sum(word_freq.get(word.lower(), 0) for word in sentence.split())
            sentence_scores.append((sentence, score))
        
        # Get top 3 sentences
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:3]
        summary = '. '.join(s[0] for s in sorted(top_sentences, key=lambda x: sentences.index(x[0])))
        
        return {
            "results": [summary],
            "stats": {
                "original_length": len(text.split()),
                "summary_length": len(summary.split()),
                "compression_ratio": len(summary.split()) / len(text.split())
            }
        }
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return {"error": f"Summarization failed: {str(e)}"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 