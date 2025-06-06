import { mean, standardDeviation } from 'simple-statistics';

// Types and Interfaces
export interface HypothesisTest {
  nullHypothesis: string;
  alternativeHypothesis: string;
  significanceLevel: number;
  testStatistic: number;
  pValue: number;
  conclusion: string;
}

export interface TTestResult extends HypothesisTest {
  degreesOfFreedom: number;
  confidenceInterval: [number, number];
}

export interface ChiSquareTestResult extends HypothesisTest {
  degreesOfFreedom: number;
  expectedFrequencies: number[];
}

// Helper Functions
const calculatePValue = (testStatistic: number, distribution: 'normal' | 't' | 'chiSquare', degreesOfFreedom?: number): number => {
  // Implementation of p-value calculation based on distribution type
  // This is a simplified version - in practice, you'd want to use a statistical library
  if (distribution === 'normal') {
    return 2 * (1 - normalCDF(Math.abs(testStatistic)));
  } else if (distribution === 't' && degreesOfFreedom) {
    return 2 * (1 - tCDF(Math.abs(testStatistic), degreesOfFreedom));
  } else if (distribution === 'chiSquare' && degreesOfFreedom) {
    return 1 - chiSquareCDF(testStatistic, degreesOfFreedom);
  }
  throw new Error('Invalid distribution type or missing degrees of freedom');
};

// Statistical Test Implementations
export const oneSampleTTest = (
  sample: number[],
  hypothesizedMean: number,
  significanceLevel: number = 0.05
): TTestResult => {
  const n = sample.length;
  const sampleMean = mean(sample);
  const sampleStd = standardDeviation(sample);
  const standardError = sampleStd / Math.sqrt(n);
  const testStatistic = (sampleMean - hypothesizedMean) / standardError;
  const degreesOfFreedom = n - 1;
  const pValue = calculatePValue(testStatistic, 't', degreesOfFreedom);
  
  const marginOfError = tCriticalValue(degreesOfFreedom, significanceLevel) * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];

  const conclusion = pValue <= significanceLevel
    ? `Reject H0: There is significant evidence that the population mean differs from ${hypothesizedMean}`
    : `Fail to reject H0: There is not enough evidence to conclude that the population mean differs from ${hypothesizedMean}`;

  return {
    nullHypothesis: `H0: μ = ${hypothesizedMean}`,
    alternativeHypothesis: `H1: μ ≠ ${hypothesizedMean}`,
    significanceLevel,
    testStatistic,
    pValue,
    degreesOfFreedom,
    confidenceInterval,
    conclusion
  };
};

