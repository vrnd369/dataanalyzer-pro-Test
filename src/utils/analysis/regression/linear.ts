import { DataField } from '@/types/data';
import { RegressionResult } from './types';
import { standardize, calculateRobustStandardError, getTValue, calculateRegressionMetrics } from './utils';

export function calculateLinearRegression(
  dependent: DataField,
  independent: DataField
): RegressionResult {
  // Standardize values for numerical stability
  const y = standardize(dependent.value as number[]);
  const x = standardize(independent.value as number[]);

  // Calculate regression coefficients
  const n = Math.min(x.length, y.length);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let j = 0; j < n; j++) {
    const xDiff = x[j] - meanX;
    numerator += xDiff * (y[j] - meanY);
    denominator += xDiff * xDiff;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate predictions with confidence intervals
  const predictions = x.map(xi => {
    const predicted = slope * xi + intercept;
    return predicted;
  });

  // Calculate R-squared
  const totalSS = y.reduce((ss, yi) => ss + Math.pow(yi - meanY, 2), 0);
  const residualSS = y.reduce((ss, yi, i) => ss + Math.pow(yi - predictions[i], 2), 0);
  const rSquared = 1 - (residualSS / totalSS);

  // Calculate robust standard error using bootstrapping
  const standardError = calculateRobustStandardError(y, predictions, 1000);

  // Calculate confidence intervals
  const tValue = getTValue(n - 2, 0.975); // 95% confidence level

  const confidence = {
    upper: predictions.map((pred, i) => 
      pred + tValue * standardError * Math.sqrt(1/n + Math.pow(x[i] - meanX, 2)/denominator)
    ),
    lower: predictions.map((pred, i) => 
      pred - tValue * standardError * Math.sqrt(1/n + Math.pow(x[i] - meanX, 2)/denominator)
    )
  };

  // Calculate additional metrics for model validation
  const metrics = calculateRegressionMetrics(y, predictions);

  return {
    field: dependent.name,
    type: 'linear',
    coefficients: [slope],
    intercept,
    rSquared,
    standardError,
    predictions,
    actualValues: y,
    equation: `${dependent.name} = ${intercept.toFixed(3)} + ${slope.toFixed(3)}×${independent.name}`,
    confidence,
    metrics
  };
}