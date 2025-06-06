/**
 * Comprehensive regression metrics calculator
 * This file provides functions to calculate various regression metrics
 */

export interface RegressionMetricsResult {
  r2Score: number;
  rmse: number;
  mae: number;
  adjustedR2: number;
  aic: number;
  bic: number;
  crossValidation: number;
  fStatistic: number;
  pValue: number;
  residuals: number[];
  confidenceIntervals: Array<[number, number]>;
}

/**
 * Calculate R-squared score
 * @param actual Actual values
 * @param predicted Predicted values
 * @returns R-squared score
 */
export function calculateR2Score(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return NaN;
  }

  const mean = actual.reduce((a, b) => a + b) / actual.length;
  const totalSS = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const residualSS = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  
  return 1 - (residualSS / totalSS);
}

/**
 * Calculate Root Mean Square Error (RMSE)
 * @param actual Actual values
 * @param predicted Predicted values
 * @returns RMSE value
 */
export function calculateRMSE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return NaN;
  }

  const residuals = actual.map((val, i) => val - predicted[i]);
  const mse = residuals.reduce((acc, r) => acc + r * r, 0) / actual.length;
  
  return Math.sqrt(mse);
}

/**
 * Calculate Mean Absolute Error (MAE)
 * @param actual Actual values
 * @param predicted Predicted values
 * @returns MAE value
 */
export function calculateMAE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return NaN;
  }

  const residuals = actual.map((val, i) => val - predicted[i]);
  
  return residuals.reduce((acc, r) => acc + Math.abs(r), 0) / actual.length;
}

/**
 * Calculate Adjusted R-squared
 * @param r2 R-squared value
 * @param n Sample size
 * @param p Number of predictors
 * @returns Adjusted R-squared value
 */
export function calculateAdjustedR2(r2: number, n: number, p: number): number {
  if (n <= p + 1) {
    return NaN;
  }
  
  return 1 - ((1 - r2) * (n - 1)) / (n - p - 1);
}

/**
 * Calculate Akaike Information Criterion (AIC)
 * @param rmse Root Mean Square Error
 * @param numParams Number of parameters in the model
 * @returns AIC value
 */
export function calculateAIC(rmse: number, numParams: number): number {
  return 2 * numParams - 2 * Math.log(rmse);
}

/**
 * Calculate Bayesian Information Criterion (BIC)
 * @param rmse Root Mean Square Error
 * @param numParams Number of parameters in the model
 * @param sampleSize Sample size
 * @returns BIC value
 */
export function calculateBIC(rmse: number, numParams: number, sampleSize: number): number {
  return Math.log(sampleSize) * numParams - 2 * Math.log(rmse);
}

/**
 * Calculate F-statistic
 * @param r2 R-squared value
 * @param numParams Number of parameters in the model
 * @param sampleSize Sample size
 * @returns F-statistic value
 */
export function calculateFStatistic(r2: number, numParams: number, sampleSize: number): number {
  if (numParams <= 1 || sampleSize <= numParams) {
    return NaN;
  }
  
  return (r2 / (numParams - 1)) / ((1 - r2) / (sampleSize - numParams));
}

/**
 * Calculate p-value from F-statistic
 * @param fStat F-statistic value
 * @returns p-value
 */
export function calculatePValue(fStat: number): number {
  // Simplified p-value calculation using exponential approximation
  return Math.exp(-fStat / 2);
}

/**
 * Calculate residuals
 * @param actual Actual values
 * @param predicted Predicted values
 * @returns Array of residuals
 */
export function calculateResiduals(actual: number[], predicted: number[]): number[] {
  if (actual.length !== predicted.length) {
    return [];
  }
  
  return actual.map((val, i) => val - predicted[i]);
}

/**
 * Calculate confidence intervals for coefficients
 * @param coefficients Model coefficients
 * @param rmse Root Mean Square Error
 * @param confidenceLevel Confidence level (e.g., 0.95 for 95%)
 * @returns Array of confidence intervals [lower, upper]
 */
