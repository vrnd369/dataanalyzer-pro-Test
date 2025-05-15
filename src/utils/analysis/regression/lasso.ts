import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateLassoRegression(
  dependent: DataField,
  independent: DataField,
  alpha: number = 0.1,
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
  
  // Coordinate descent algorithm for LASSO
  for (let iter = 0; iter < maxIterations; iter++) {
    // Store old coefficients for convergence check
    oldCoefficients = [...coefficients];
    
    // Update intercept (not penalized)
    const residuals = y.map((yi, i) => yi - coefficients[1] * x[i]);
    coefficients[0] = residuals.reduce((a, b) => a + b, 0) / n;
    
    // Update slope with soft thresholding
    const correlations = x.reduce((sum, xi, i) => 
      sum + xi * (y[i] - coefficients[0]), 0);
    const xSquaredSum = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    // Soft thresholding operator
    const softThreshold = (z: number, gamma: number) => {
      if (z > gamma) return z - gamma;
      if (z < -gamma) return z + gamma;
      return 0;
    };
    
    coefficients[1] = softThreshold(correlations / xSquaredSum, alpha / (2 * xSquaredSum));
    
    // Check convergence
    const change = Math.sqrt(
      coefficients.reduce((sum, coef, i) => 
        sum + Math.pow(coef - oldCoefficients[i], 2), 0)
    );
    
    if (change < tolerance) break;
  }
  
  // Calculate predictions
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
  const equation = `${dependent.name} = ${coefficients[0].toFixed(3)} + ${coefficients[1].toFixed(3)}×${independent.name} (α=${alpha})`;
  
  return {
    field: dependent.name,
    type: 'lasso',
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