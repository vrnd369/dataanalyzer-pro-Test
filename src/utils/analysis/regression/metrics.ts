import { DataField } from '@/types/data';

// Matrix operations helper functions
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

function multiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function solve(A: number[][], b: number[][]): number[][] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i][0]]);
  
  // Gaussian elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }
    
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    for (let j = i + 1; j < n; j++) {
      const factor = augmented[j][i] / augmented[i][i];
      for (let k = i; k <= n; k++) {
        augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += augmented[i][j] * x[j];
    }
    x[i] = (augmented[i][n] - sum) / augmented[i][i];
  }
  
  return x.map(xi => [xi]);
}

interface RegressionMetrics {
  r2Score: number;
  rmse: number;
  mae: number;
  adjustedR2: number;
}

/**
 * Calculates regression metrics for a given field
 */
export function calculateRegressionMetrics(
  actual: number[],
  predicted: number[],
  numFeatures: number = 1
): RegressionMetrics {
  if (actual.length !== predicted.length || actual.length === 0) {
    return {
      r2Score: NaN,
      rmse: NaN,
      mae: NaN,
      adjustedR2: NaN
    };
  }

  const n = actual.length;
  const residuals = actual.map((y, i) => y - predicted[i]);
  
  // Basic metrics
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((acc, r) => acc + Math.abs(r), 0) / n;
  
  // R-squared calculations
  const mean = actual.reduce((a, b) => a + b, 0) / n;
  const totalSS = actual.reduce((acc, y) => acc + Math.pow(y - mean, 2), 0);
  const residualSS = residuals.reduce((acc, r) => acc + r * r, 0);
  const rSquared = 1 - (residualSS / totalSS);
  const adjustedR2 = 1 - ((1 - rSquared) * (n - 1)) / (n - numFeatures - 1);
  
  return {
    r2Score: rSquared,
    rmse,
    mae,
    adjustedR2
  };
}

/**
 * Performs linear regression on a data field
 */
export function performLinearRegression(field: DataField) {
  const x = field.value as number[];
  const y = field.value as number[];
  
  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  
  // Calculate coefficients
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < x.length; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate predictions
  const predictions = x.map(x => slope * x + intercept);
  
  // Calculate metrics
  const metrics = calculateRegressionMetrics(y, predictions, 2); // 2 parameters: slope and intercept
  
  return {
    coefficients: [intercept, slope], // Include both intercept and slope
    predictions,
    metrics
  };
}

export function performPolynomialRegression(field: DataField, degree: number) {
  const x = field.value as number[];
  const y = field.value as number[];

  // Create design matrix X with polynomial terms
  const X = x.map(xi => {
    const row = [];
    for (let d = 0; d <= degree; d++) {
      row.push(Math.pow(xi, d));
    }
    return row;
  });
  
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const XtY = multiply(Xt, y.map(yi => [yi]));
  const coefficients = solve(XtX, XtY).map(row => row[0]);
  
  const predictions = X.map(row => {
    return row.reduce((sum, x, i) => sum + x * coefficients[i], 0);
  });

  // Pass the correct number of parameters (degree + 1 for polynomial regression)
  const metrics = calculateRegressionMetrics(y, predictions, degree + 1);
  
  return {
    coefficients,
    predictions,
    metrics
  };
}

/**
 * Calculates the R-squared (coefficient of determination) value
 * R² = 1 - (SSres / SStot)
 * where SSres is the sum of squared residuals and SStot is the total sum of squares
 */
export const calculateRSquared = (actual: number[], predicted: number[]): number => {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const ssTotal = actual.reduce((sum, yi) => sum + Math.pow(yi - mean, 2), 0);
  const ssResidual = actual.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
  return 1 - (ssResidual / ssTotal);
};

/**
 * Calculates the standard error of the regression
 * SE = sqrt(Σ(y - ŷ)² / (n-2))
 * where n is the number of observations
 */
export const calculateStandardError = (residuals: number[]): number => {
  const n = residuals.length;
  const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumSquaredResiduals / (n - 2));
};

/**
 * Calculates the Root Mean Square Error (RMSE)
 * RMSE = sqrt(Σ(y - ŷ)² / n)
 * where n is the number of observations
 */
export const calculateRMSE = (residuals: number[]): number => {
  const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
  return Math.sqrt(sumSquaredResiduals / residuals.length);
};

/**
 * Calculates the Mean Absolute Error (MAE)
 * MAE = Σ|y - ŷ| / n
 * where n is the number of observations
 */
export const calculateMAE = (residuals: number[]): number => {
  const sumAbsoluteResiduals = residuals.reduce((sum, r) => sum + Math.abs(r), 0);
  return sumAbsoluteResiduals / residuals.length;
};

/**
 * Calculates the 95% confidence intervals for predictions
 * CI = ŷ ± (z * SE)
 * where z is the z-score (1.96 for 95% confidence)
 * and SE is the standard error
 */
export const calculateConfidenceIntervals = (
  predictions: number[],
  standardError: number
): { upper: number[]; lower: number[] } => {
  const zScore = 1.96; // 95% confidence level
  return {
    upper: predictions.map(p => p + zScore * standardError),
    lower: predictions.map(p => p - zScore * standardError)
  };
}; 