export function calculateConfidenceIntervals(
  coefficients: number[],
  rmse: number,
  confidenceLevel: number
): Array<[number, number]> {
  // Z-score for different confidence levels
  const zScores: Record<number, number> = {
    0.8: 1.282,
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  
  // Default to 95% confidence if not specified
  const zScore = zScores[confidenceLevel] || zScores[0.95];
  
  return coefficients.map(coef => [
    coef - zScore * rmse,
    coef + zScore * rmse
  ]);
}

/**
 * Perform k-fold cross-validation
 * @param x Feature values
 * @param y Target values
 * @param folds Number of folds
 * @returns Cross-validation score
 */
export function performCrossValidation(x: number[], y: number[], folds: number): number {
  if (x.length !== y.length || x.length < folds) {
    return NaN;
  }
  
  const foldSize = Math.floor(x.length / folds);
  let totalScore = 0;
  
  for (let i = 0; i < folds; i++) {
    const start = i * foldSize;
    const end = start + foldSize;
    
    // Split data into training and testing sets
    const testX = x.slice(start, end);
    const testY = y.slice(start, end);
    const trainX = [...x.slice(0, start), ...x.slice(end)];
    const trainY = [...y.slice(0, start), ...y.slice(end)];
    
    // Fit model on training data
    const coefficients = fitLinearRegression(trainX, trainY);
    
    // Make predictions on test data
    const predictions = testX.map(x => coefficients[0] + coefficients[1] * x);
    
    // Calculate R² score for this fold
    const score = calculateR2Score(testY, predictions);
    totalScore += score;
  }
  
  return totalScore / folds;
}

/**
 * Fit linear regression model
 * @param x Feature values
 * @param y Target values
 * @returns Array of coefficients [intercept, slope]
 */
function fitLinearRegression(x: number[], y: number[]): number[] {
  if (x.length !== y.length || x.length < 2) {
    return [0, 0];
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return [intercept, slope];
}

/**
 * Calculate all regression metrics
 * @param actual Actual values
 * @param predicted Predicted values
 * @param numParams Number of parameters in the model
 * @param x Feature values (for cross-validation)
 * @param y Target values (for cross-validation)
 * @param folds Number of folds for cross-validation
 * @param confidenceLevel Confidence level for intervals
 * @returns Comprehensive regression metrics
 */
export function calculateAllRegressionMetrics(
  actual: number[],
  predicted: number[],
  numParams: number,
  x?: number[],
  y?: number[],
  folds: number = 5,
  confidenceLevel: number = 0.95
): RegressionMetricsResult {
  // Input validation
  if (!Array.isArray(actual) || !Array.isArray(predicted) || actual.length === 0 || predicted.length === 0) {
    throw new Error('Invalid input data: actual and predicted arrays must be non-empty arrays');
  }

  if (actual.length !== predicted.length) {
    throw new Error('Invalid input data: actual and predicted arrays must have the same length');
  }

  // Remove any pairs where either value is NaN or Infinity
  const validPairs = actual.map((a, i) => ({ actual: a, predicted: predicted[i] }))
    .filter(pair => !isNaN(pair.actual) && !isNaN(pair.predicted) && 
                    isFinite(pair.actual) && isFinite(pair.predicted));

  if (validPairs.length === 0) {
    throw new Error('No valid data points found after filtering NaN and Infinity values');
  }

  const validActual = validPairs.map(p => p.actual);
  const validPredicted = validPairs.map(p => p.predicted);

  // Calculate basic metrics
  const r2Score = calculateR2Score(validActual, validPredicted);
  const rmse = calculateRMSE(validActual, validPredicted);
  const mae = calculateMAE(validActual, validPredicted);
  const adjustedR2 = calculateAdjustedR2(r2Score, validActual.length, numParams);
  const aic = calculateAIC(rmse, numParams);
  const bic = calculateBIC(rmse, numParams, validActual.length);
  const fStatistic = calculateFStatistic(r2Score, numParams, validActual.length);
  const pValue = calculatePValue(fStatistic);
  const residuals = calculateResiduals(validActual, validPredicted);

  // Calculate confidence intervals
  const confidenceIntervals = calculateConfidenceIntervals(
    [r2Score], // Using R² as the coefficient for simplicity
    rmse,
    confidenceLevel
  );

  // Calculate cross-validation score if x and y are provided
  let crossValidation = 0;
  if (x && y && x.length === y.length && x.length > 0) {
    try {
      crossValidation = performCrossValidation(x, y, folds);
    } catch (err) {
      console.warn('Cross-validation calculation failed:', err);
      crossValidation = 0;
    }
  }

  return {
    r2Score,
    rmse,
    mae,
    adjustedR2,
    aic,
    bic,
    crossValidation,
    fStatistic,
    pValue,
    residuals,
    confidenceIntervals
  };
}

export function calculateFeatureImportance(
  x: number[],
  y: number[],
  coefficients: number[]
): Array<{ name: string; importance: number }> {
  // Calculate feature importance based on standardized coefficients
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const xStd = Math.sqrt(x.reduce((a, b) => a + Math.pow(b - xMean, 2), 0) / x.length);
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  const yStd = Math.sqrt(y.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) / y.length);

  const standardizedCoefficient = coefficients[0] * (xStd / yStd);
  const importance = Math.abs(standardizedCoefficient);

  return [{
    name: 'Feature',
    importance
  }];
}

export function calculateMulticollinearity(x: number[]): Array<{ name: string; vif: number }> {
  // Calculate Variance Inflation Factor (VIF)
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const xCentered = x.map(xi => xi - xMean);
  const xSquared = xCentered.map(xi => xi * xi);
  const sumXSquared = xSquared.reduce((a, b) => a + b, 0);
  
  // Calculate VIF using sum of squared deviations
  const vif = sumXSquared > 0 ? x.length / sumXSquared : 1;
  
  return [{
    name: 'Feature',
    vif
  }];
}

export function calculateRegularizationPath(
  x: number[],
  y: number[],
  modelType: string
): Array<{ alpha: number; coefficients: number[] }> {
  // Generate regularization path for different alpha values
  const alphas = [0.001, 0.01, 0.1, 1, 10, 100];
  return alphas.map(alpha => {
    let coefficient: number;
    
    switch (modelType) {
      case 'ridge':
        // Ridge regression coefficient
        const xMean = x.reduce((a, b) => a + b, 0) / x.length;
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        const xCentered = x.map(xi => xi - xMean);
        const yCentered = y.map(yi => yi - yMean);
        const numerator = xCentered.reduce((sum, xi, i) => sum + xi * yCentered[i], 0);
        const denominator = xCentered.reduce((sum, xi) => sum + xi * xi, 0) + alpha;
        coefficient = numerator / denominator;
        break;
        
      case 'lasso':
        // Lasso regression coefficient (simplified)
        coefficient = Math.sign(x.reduce((sum, xi, i) => sum + xi * y[i], 0)) * 
          Math.max(0, Math.abs(x.reduce((sum, xi, i) => sum + xi * y[i], 0)) - alpha);
        break;
        
      default:
        // Default to ridge-like behavior
        coefficient = x.reduce((sum, xi, i) => sum + xi * y[i], 0) / 
          (x.reduce((sum, xi) => sum + xi * xi, 0) + alpha);
    }
    
    return {
      alpha,
      coefficients: [coefficient]
    };
  });
}

export function generateResidualPlot(actual: number[], predicted: number[]): string {
  // Generate base64 encoded residual plot
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set canvas size
  canvas.width = 400;
  canvas.height = 300;

  // Draw residual plot
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate residuals
  const residuals = actual.map((yi, i) => yi - predicted[i]);

  // Draw points
  ctx.fillStyle = 'blue';
  residuals.forEach((residual, i) => {
    const x = (i / residuals.length) * canvas.width;
    const y = (canvas.height / 2) - (residual * 50); // Scale residuals
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  return canvas.toDataURL();
}

export function generateQQPlot(residuals: number[]): string {
  // Generate base64 encoded Q-Q plot
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set canvas size
  canvas.width = 400;
  canvas.height = 300;

  // Draw Q-Q plot
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sort residuals
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  
  // Calculate theoretical quantiles
  const theoreticalQuantiles = sortedResiduals.map((_, i) => {
    const p = (i + 0.5) / sortedResiduals.length;
    return -1.96 + (1.96 + 1.96) * p;
  });

  // Draw points
  ctx.fillStyle = 'blue';
  sortedResiduals.forEach((residual, i) => {
    const x = (theoreticalQuantiles[i] + 1.96) * (canvas.width / (2 * 1.96));
    const y = canvas.height - (residual + 1.96) * (canvas.height / (2 * 1.96));
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  return canvas.toDataURL();
}

export function generateLeveragePlot(x: number[], residuals: number[]): string {
  // Generate base64 encoded leverage plot
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set canvas size
  canvas.width = 400;
  canvas.height = 300;

  // Draw leverage plot
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate leverages
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const leverages = x.map(xi => Math.pow(xi - xMean, 2) / 
    x.reduce((sum, xj) => sum + Math.pow(xj - xMean, 2), 0));

  // Draw points
  ctx.fillStyle = 'blue';
  leverages.forEach((leverage, i) => {
    const x = leverage * canvas.width;
    const y = canvas.height - (Math.abs(residuals[i]) * 50); // Scale residuals
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  return canvas.toDataURL();
} 