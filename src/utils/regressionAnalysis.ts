export interface RegressionMetrics {
  r2: number;
  rmse: number;
  mae: number;
  stdError: number;
  confidence: {
    upper: number[];
    lower: number[];
  };
}

export const calculateRSquared = (actual: number[], predicted: number[]): number => {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const ssTotal = actual.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0);
  const ssResidual = actual.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
  return 1 - (ssResidual / ssTotal);
};

export const calculateStandardError = (residuals: number[]): number => {
  const n = residuals.length;
  const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumSquaredResiduals / (n - 2));
};

export const calculateRMSE = (residuals: number[]): number => {
  const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumSquaredResiduals / residuals.length);
};

export const calculateMAE = (residuals: number[]): number => {
  const sumAbsoluteResiduals = residuals.reduce((sum, r) => sum + Math.abs(r), 0);
  return sumAbsoluteResiduals / residuals.length;
};

export const calculateConfidenceIntervals = (
  predictions: number[],
  standardError: number
): { upper: number[]; lower: number[] } => {
  const zScore = 1.96; // 95% confidence interval
  return {
    upper: predictions.map(p => p + zScore * standardError),
    lower: predictions.map(p => p - zScore * standardError)
  };
};

export const calculateRegressionMetrics = (
  actual: number[],
  predicted: number[]
): RegressionMetrics => {
  if (actual.length !== predicted.length) {
    throw new Error('Actual and predicted arrays must be the same length');
  }

  const residuals = actual.map((y, i) => y - predicted[i]);
  const r2 = calculateRSquared(actual, predicted);
  const rmse = calculateRMSE(residuals);
  const mae = calculateMAE(residuals);
  const stdError = calculateStandardError(residuals);
  const confidence = calculateConfidenceIntervals(predicted, stdError);

  return { r2, rmse, mae, stdError, confidence };
}; 