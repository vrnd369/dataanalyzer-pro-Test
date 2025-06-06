import { RegressionMetrics } from './types';

/**
 * Standardizes a dataset by subtracting the mean and dividing by standard deviation
 */
export function standardize(data: number[]): number[] {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  const std = Math.sqrt(variance);
  
  return data.map(x => (x - mean) / std);
}

/**
 * Calculates robust standard error using bootstrapping
 */
export function calculateRobustStandardError(
  actual: number[],
  predicted: number[],
  iterations: number = 1000
): number {
  const n = actual.length;
  const residuals = actual.map((yi, i) => yi - predicted[i]);
  
  let bootstrapErrors: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Generate bootstrap sample
    const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n));
    const bootstrapResiduals = indices.map(idx => residuals[idx]);
    
    // Calculate standard error for this sample
    const mean = bootstrapResiduals.reduce((a, b) => a + b, 0) / n;
    const variance = bootstrapResiduals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    bootstrapErrors.push(Math.sqrt(variance));
  }
  
  // Return the median of bootstrap standard errors
  return bootstrapErrors.sort((a, b) => a - b)[Math.floor(iterations / 2)];
}

/**
 * Gets t-value for given degrees of freedom and confidence level
 */
export function getTValue(df: number, confidence: number): number {
  // Simplified t-distribution approximation
  // For more accurate values, consider using a statistical library
  const z = Math.abs(Math.sqrt(2 * Math.log(1 / (1 - confidence))));
  return z * (1 + (1 + z * z) / (4 * df));
}

/**
 * Calculates comprehensive regression metrics
 */
export function calculateRegressionMetrics(
  actual: number[],
  predicted: number[]
): RegressionMetrics {
  const n = actual.length;
  const residuals = actual.map((yi, i) => yi - predicted[i]);
  
  // Basic metrics
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  
  // R-squared and adjusted R-squared
  const meanY = actual.reduce((a, b) => a + b, 0) / n;
  const totalSS = actual.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const residualSS = residuals.reduce((acc, r) => acc + r * r, 0);
  const rSquared = 1 - (residualSS / totalSS);
  const rSquaredAdj = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);
  
  // Information criteria
  const k = 2; // number of parameters (slope and intercept)
  const aic = n * Math.log(mse) + 2 * k;
  const bic = n * Math.log(mse) + Math.log(n) * k;
  
  // Durbin-Watson test for autocorrelation
  const dw = residuals.slice(1).reduce((acc, curr, i) => 
    acc + Math.pow(curr - residuals[i], 2), 0) / residualSS;
  
  return {
    mse,
    rmse,
    mae,
    rSquared,
    rSquaredAdj,
    aic,
    bic,
    durbinWatson: dw
  };
}

export function calculateRSquared(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const totalSS = actual.reduce((ss, y) => ss + Math.pow(y - mean, 2), 0);
  const residualSS = actual.reduce((ss, y, i) => ss + Math.pow(y - predicted[i], 2), 0);
  return 1 - (residualSS / totalSS);
}

export function calculateAIC(n: number, mse: number, p: number): number {
  return n * Math.log(mse) + 2 * p;
}

export function calculateBIC(n: number, mse: number, p: number): number {
  return n * Math.log(mse) + Math.log(n) * p;
}

export function calculateConfidenceIntervals(
  predictions: number[],
  residuals: number[],
  confidence = 0.95
): {
  upper: number[];
  lower: number[];
} {
  const n = predictions.length;
  const standardError = Math.sqrt(
    residuals.reduce((acc, r) => acc + r * r, 0) / (n - 2)
  );
  const tValue = getTValue(n - 2, 1 - (1 - confidence) / 2);
  const margin = tValue * standardError;
  
  return {
    upper: predictions.map(p => p + margin),
    lower: predictions.map(p => p - margin)
  };
}

export function calculateDurbinWatson(residuals: number[]): number {
  let numerator = 0;
  for (let i = 1; i < residuals.length; i++) {
    numerator += Math.pow(residuals[i] - residuals[i - 1], 2);
  }
  const denominator = residuals.reduce((sum, r) => sum + Math.pow(r, 2), 0);
  return numerator / denominator;
}