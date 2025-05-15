export type RegressionType = 'linear' | 'polynomial' | 'ridge' | 'lasso' | 'elastic-net' | 'logistic' | 'quantile' | 'time-series' | 'log-log';

export interface RegressionMetrics {
  mse: number;
  rmse: number;
  mae: number;
  rSquared: number;
  rSquaredAdj: number;
  aic: number;
  bic: number;
  durbinWatson: number;
}

export interface RegressionResult {
  field: string;
  type: RegressionType;
  coefficients: number[];
  intercept: number;
  rSquared: number;
  standardError: number;
  predictions: number[];
  actualValues: number[];
  equation: string;
  confidence: {
    upper: number[];
    lower: number[];
  };
  metrics: RegressionMetrics;
}

export interface RegressionOptions {
  type: RegressionType;
  polynomialDegree?: number;
  alpha?: number; // Regularization parameter for Ridge/Lasso
  l1Ratio?: number; // Elastic Net mixing parameter
  quantile?: number; // Quantile regression parameter
  stepwiseThreshold?: number;
  timeSeriesLag?: number;
  selectedFeatures?: number[];
  validationMetrics?: {
    crossValidationScore: number;
    testSetScore: number;
  };
}

export interface ConfidenceInterval {
  upper: number[];
  lower: number[];
}

export interface LinearRegressionResult {
  equation: string;
  slope: number;
  intercept: number;
  rSquared: number;
  confidenceIntervals: ConfidenceInterval;
  metrics: RegressionMetrics;
  predictions: number[];
  standardError: number;
}