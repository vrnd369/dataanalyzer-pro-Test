import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateElasticNetRegression(
  dependent: DataField,
  independent: DataField,
  alpha: number = 0.1,
  l1Ratio: number = 0.5,
  maxIterations: number = 1000,
  tolerance: number = 1e-6
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Create design matrix with intercept
  const X = x.map(xi => [1, xi]);
  
  // Initialize coefficients
  let coefficients = new Array(X[0].length).fill(0);
  
  // Coordinate descent algorithm for Elastic Net
  for (let iter = 0; iter < maxIterations; iter++) {
    const oldCoefficients = [...coefficients];
    
    // Update each coefficient
    for (let j = 0; j < coefficients.length; j++) {
      // Calculate residuals excluding current feature
      const residuals = y.map((yi, i) => {
        let sum = yi;
        for (let k = 0; k < coefficients.length; k++) {
          if (k !== j) {
            sum -= coefficients[k] * X[i][k];
          }
        }
        return sum;
      });
      
      // Calculate coordinate update
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n; i++) {
        numerator += X[i][j] * residuals[i];
        denominator += X[i][j] * X[i][j];
      }
      
      // Elastic Net update
      const rho = numerator / denominator;
      if (j === 0) { // Don't apply penalties to intercept
        coefficients[j] = rho;
      } else {
        const lambda1 = alpha * l1Ratio;
        const lambda2 = alpha * (1 - l1Ratio);
        
        // Soft thresholding with L2 penalty
        const denominator = 1 + 2 * lambda2;
        if (rho < -lambda1) {
          coefficients[j] = (rho + lambda1) / denominator;
        } else if (rho > lambda1) {
          coefficients[j] = (rho - lambda1) / denominator;
        } else {
          coefficients[j] = 0;
        }
      }
    }
    
    // Check convergence
    const diff = coefficients.reduce((sum, coef, i) => 
      sum + Math.abs(coef - oldCoefficients[i]), 0);
    if (diff < tolerance) {
      break;
    }
  }
  
  // Calculate predictions
  const predictions = X.map(row => {
    return row.reduce((sum, feature, i) => sum + feature * coefficients[i], 0);
  });
  
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
  const equation = `${dependent.name} = ${coefficients[0].toFixed(3)} + ${coefficients[1].toFixed(3)}×${independent.name}`;
  
  return {
    field: dependent.name,
    type: 'elastic-net',
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