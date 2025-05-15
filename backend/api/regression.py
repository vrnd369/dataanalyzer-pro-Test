from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from ..regression_analyzer import RegressionAnalysis

router = APIRouter()

class RegressionRequest(BaseModel):
    X: List[List[float]]
    y: List[float]
    model_type: str
    test_size: Optional[float] = 0.2
    random_state: Optional[int] = 42

@router.post("/analyze")
async def analyze_regression(request: RegressionRequest):
    try:
        # Convert input data to numpy arrays
        X = np.array(request.X).T  # Transpose to get features as columns
        y = np.array(request.y)

        # Create regression analyzer
        analyzer = RegressionAnalysis(X, y, test_size=request.test_size, random_state=request.random_state)
        
        # Preprocess data
        analyzer.preprocess_data()

        # Perform analysis based on model type
        if request.model_type == 'linear':
            results = analyzer.fit_linear_regression()
        elif request.model_type == 'ridge':
            results = analyzer.fit_ridge_regression()
        elif request.model_type == 'lasso':
            results = analyzer.fit_lasso_regression()
        elif request.model_type == 'elastic_net':
            results = analyzer.fit_elastic_net()
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model type: {request.model_type}")

        # Get diagnostics
        diagnostics = analyzer.plot_diagnostics(request.model_type)

        # Get feature importance
        importance, importance_plot = analyzer.plot_feature_importance(request.model_type)

        # Prepare response
        response = {
            'metrics': {
                'r2': float(results.loc['Train_R2', 'Value']),
                'rmse': float(results.loc['Train_RMSE', 'Value']),
                'mae': float(results.loc['Train_MAE', 'Value']),
                'adjusted_r2': float(results.loc['CV_R2', 'Value'])
            },
            'diagnostics': {
                'residuals': diagnostics['residuals'],
                'qq_plot': diagnostics['qq_plot']
            },
            'predictions': {
                'actual': y.tolist(),
                'predicted': analyzer.models[request.model_type].predict(X).tolist()
            },
            'feature_importance': importance.to_dict('records')
        }

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 