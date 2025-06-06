"""
Universal Analytics Module
Advanced analytics capabilities for the Unified Analytics Platform
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import logging
from scipy import stats
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb
import lightgbm as lgb
from prophet import Prophet
import joblib
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversalAnalytics:
    """Universal analytics engine with advanced capabilities"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.initialize_models()
        
    def initialize_models(self):
        """Initialize ML models for different analytics tasks"""
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=100),
            'xgboost': xgb.XGBRegressor(n_estimators=100, learning_rate=0.1),
            'lightgbm': lgb.LGBMRegressor(n_estimators=100, learning_rate=0.1),
            'prophet': Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True
            )
        }
        
        self.scalers = {
            'standard': StandardScaler()
        }
    
    def prepare_time_series_data(self, data: List[float], sequence_length: int = 10) -> tuple:
        """Prepare time series data for prediction"""
        X, y = [], []
        for i in range(len(data) - sequence_length):
            X.append(data[i:(i + sequence_length)])
            y.append(data[i + sequence_length])
        return np.array(X), np.array(y)
    
    async def advanced_time_series_analysis(
        self,
        data: List[float],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform advanced time series analysis"""
        try:
            if not data or len(data) < 2:
                raise ValueError("Insufficient data points for analysis")
            
            results = {}
            
            # Basic statistics
            results['statistics'] = {
                'mean': float(np.mean(data)),
                'std': float(np.std(data)),
                'min': float(np.min(data)),
                'max': float(np.max(data)),
                'skewness': float(stats.skew(data)),
                'kurtosis': float(stats.kurtosis(data))
            }
            
            # Trend analysis
            x = np.arange(len(data))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
            results['trend'] = {
                'slope': float(slope),
                'intercept': float(intercept),
                'r_squared': float(r_value ** 2),
                'p_value': float(p_value),
                'direction': 'upward' if slope > 0 else 'downward',
                'strength': abs(r_value)
            }
            
            # Multiple model predictions
            predictions = {}
            
            try:
                # Random Forest prediction
                rf_model = self.models['random_forest']
                X = np.arange(len(data)).reshape(-1, 1)
                rf_model.fit(X, data)
                predictions['random_forest'] = float(rf_model.predict(np.array([[len(data)]]))[0])
            except Exception as e:
                logger.warning(f"Random Forest prediction failed: {e}")
            
            try:
                # XGBoost prediction
                xgb_model = self.models['xgboost']
                xgb_model.fit(X, data)
                predictions['xgboost'] = float(xgb_model.predict(np.array([[len(data)]]))[0])
            except Exception as e:
                logger.warning(f"XGBoost prediction failed: {e}")
            
            try:
                # Prophet prediction
                prophet_model = self.models['prophet']
                df = pd.DataFrame({
                    'ds': pd.date_range('2024-01-01', periods=len(data)),
                    'y': data
                })
                prophet_model.fit(df)
                future = prophet_model.make_future_dataframe(periods=1)
                prophet_forecast = prophet_model.predict(future)
                predictions['prophet'] = float(prophet_forecast['yhat'].iloc[-1])
            except Exception as e:
                logger.warning(f"Prophet prediction failed: {e}")
            
            if predictions:
                results['predictions'] = predictions
                
                # Ensemble prediction
                ensemble_pred = np.mean(list(predictions.values()))
                results['ensemble_prediction'] = {
                    'value': float(ensemble_pred),
                    'confidence': float(1 - np.std(list(predictions.values())) / abs(ensemble_pred))
                }
            else:
                results['predictions'] = {}
                results['ensemble_prediction'] = {
                    'value': float(np.mean(data)),
                    'confidence': 0.5
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Time series analysis error: {e}")
            raise Exception(f"Time series analysis failed: {str(e)}")
    
    async def advanced_anomaly_detection(
        self,
        data: List[float],
        config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Perform advanced anomaly detection"""
        try:
            anomalies = []
            
            # Statistical method (Z-score)
            z_scores = np.abs(stats.zscore(data))
            statistical_anomalies = z_scores > 3
            
            # Isolation Forest
            from sklearn.ensemble import IsolationForest
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            iso_predictions = iso_forest.fit_predict(np.array(data).reshape(-1, 1))
            
            # DBSCAN clustering
            from sklearn.cluster import DBSCAN
            dbscan = DBSCAN(eps=np.std(data) * 0.5, min_samples=3)
            clusters = dbscan.fit_predict(np.array(data).reshape(-1, 1))
            dbscan_anomalies = clusters == -1
            
            # Combine results
            for i, value in enumerate(data):
                is_anomaly = (
                    statistical_anomalies[i] or
                    iso_predictions[i] == -1 or
                    dbscan_anomalies[i]
                )
                
                if is_anomaly:
                    severity = max(
                        z_scores[i] / 3,  # Normalize Z-score
                        abs(iso_forest.score_samples([[value]])[0]),
                        int(dbscan_anomalies[i])
                    )
                    
                    anomalies.append({
                        'index': i,
                        'value': float(value),
                        'severity': float(severity),
                        'detection_methods': {
                            'statistical': bool(statistical_anomalies[i]),
                            'isolation_forest': bool(iso_predictions[i] == -1),
                            'dbscan': bool(dbscan_anomalies[i])
                        }
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Anomaly detection error: {e}")
            raise Exception(f"Anomaly detection failed: {str(e)}")
    
    async def advanced_correlation_analysis(
        self,
        data: Dict[str, List[float]]
    ) -> Dict[str, Any]:
        """Perform advanced correlation analysis"""
        try:
            results = {}
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Pearson correlation
            pearson_corr = df.corr(method='pearson')
            results['pearson'] = pearson_corr.to_dict()
            
            # Spearman correlation
            spearman_corr = df.corr(method='spearman')
            results['spearman'] = spearman_corr.to_dict()
            
            # Kendall correlation
            kendall_corr = df.corr(method='kendall')
            results['kendall'] = kendall_corr.to_dict()
            
            # Mutual Information
            from sklearn.feature_selection import mutual_info_regression
            mi_scores = mutual_info_regression(df, df.iloc[:, 0])
            results['mutual_information'] = dict(zip(df.columns, mi_scores))
            
            # Granger Causality (if enough data points)
            if len(df) > 30:
                from statsmodels.tsa.stattools import grangercausalitytests
                granger_results = {}
                for col1 in df.columns:
                    for col2 in df.columns:
                        if col1 != col2:
                            try:
                                gc_res = grangercausalitytests(
                                    df[[col1, col2]],
                                    maxlag=2,
                                    verbose=False
                                )
                                granger_results[f"{col1}_to_{col2}"] = {
                                    'p_value': gc_res[1][0]['ssr_chi2test'][1],
                                    'causal': gc_res[1][0]['ssr_chi2test'][1] < 0.05
                                }
                            except:
                                continue
                results['granger_causality'] = granger_results
            
            return results
            
        except Exception as e:
            logger.error(f"Correlation analysis error: {e}")
            raise Exception(f"Correlation analysis failed: {str(e)}")
    
    async def advanced_forecasting(
        self,
        data: List[float],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform advanced forecasting"""
        try:
            if not data or len(data) < 2:
                raise ValueError("Insufficient data points for forecasting")
            
            results = {}
            horizon = config.get('horizon', 5)
            
            # Prepare data
            df = pd.DataFrame({
                'ds': pd.date_range('2024-01-01', periods=len(data)),
                'y': data
            })
            
            # Prophet forecasting
            try:
                prophet_model = self.models['prophet']
                prophet_model.fit(df)
                future = prophet_model.make_future_dataframe(periods=horizon)
                prophet_forecast = prophet_model.predict(future)
                
                results['prophet'] = {
                    'predictions': prophet_forecast['yhat'].tail(horizon).tolist(),
                    'lower_bound': prophet_forecast['yhat_lower'].tail(horizon).tolist(),
                    'upper_bound': prophet_forecast['yhat_upper'].tail(horizon).tolist()
                }
            except Exception as e:
                logger.error(f"Prophet forecasting error: {e}")
                results['prophet'] = {
                    'predictions': [],
                    'lower_bound': [],
                    'upper_bound': []
                }
            
            # Random Forest forecasting
            try:
                rf_model = self.models['random_forest']
                X = np.arange(len(data)).reshape(-1, 1)
                rf_model.fit(X, data)
                
                rf_predictions = []
                for i in range(horizon):
                    pred = rf_model.predict(np.array([[len(data) + i]]))[0]
                    rf_predictions.append(float(pred))
                
                results['random_forest'] = {
                    'predictions': rf_predictions
                }
            except Exception as e:
                logger.error(f"Random Forest forecasting error: {e}")
                results['random_forest'] = {
                    'predictions': []
                }
            
            # XGBoost forecasting
            try:
                xgb_model = self.models['xgboost']
                X = np.arange(len(data)).reshape(-1, 1)
                xgb_model.fit(X, data)
                
                xgb_predictions = []
                for i in range(horizon):
                    pred = xgb_model.predict(np.array([[len(data) + i]]))[0]
                    xgb_predictions.append(float(pred))
                
                results['xgboost'] = {
                    'predictions': xgb_predictions
                }
            except Exception as e:
                logger.error(f"XGBoost forecasting error: {e}")
                results['xgboost'] = {
                    'predictions': []
                }
            
            # Ensemble forecast
            try:
                ensemble_predictions = []
                for i in range(horizon):
                    predictions = []
                    if results['prophet']['predictions']:
                        predictions.append(results['prophet']['predictions'][i])
                    if results['random_forest']['predictions']:
                        predictions.append(results['random_forest']['predictions'][i])
                    if results['xgboost']['predictions']:
                        predictions.append(results['xgboost']['predictions'][i])
                    
                    if predictions:
                        ensemble_pred = np.mean(predictions)
                        ensemble_predictions.append(float(ensemble_pred))
                
                results['ensemble'] = {
                    'predictions': ensemble_predictions,
                    'confidence': float(1 - np.std(ensemble_predictions) / np.mean(ensemble_predictions)) if ensemble_predictions else 0.0
                }
            except Exception as e:
                logger.error(f"Ensemble forecasting error: {e}")
                results['ensemble'] = {
                    'predictions': [],
                    'confidence': 0.0
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Forecasting error: {e}")
            raise Exception(f"Forecasting failed: {str(e)}")
    
    def save_model(self, model_name: str, path: str):
        """Save trained model to disk"""
        try:
            if model_name in self.models:
                joblib.dump(self.models[model_name], path)
                logger.info(f"Model {model_name} saved to {path}")
            else:
                raise ValueError(f"Model {model_name} not found")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, model_name: str, path: str):
        """Load trained model from disk"""
        try:
            if os.path.exists(path):
                self.models[model_name] = joblib.load(path)
                logger.info(f"Model {model_name} loaded from {path}")
            else:
                raise FileNotFoundError(f"Model file not found at {path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

# Initialize universal analytics engine
universal_analytics = UniversalAnalytics()

# Example usage
if __name__ == "__main__":
    # Test data
    test_data = [100, 120, 140, 160, 180, 200, 220, 240, 260, 280]
    
    # Test time series analysis
    async def test_analysis():
        try:
            results = await universal_analytics.advanced_time_series_analysis(
                test_data,
                {'horizon': 5}
            )
            print("Time Series Analysis Results:")
            print(json.dumps(results, indent=2))
        except Exception as e:
            print(f"Error: {e}")
    
    # Run test
    import asyncio
    asyncio.run(test_analysis()) 