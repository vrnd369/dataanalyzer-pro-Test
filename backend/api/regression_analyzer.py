"""
Regression analyzer implementation for the analytics platform.
Provides a high-level interface for regression analysis operations.
"""

from typing import Dict, List, Any, Optional
import numpy as np
from scipy import stats
from sklearn.metrics import mean_squared_error, r2_score
from .regression import RegressionAnalyzer

class RegressionAnalysisService:
    def __init__(self):
        self.analyzer = RegressionAnalyzer()

    def analyze_simple_regression(self, X: List[float], y: List[float], model_type: str = 'linear') -> Dict[str, Any]:
        """Perform simple regression analysis"""
        try:
            results = self.analyzer.fit_model(X, y, model_type)
            
            # Add additional analysis
            X_array = np.array(X).reshape(-1, 1)
            y_array = np.array(y)
            
            # Calculate confidence intervals
            n = len(X)
            x_mean = np.mean(X_array)
            x_std = np.std(X_array)
            
            # Calculate standard error of regression
            y_pred = np.array(results['predictions'])
            mse = mean_squared_error(y_array, y_pred)
            std_error = np.sqrt(mse)
            
            # Calculate confidence intervals for predictions
            confidence_intervals = []
            for x in X_array:
                x_centered = (x - x_mean) / x_std
                margin = 1.96 * std_error * np.sqrt(1/n + x_centered**2)
                confidence_intervals.append({
                    'lower': float(y_pred[np.where(X_array == x)[0][0]] - margin),
                    'upper': float(y_pred[np.where(X_array == x)[0][0]] + margin)
                })
            
            results['confidence_intervals'] = confidence_intervals
            
            return results
        except Exception as e:
            raise Exception(f"Error in simple regression analysis: {str(e)}")

    def analyze_multiple_regression(self, X: List[List[float]], y: List[float]) -> Dict[str, Any]:
        """Perform multiple regression analysis with additional insights"""
        try:
            results = self.analyzer.analyze_multiple_regression(X, y)
            
            # Add feature correlation analysis
            X_array = np.array(X)
            y_array = np.array(y)
            
            correlations = []
            for i in range(X_array.shape[1]):
                correlation = np.corrcoef(X_array[:, i], y_array)[0, 1]
                correlations.append({
                    'feature': f'X{i+1}',
                    'correlation': float(correlation)
                })
            
            results['feature_correlations'] = correlations
            
            # Add model diagnostics
            y_pred = np.array(results['predictions'])
            residuals = y_array - y_pred
            
            diagnostics = {
                'residuals_mean': float(np.mean(residuals)),
                'residuals_std': float(np.std(residuals)),
                'residuals_skew': float(stats.skew(residuals)),
                'residuals_kurtosis': float(stats.kurtosis(residuals))
            }
            
            results['diagnostics'] = diagnostics
            
            return results
        except Exception as e:
            raise Exception(f"Error in multiple regression analysis: {str(e)}")

    def analyze_polynomial_regression(self, X: List[float], y: List[float], degree: int = 2) -> Dict[str, Any]:
        """Perform polynomial regression analysis with model selection"""
        try:
            # Try different polynomial degrees
            best_degree = degree
            best_r2 = -float('inf')
            best_results = None
            
            for d in range(1, degree + 1):
                results = self.analyzer.analyze_polynomial_regression(X, y, d)
                if results['r2_score'] > best_r2:
                    best_r2 = results['r2_score']
                    best_degree = d
                    best_results = results
            
            best_results['best_degree'] = best_degree
            
            # Add model comparison
            model_comparison = []
            for d in range(1, degree + 1):
                results = self.analyzer.analyze_polynomial_regression(X, y, d)
                model_comparison.append({
                    'degree': d,
                    'r2_score': results['r2_score']
                })
            
            best_results['model_comparison'] = model_comparison
            
            return best_results
        except Exception as e:
            raise Exception(f"Error in polynomial regression analysis: {str(e)}")

    def analyze_time_series_regression(self, X: List[float], y: List[float]) -> Dict[str, Any]:
        """Perform time series regression analysis with seasonality detection"""
        try:
            results = self.analyzer.analyze_time_series_regression(X, y)
            
            # Add seasonality analysis
            X_array = np.array(X)
            y_array = np.array(y)
            
            # Detect daily seasonality
            daily_pattern = []
            for hour in range(24):
                mask = (X_array % 24 == hour)
                if np.any(mask):
                    daily_pattern.append({
                        'hour': hour,
                        'mean': float(np.mean(y_array[mask])),
                        'std': float(np.std(y_array[mask]))
                    })
            
            # Detect weekly seasonality
            weekly_pattern = []
            for day in range(7):
                mask = ((X_array // 24) % 7 == day)
                if np.any(mask):
                    weekly_pattern.append({
                        'day': day,
                        'mean': float(np.mean(y_array[mask])),
                        'std': float(np.std(y_array[mask]))
                    })
            
            results['seasonality'] = {
                'daily': daily_pattern,
                'weekly': weekly_pattern
            }
            
            # Add trend analysis
            trend = np.polyfit(X_array, y_array, 1)
            results['trend'] = {
                'slope': float(trend[0]),
                'intercept': float(trend[1])
            }
            
            return results
        except Exception as e:
            raise Exception(f"Error in time series regression analysis: {str(e)}")

    def get_regression_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of regression analysis results"""
        try:
            summary = {
                'model_type': results.get('model_type', 'unknown'),
                'r2_score': results.get('r2_score', 0.0),
                'mse': results.get('mse', 0.0),
                'rmse': results.get('rmse', 0.0),
                'coefficients': results.get('coefficients', []),
                'intercept': results.get('intercept', 0.0)
            }
            
            # Add model performance metrics
            if 'train_score' in results and 'test_score' in results:
                summary['model_performance'] = {
                    'train_score': results['train_score'],
                    'test_score': results['test_score'],
                    'overfitting': results['train_score'] - results['test_score']
                }
            
            # Add feature importance if available
            if 'feature_importance' in results:
                summary['feature_importance'] = results['feature_importance']
            
            # Add seasonality information if available
            if 'seasonality' in results:
                summary['seasonality'] = results['seasonality']
            
            # Add trend information if available
            if 'trend' in results:
                summary['trend'] = results['trend']
            
            return summary
        except Exception as e:
            raise Exception(f"Error generating regression summary: {str(e)}") 