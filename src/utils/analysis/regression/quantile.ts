import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateQuantileRegression(
  dependent: DataField,
  independent: DataField,
  quantile: number = 0.5,
  maxIterations: number = 1000,
  tolerance: number = 1e-4
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Initialize coefficients
  let coefficients = [0, 0]; // [intercept, slope]
  let oldCoefficients = [...coefficients];
  
  // Linear programming approach for quantile regression
  for (let iter = 0; iter < maxIterations; iter++) {
    // Store old coefficients for convergence check
    oldCoefficients = [...coefficients];
    
    // Calculate predictions
    const predictions = x.map(xi => coefficients[0] + coefficients[1] * xi);
    
    // Calculate residuals
    const residuals = y.map((yi, i) => yi - predictions[i]);
    
    // Calculate weights for weighted least squares
    const weights = residuals.map(r => {
      if (r > 0) return quantile;
      if (r < 0) return 1 - quantile;
      return 0.5; // For r = 0
    });
    
    // Weighted least squares update
    const weightedX = x.map((xi, i) => xi * weights[i]);
    const weightedY = y.map((yi, i) => yi * weights[i]);
    
    // Update intercept
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    coefficients[0] = weightedY.reduce((sum, yi) => sum + yi, 0) / sumWeights;
    
    // Update slope
    const xMean = weightedX.reduce((sum, xi) => sum + xi, 0) / sumWeights;
    const yMean = weightedY.reduce((sum, yi) => sum + yi, 0) / sumWeights;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = weightedX[i] - xMean;
      numerator += xDiff * (weightedY[i] - yMean);
      denominator += xDiff * xDiff;
    }
    
    coefficients[1] = numerator / denominator;
    
    // Check convergence
    const change = Math.sqrt(
      coefficients.reduce((sum, coef, i) => 
        sum + Math.pow(coef - oldCoefficients[i], 2), 0)
    );
    
    if (change < tolerance) break;
  }
  
  // Calculate final predictions
  const predictions = x.map(xi => coefficients[0] + coefficients[1] * xi);
  
  // Calculate metrics
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(y, predictions, 1000);
  
  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level
  
  // Calculate prediction intervals
  const confidence = {
    upper: predictions.map(pred => pred + tValue * standardError),
    lower: predictions.map(pred => pred - tValue * standardError)
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(y, predictions);
  
  // Generate equation string
  const equation = `Q${quantile}(${dependent.name}) = ${coefficients[0].toFixed(3)} + ${coefficients[1].toFixed(3)}×${independent.name}`;
  
  return {
    field: dependent.name,
    type: 'quantile',
    coefficients: [coefficients[1]], // Exclude intercept
    intercept: coefficients[0],
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation,
    confidence,
    metrics
  };
} 