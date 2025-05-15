"""
Regression Analysis Module

This module provides a comprehensive toolkit for regression analysis, including:
- Multiple regression algorithms (Linear, Ridge, Lasso, Elastic Net)
- Automated model evaluation and comparison
- Diagnostic visualizations
- Multicollinearity detection
- Regularization path analysis
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import (LinearRegression, Ridge, RidgeCV, Lasso, 
                                LassoCV, ElasticNet, ElasticNetCV)
from sklearn.preprocessing import (StandardScaler, PolynomialFeatures, 
                                 RobustScaler)
from sklearn.model_selection import (train_test_split, cross_val_score, 
                                   GridSearchCV)
from sklearn.metrics import (mean_absolute_error, mean_squared_error, 
                           r2_score, explained_variance_score)
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.graphics.gofplots import qqplot
import warnings
import json
from typing import Dict, List, Optional, Union, Tuple
import io
import base64

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class RegressionAnalysis:
    """
    Comprehensive regression analysis toolkit with visualization and diagnostics
    
    Features:
    - Multiple regression algorithms
    - Automated model evaluation
    - Diagnostic visualization
    - Troubleshooting tools
    - Regularization tuning
    """
    
    def __init__(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.2, 
                 random_state: int = 42):
        """
        Initialize with data
        
        Parameters:
        X : Feature matrix
        y : Target vector
        test_size : Size of test set (default 0.2)
        random_state : Random seed (default 42)
        """
        if not isinstance(X, np.ndarray) or not isinstance(y, np.ndarray):
            raise TypeError("X and y must be numpy arrays")
            
        if X.shape[0] != y.shape[0]:
            raise ValueError("X and y must have the same number of samples")
            
        self.X = X
        self.y = y
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state)
        self.scaler = StandardScaler()
        self.models = {}
        self.results = pd.DataFrame()
        
    def preprocess_data(self, scale: bool = True, poly_degree: Optional[int] = None) -> 'RegressionAnalysis':
        """
        Preprocess data with optional scaling and polynomial features
        
        Parameters:
        scale : Whether to scale features (default True)
        poly_degree : Degree for polynomial features (default None)
        
        Returns:
        self : For method chaining
        """
        if poly_degree:
            if not isinstance(poly_degree, int) or poly_degree < 1:
                raise ValueError("poly_degree must be a positive integer")
            poly = PolynomialFeatures(degree=poly_degree, include_bias=False)
            self.X_train = poly.fit_transform(self.X_train)
            self.X_test = poly.transform(self.X_test)
            
        if scale:
            self.X_train = self.scaler.fit_transform(self.X_train)
            self.X_test = self.scaler.transform(self.X_test)
            
        return self
    
    def check_multicollinearity(self, threshold: float = 5) -> Optional[pd.DataFrame]:
        """
        Calculate Variance Inflation Factor (VIF) for features
        
        Parameters:
        threshold : VIF threshold for multicollinearity (default 5)
        
        Returns:
        DataFrame with VIF scores and multicollinearity flags
        """
        vif_data = pd.DataFrame()
        vif_data["feature"] = range(self.X.shape[1])
        
        try:
            vif_data["VIF"] = [variance_inflation_factor(self.X, i) 
                             for i in range(self.X.shape[1])]
            vif_data["High_VIF"] = vif_data["VIF"] > threshold
            return vif_data
        except Exception as e:
            print(f"Could not calculate VIF: {str(e)}")
            return None
    
    def fit_linear_regression(self) -> pd.DataFrame:
        """Fit standard linear regression model"""
        model = LinearRegression()
        model.fit(self.X_train, self.y_train)
        self.models['Linear'] = model
        return self._evaluate_model(model)
    
    def fit_ridge_regression(self, alphas: List[float] = [0.1, 1.0, 10.0], 
                           cv: int = 5) -> pd.DataFrame:
        """Fit ridge regression with cross-validated alpha selection"""
        model = RidgeCV(alphas=np.array(alphas), cv=cv)
        model.fit(self.X_train, self.y_train)
        self.models['Ridge'] = model
        results = self._evaluate_model(model)
        results['Alpha'] = model.alpha_
        return results
    
    def fit_lasso_regression(self, alphas: List[float] = [0.1, 1.0, 10.0], 
                           cv: int = 5) -> pd.DataFrame:
        """Fit lasso regression with cross-validated alpha selection"""
        model = LassoCV(alphas=alphas, cv=cv, max_iter=10000)
        model.fit(self.X_train, self.y_train)
        self.models['Lasso'] = model
        results = self._evaluate_model(model)
        results['Alpha'] = model.alpha_
        results['Features_Selected'] = sum(model.coef_ != 0)
        return results
    
    def fit_elastic_net(self, alphas: List[float] = [0.1, 1.0, 10.0], 
                       l1_ratios: List[float] = [.1, .5, .9], 
                       cv: int = 5) -> pd.DataFrame:
        """Fit elastic net regression with cross-validated parameters"""
        model = ElasticNetCV(alphas=alphas, l1_ratio=l1_ratios, cv=cv, max_iter=10000)
        model.fit(self.X_train, self.y_train)
        self.models['ElasticNet'] = model
        results = self._evaluate_model(model)
        results['Alpha'] = model.alpha_
        results['L1_Ratio'] = model.l1_ratio_
        results['Features_Selected'] = sum(model.coef_ != 0)
        return results
    
    def _evaluate_model(self, model) -> pd.DataFrame:
        """Internal method to evaluate model performance"""
        y_pred_train = model.predict(self.X_train)
        y_pred_test = model.predict(self.X_test)
        
        metrics = {
            'Train_R2': r2_score(self.y_train, y_pred_train),
            'Test_R2': r2_score(self.y_test, y_pred_test),
            'Train_MAE': mean_absolute_error(self.y_train, y_pred_train),
            'Test_MAE': mean_absolute_error(self.y_test, y_pred_test),
            'Train_RMSE': np.sqrt(mean_squared_error(self.y_train, y_pred_train)),
            'Test_RMSE': np.sqrt(mean_squared_error(self.y_test, y_pred_test)),
            'Explained_Variance': explained_variance_score(self.y_test, y_pred_test),
            'CV_R2': cross_val_score(model, self.X_train, self.y_train, cv=5, 
                                   scoring='r2').mean()
        }
        
        if hasattr(model, 'coef_'):
            metrics['Coefficients'] = model.coef_
            metrics['Intercept'] = model.intercept_
        
        model_name = [k for k,v in self.models.items() if v == model][0]
        self.results[model_name] = pd.Series(metrics)
        return pd.DataFrame.from_dict(metrics, orient='index', columns=['Value'])
    
    def compare_models(self) -> pd.DataFrame:
        """Compare performance of all fitted models"""
        return self.results.T.sort_values('Test_R2', ascending=False)
    
    def plot_diagnostics(self, model_name: str = 'Linear') -> Dict[str, str]:
        """
        Generate diagnostic plots for specified model
        
        Parameters:
        model_name : Name of model to diagnose (default 'Linear')
        
        Returns:
        Dictionary containing base64 encoded plot images
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.models.keys())}")
        
        model = self.models[model_name]
        y_pred = model.predict(self.X_test)
        residuals = self.y_test - y_pred
        
        plots = {}
        
        # Predicted vs Actual
        plt.figure(figsize=(10, 6))
        sns.regplot(x=y_pred, y=self.y_test, line_kws={'color': 'red'})
        plt.title('Predicted vs Actual')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plots['predicted_vs_actual'] = self._fig_to_base64()
        plt.close()
        
        # Residual Plot
        plt.figure(figsize=(10, 6))
        sns.residplot(x=y_pred, y=residuals, lowess=True, line_kws={'color': 'red'})
        plt.title('Residuals vs Predicted')
        plt.xlabel('Predicted')
        plt.ylabel('Residuals')
        plots['residuals'] = self._fig_to_base64()
        plt.close()
        
        # Q-Q Plot
        plt.figure(figsize=(10, 6))
        qqplot(residuals, line='s', ax=plt.gca())
        plt.title('Q-Q Plot of Residuals')
        plots['qq_plot'] = self._fig_to_base64()
        plt.close()
        
        # Coefficient Plot (if available)
        if hasattr(model, 'coef_'):
            plt.figure(figsize=(10, 6))
            coefs = pd.Series(model.coef_, 
                            index=[f'Feature_{i}' for i in range(len(model.coef_))])
            coefs.sort_values().plot(kind='barh')
            plt.title('Feature Coefficients')
            plots['coefficients'] = self._fig_to_base64()
            plt.close()
        
        return plots
    
    def _fig_to_base64(self) -> str:
        """Convert matplotlib figure to base64 string"""
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        return img_str
    
    def plot_feature_importance(self, model_name: str = 'Linear', 
                              top_n: int = 10) -> Tuple[pd.DataFrame, str]:
        """
        Plot feature importance for specified model
        
        Parameters:
        model_name : Name of model (default 'Linear')
        top_n : Number of top features to show (default 10)
        
        Returns:
        Tuple of (importance DataFrame, base64 encoded plot)
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found. Available models: {list(self.models.keys())}")
        
        model = self.models[model_name]
        
        if not hasattr(model, 'coef_'):
            raise ValueError(f"Model {model_name} does not have coefficients")
            
        importance = pd.DataFrame({
            'Feature': [f'Feature_{i}' for i in range(len(model.coef_))],
            'Importance': abs(model.coef_)
        }).sort_values('Importance', ascending=False).head(top_n)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(x='Importance', y='Feature', data=importance)
        plt.title(f'Feature Importance - {model_name} Regression')
        plot_str = self._fig_to_base64()
        plt.close()
        
        return importance, plot_str
    
    def plot_regularization_path(self, model_type: str = 'ridge', 
                               alphas: np.ndarray = np.logspace(-4, 4, 100)) -> str:
        """
        Plot regularization path for coefficients
        
        Parameters:
        model_type : 'ridge' or 'lasso' (default 'ridge')
        alphas : Range of alpha values to test (logspace -4 to 4 by default)
        
        Returns:
        Base64 encoded plot
        """
        if model_type.lower() == 'ridge':
            ModelClass = Ridge
        elif model_type.lower() == 'lasso':
            ModelClass = Lasso
        else:
            raise ValueError("model_type must be 'ridge' or 'lasso'")
        
        coefs = []
        for a in alphas:
            model = ModelClass(alpha=a, max_iter=10000)
            model.fit(self.X_train, self.y_train)
            coefs.append(model.coef_)
        
        plt.figure(figsize=(10, 6))
        ax = plt.gca()
        ax.plot(alphas, coefs)
        ax.set_xscale('log')
        left, right = ax.get_xlim()
        ax.set_xlim(right, left)  # reverse axis
        plt.xlabel('Alpha (regularization strength)')
        plt.ylabel('Coefficients')
        plt.title(f'{model_type.title()} Regularization Path')
        plt.axis('tight')
        plot_str = self._fig_to_base64()
        plt.close()
        
        return plot_str

    def to_dict(self) -> Dict:
        """
        Convert analysis results to dictionary format for JSON serialization
        
        Returns:
        Dictionary containing all analysis results
        """
        results = {
            'model_comparison': self.compare_models().to_dict(),
            'models': {}
        }
        
        for name, model in self.models.items():
            model_results = {
                'metrics': self._evaluate_model(model).to_dict(),
                'diagnostics': self.plot_diagnostics(name)
            }
            
            if hasattr(model, 'coef_'):
                importance, importance_plot = self.plot_feature_importance(name)
                model_results.update({
                    'feature_importance': importance.to_dict(),
                    'importance_plot': importance_plot
                })
            
            results['models'][name] = model_results
        
        return results

def analyze_regression(X: np.ndarray, y: np.ndarray, 
                      test_size: float = 0.2, 
                      random_state: int = 42) -> Dict:
    """
    Convenience function to run full regression analysis
    
    Parameters:
    X : Feature matrix
    y : Target vector
    test_size : Size of test set (default 0.2)
    random_state : Random seed (default 42)
    
    Returns:
    Dictionary containing all analysis results
    """
    analyzer = RegressionAnalysis(X, y, test_size, random_state)
    
    # Run all analyses
    analyzer.preprocess_data()
    analyzer.fit_linear_regression()
    analyzer.fit_ridge_regression()
    analyzer.fit_lasso_regression()
    analyzer.fit_elastic_net()
    
    # Check for NaN values
    print("NaN values in X:", np.isnan(X).sum())
    print("NaN values in y:", np.isnan(y).sum())

    # Check data shapes
    print("X shape:", X.shape)
    print("y shape:", y.shape)

    # Check data types
    print("X dtype:", X.dtype)
    print("y dtype:", y.dtype)
    
    return analyzer.to_dict() 