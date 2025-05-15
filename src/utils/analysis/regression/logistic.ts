import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateLogisticRegression(
  dependent: DataField,
  independent: DataField,
  maxIterations: number = 1000,
  tolerance: number = 1e-4
): RegressionResult {
  // Standardize values for numerical stability
  const y = dependent.value as number[];
  const x = standardize(independent.value as number[]);
  
  const n = Math.min(x.length, y.length);
  
  // Initialize coefficients
  let coefficients = [0, 0]; // [intercept, slope]
  let oldCoefficients = [...coefficients];
  
  // Gradient descent for logistic regression
  for (let iter = 0; iter < maxIterations; iter++) {
    // Store old coefficients for convergence check
    oldCoefficients = [...coefficients];
    
    // Calculate predictions using sigmoid function
    const predictions = x.map(xi => sigmoid(coefficients[0] + coefficients[1] * xi));
    
    // Calculate gradients
    const gradients = [0, 0];
    
    // Gradient for intercept
    gradients[0] = predictions.reduce((sum, pred, i) => 
      sum + (pred - y[i]), 0) / n;
    
    // Gradient for slope
    gradients[1] = x.reduce((sum, xi, i) => 
      sum + xi * (predictions[i] - y[i]), 0) / n;
    
    // Update coefficients using gradient descent
    const learningRate = 0.01;
    coefficients[0] -= learningRate * gradients[0];
    coefficients[1] -= learningRate * gradients[1];
    
    // Check convergence
    const change = Math.sqrt(
      coefficients.reduce((sum, coef, i) => 
        sum + Math.pow(coef - oldCoefficients[i], 2), 0)
    );
    
    if (change < tolerance) break;
  }
  
  // Calculate final predictions
  const predictions = x.map(xi => sigmoid(coefficients[0] + coefficients[1] * xi));
  
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
    upper: predictions.map(pred => Math.min(1, pred + tValue * standardError)),
    lower: predictions.map(pred => Math.max(0, pred - tValue * standardError))
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(y, predictions);
  
  // Generate equation string
  const equation = `logit(${dependent.name}) = ${coefficients[0].toFixed(3)} + ${coefficients[1].toFixed(3)}×${independent.name}`;
  
  return {
    field: dependent.name,
    type: 'logistic',
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

// Sigmoid function for logistic regression
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
} 