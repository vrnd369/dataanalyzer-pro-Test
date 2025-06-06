import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateLogLogRegression(
  dependent: DataField,
  independent: DataField
): RegressionResult {
  // Check for non-positive values
  const yRaw = dependent.value as number[];
  const xRaw = independent.value as number[];
  
  // Filter out non-positive values
  const validIndices = yRaw.map((yi, i) => yi > 0 && xRaw[i] > 0).map((valid, i) => valid ? i : -1).filter(i => i !== -1);
  
  if (validIndices.length < 2) {
    throw new Error('Log-log regression requires positive values for both dependent and independent variables');
  }
  
  // Extract valid data
  const yValid = validIndices.map(i => yRaw[i]);
  const xValid = validIndices.map(i => xRaw[i]);
  
  // Apply log transformation
  const y = yValid.map(yi => Math.log(yi));
  const x = xValid.map(xi => Math.log(xi));
  
  const n = Math.min(x.length, y.length);
  
  // Calculate coefficients using normal equation
  const xMean = x.reduce((sum, xi) => sum + xi, 0) / n;
  const yMean = y.reduce((sum, yi) => sum + yi, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    numerator += xDiff * (y[i] - yMean);
    denominator += xDiff * xDiff;
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate predictions in log space
  const logPredictions = x.map(xi => intercept + slope * xi);
  
  // Transform back to original space
  const predictions = logPredictions.map(logPred => Math.exp(logPred));
  
  // Calculate metrics in original space
  const meanY = yValid.reduce((a, b) => a + b, 0) / n;
  const totalSS = yValid.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = yValid.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);
  
  // Calculate robust standard error
  const standardError = calculateRobustStandardError(yValid, predictions, 1000);
  
  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level
  
  // Calculate prediction intervals
  const confidence = {
    upper: predictions.map(pred => pred * Math.exp(tValue * standardError)),
    lower: predictions.map(pred => pred / Math.exp(tValue * standardError))
  };
  
  // Calculate additional metrics
  const metrics = calculateRegressionMetrics(yValid, predictions);
  
  // Generate equation string
  const equation = `ln(${dependent.name}) = ${intercept.toFixed(3)} + ${slope.toFixed(3)}×ln(${independent.name})`;
  
  return {
    field: dependent.name,
    type: 'log-log',
    coefficients: [slope], // Exclude intercept
    intercept: Math.exp(intercept), // Transform back to original space
    rSquared,
    standardError,
    predictions,
    actualValues: yValid,
    equation,
    confidence,
    metrics
  };
} 