export const twoSampleTTest = (
  sample1: number[],
  sample2: number[],
  significanceLevel: number = 0.05
): TTestResult => {
  const n1 = sample1.length;
  const n2 = sample2.length;
  const mean1 = mean(sample1);
  const mean2 = mean(sample2);
  const std1 = standardDeviation(sample1);
  const std2 = standardDeviation(sample2);
  
  const pooledVariance = ((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2);
  const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
  const testStatistic = (mean1 - mean2) / standardError;
  const degreesOfFreedom = n1 + n2 - 2;
  const pValue = calculatePValue(testStatistic, 't', degreesOfFreedom);

  const marginOfError = tCriticalValue(degreesOfFreedom, significanceLevel) * standardError;
  const confidenceInterval: [number, number] = [
    (mean1 - mean2) - marginOfError,
    (mean1 - mean2) + marginOfError
  ];

  const conclusion = pValue <= significanceLevel
    ? 'Reject H0: There is significant evidence of a difference between the two population means'
    : 'Fail to reject H0: There is not enough evidence to conclude a difference between the two population means';

  return {
    nullHypothesis: 'H0: μ1 = μ2',
    alternativeHypothesis: 'H1: μ1 ≠ μ2',
    significanceLevel,
    testStatistic,
    pValue,
    degreesOfFreedom,
    confidenceInterval,
    conclusion
  };
};

export const chiSquareTest = (
  observedFrequencies: number[],
  expectedFrequencies: number[],
  significanceLevel: number = 0.05
): ChiSquareTestResult => {
  if (observedFrequencies.length !== expectedFrequencies.length) {
    throw new Error('Observed and expected frequencies must have the same length');
  }

  const testStatistic = observedFrequencies.reduce((sum, observed, i) => {
    const expected = expectedFrequencies[i];
    return sum + Math.pow(observed - expected, 2) / expected;
  }, 0);

  const degreesOfFreedom = observedFrequencies.length - 1;
  const pValue = calculatePValue(testStatistic, 'chiSquare', degreesOfFreedom);

  const conclusion = pValue <= significanceLevel
    ? 'Reject H0: There is significant evidence that the observed frequencies differ from the expected frequencies'
    : 'Fail to reject H0: There is not enough evidence to conclude that the observed frequencies differ from the expected frequencies';

  return {
    nullHypothesis: 'H0: Observed frequencies match expected frequencies',
    alternativeHypothesis: 'H1: Observed frequencies differ from expected frequencies',
    significanceLevel,
    testStatistic,
    pValue,
    degreesOfFreedom,
    expectedFrequencies,
    conclusion
  };
};

// Statistical Distribution Functions
const normalCDF = (x: number): number => {
  // Implementation of normal cumulative distribution function
  // This is a simplified version - in practice, you'd want to use a statistical library
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

const tCDF = (x: number, df: number): number => {
  // Implementation of t-distribution cumulative distribution function
  // This is a simplified version - in practice, you'd want to use a statistical library
  return 0.5 + x * gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * gamma(df / 2));
};

const chiSquareCDF = (x: number, df: number): number => {
  // Implementation of chi-square cumulative distribution function
  // This is a simplified version - in practice, you'd want to use a statistical library
  return gamma(df / 2, x / 2) / gamma(df / 2);
};

const tCriticalValue = (df: number, alpha: number): number => {
  // Implementation of t-distribution critical value
  // This is a simplified version - in practice, you'd want to use a statistical library
  return Math.abs(inverseTCDF(alpha / 2, df));
};

// Helper mathematical functions
const erf = (x: number): number => {
  // Error function implementation
  const t = 1.0 / (1.0 + 0.5 * Math.abs(x));
  const tau = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? 1 - tau : tau - 1;
};

const gamma = (z: number, x?: number): number => {
  // Gamma function implementation
  // This is a simplified version - in practice, you'd want to use a mathematical library
  if (x === undefined) {
    return Math.exp(lgamma(z));
  }
  return incompleteGamma(z, x);
};

const lgamma = (z: number): number => {
  // Log gamma function implementation
  // This is a simplified version - in practice, you'd want to use a mathematical library
  return Math.log(gamma(z));
};

const incompleteGamma = (s: number, x: number): number => {
  // Incomplete gamma function implementation
  // This is a simplified version - in practice, you'd want to use a mathematical library
  let sum = 1 / s;
  let term = sum;
  for (let i = 1; i < 100; i++) {
    term *= x / (s + i);
    sum += term;
  }
  return Math.pow(x, s) * Math.exp(-x) * sum;
};

const inverseTCDF = (p: number, df: number): number => {
  // Inverse t-distribution CDF implementation
  // This is a simplified version - in practice, you'd want to use a statistical library
  const x = inverseNormalCDF(p);
  return x * Math.sqrt(df / (df - 2));
};

const inverseNormalCDF = (p: number): number => {
  // Inverse normal CDF implementation
  // This is a simplified version - in practice, you'd want to use a statistical library
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614201e+01;
  const a6 = 2.506628277459239e+00;
  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;
  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;
  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q, r, x;

  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p > p_high) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else {
    q = p - 0.5;
    r = q * q;
    x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }

  return x;
};

// One-sample t-test
const result = oneSampleTTest([1, 2, 3, 4, 5], 3, 0.05);
console.log(result.conclusion);

// Two-sample t-test
const result2 = twoSampleTTest([1, 2, 3], [4, 5, 6], 0.05);
console.log(result2.conclusion);

// Chi-square test
const result3 = chiSquareTest([10, 20, 30], [15, 15, 30], 0.05);
console.log(result3.conclusion); 