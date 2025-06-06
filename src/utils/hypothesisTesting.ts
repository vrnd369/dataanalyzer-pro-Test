export interface HypothesisTestResult {
  testType: 't-test' | 'z-test' | 'anova' | 'chi-square';
  statistic: number;
  pValue: number;
  criticalValue: number;
  isSignificant: boolean;
  confidenceInterval: [number, number];
  degreesOfFreedom?: number;
  nullHypothesis: string;
  alternativeHypothesis: string;
  conclusion: string;
}

export interface TTestParams {
  sample1: number[];
  sample2: number[];
  alpha: number;
  isPaired?: boolean;
}

export interface ZTestParams {
  sample: number[];
  populationMean: number;
  populationStdDev: number;
  alpha: number;
}

export interface AnovaParams {
  groups: number[][];
  alpha: number;
}

export interface ChiSquareParams {
  observed: number[];
  expected: number[];
  alpha: number;
}

export const calculateTTest = (params: TTestParams): HypothesisTestResult => {
  const { sample1, sample2, alpha, isPaired = false } = params;
  
  // Calculate means and standard deviations
  const mean1 = sample1.reduce((a, b) => a + b) / sample1.length;
  const mean2 = sample2.reduce((a, b) => a + b) / sample2.length;
  
  const variance1 = sample1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
  const variance2 = sample2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
  
  // Calculate pooled variance for independent samples
  const pooledVariance = isPaired ? 
    variance1 : 
    ((sample1.length - 1) * variance1 + (sample2.length - 1) * variance2) / (sample1.length + sample2.length - 2);
  
  // Calculate standard error
  const standardError = isPaired ?
    Math.sqrt(variance1 / sample1.length) :
    Math.sqrt(pooledVariance * (1/sample1.length + 1/sample2.length));
  
  // Calculate t-statistic
  const tStatistic = (mean1 - mean2) / standardError;
  
  // Calculate degrees of freedom
  const df = isPaired ? sample1.length - 1 : sample1.length + sample2.length - 2;
  
  // Calculate p-value (two-tailed)
  const pValue = 2 * (1 - studentT(Math.abs(tStatistic), df));
  
  // Calculate critical value
  const criticalValue = inverseStudentT(1 - alpha/2, df);
  
  // Calculate confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    (mean1 - mean2) - marginOfError,
    (mean1 - mean2) + marginOfError
  ];
  
  const isSignificant = pValue < alpha;
  const conclusion = isSignificant
    ? 'Reject H0: There is significant evidence of a difference between the two samples'
    : 'Fail to reject H0: There is not enough evidence to conclude a difference between the two samples';
  
  return {
    testType: 't-test',
    statistic: tStatistic,
    pValue,
    criticalValue,
    isSignificant,
    confidenceInterval,
    degreesOfFreedom: df,
    nullHypothesis: 'H0: μ1 = μ2 (no difference between means)',
    alternativeHypothesis: 'H1: μ1 ≠ μ2 (means are different)',
    conclusion
  };
};

export const calculateZTest = (params: ZTestParams): HypothesisTestResult => {
  const { sample, populationMean, populationStdDev, alpha } = params;
  
  const sampleMean = sample.reduce((a, b) => a + b) / sample.length;
  const standardError = populationStdDev / Math.sqrt(sample.length);
  
  // Calculate z-statistic
  const zStatistic = (sampleMean - populationMean) / standardError;
  
  // Calculate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)));
  
  // Calculate critical value
  const criticalValue = inverseNormalCDF(1 - alpha/2);
  
  // Calculate confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];
  
  const isSignificant = pValue < alpha;
  const conclusion = isSignificant
    ? 'Reject H0: There is significant evidence that the sample mean differs from the population mean'
    : 'Fail to reject H0: There is not enough evidence to conclude that the sample mean differs from the population mean';
  
  return {
    testType: 'z-test',
    statistic: zStatistic,
    pValue,
    criticalValue,
    isSignificant,
    confidenceInterval,
    nullHypothesis: 'H0: μ = μ0 (sample mean equals population mean)',
    alternativeHypothesis: 'H1: μ ≠ μ0 (sample mean differs from population mean)',
    conclusion
  };
};

export const calculateAnova = (params: AnovaParams): HypothesisTestResult => {
  const { groups, alpha } = params;
  
  // Calculate overall mean
  const allValues = groups.flat();
  const overallMean = allValues.reduce((a, b) => a + b) / allValues.length;
  
  // Calculate between-group sum of squares
  const betweenGroupSS = groups.reduce((acc, group) => {
    const groupMean = group.reduce((a, b) => a + b) / group.length;
    return acc + group.length * Math.pow(groupMean - overallMean, 2);
  }, 0);
  
  // Calculate within-group sum of squares
  const withinGroupSS = groups.reduce((acc, group) => {
    const groupMean = group.reduce((a, b) => a + b) / group.length;
    return acc + group.reduce((sum, val) => sum + Math.pow(val - groupMean, 2), 0);
  }, 0);
  
  // Calculate degrees of freedom
  const betweenGroupDF = groups.length - 1;
  const withinGroupDF = allValues.length - groups.length;
  
  // Calculate mean squares
  const betweenGroupMS = betweenGroupSS / betweenGroupDF;
  const withinGroupMS = withinGroupSS / withinGroupDF;
  
  // Calculate F-statistic
  const fStatistic = betweenGroupMS / withinGroupMS;
  
  // Calculate p-value
  const pValue = 1 - fDistribution(fStatistic, betweenGroupDF, withinGroupDF);
  
  const isSignificant = pValue < alpha;
  const conclusion = isSignificant
    ? 'Reject H0: There is significant evidence of differences between groups'
    : 'Fail to reject H0: There is not enough evidence to conclude differences between groups';
  
  return {
    testType: 'anova',
    statistic: fStatistic,
    pValue,
    criticalValue: inverseFDistribution(1 - alpha, betweenGroupDF, withinGroupDF),
    isSignificant,
    confidenceInterval: [0, 0], // Not applicable for ANOVA
    degreesOfFreedom: betweenGroupDF,
    nullHypothesis: 'H0: All group means are equal',
    alternativeHypothesis: 'H1: At least one group mean differs',
    conclusion
  };
};

export const calculateChiSquare = (params: ChiSquareParams): HypothesisTestResult => {
  const { observed, expected: expectedFreqs, alpha } = params;

  if (observed.length !== expectedFreqs.length) {
    throw new Error('Observed and expected frequencies must have the same length');
  }

  const testStatistic = observed.reduce((sum, obs, i) => {
    const exp = expectedFreqs[i];
    return sum + Math.pow(obs - exp, 2) / exp;
  }, 0);

  const degreesOfFreedom = observed.length - 1;
  const pValue = 1 - chiSquareCDF(testStatistic, degreesOfFreedom);
  const criticalValue = inverseChiSquareCDF(1 - alpha, degreesOfFreedom);

  const conclusion = pValue <= alpha
    ? 'Reject H0: There is significant evidence that the observed frequencies differ from the expected frequencies'
    : 'Fail to reject H0: There is not enough evidence to conclude that the observed frequencies differ from the expected frequencies';

  return {
    testType: 'chi-square',
    statistic: testStatistic,
    pValue,
    criticalValue,
    isSignificant: pValue <= alpha,
    confidenceInterval: [0, 0], // Not applicable for chi-square
    degreesOfFreedom,
    nullHypothesis: 'H0: Observed frequencies match expected frequencies',
    alternativeHypothesis: 'H1: Observed frequencies differ from expected frequencies',
    conclusion
  };
};

// Helper functions for statistical distributions
function studentT(x: number, df: number): number {
  // Implementation of Student's t-distribution CDF
  // This is a simplified version - in production, use a statistical library
  const z = x / Math.sqrt(df);
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function inverseStudentT(p: number, df: number): number {
  // Implementation of inverse Student's t-distribution
  // This is a simplified version - in production, use a statistical library
  const baseValue = 1.96; // Base value for large df
  const adjustment = Math.sqrt(df / (df - 2));
  const probabilityAdjustment = Math.sqrt(-2 * Math.log(1 - p));
  return baseValue * adjustment * probabilityAdjustment;
}

function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function inverseNormalCDF(p: number): number {
  // Implementation of inverse normal CDF
  // This is a simplified version - in production, use a statistical library
  const baseValue = 1.96; // Base value for 95% confidence
  const adjustment = Math.sqrt(-2 * Math.log(1 - p));
  return baseValue * adjustment;
}

function fDistribution(x: number, df1: number, df2: number): number {
  // Implementation of F-distribution CDF
  // This is a simplified version - in production, use a statistical library
  const numerator = Math.pow(x, df1/2);
  const denominator = Math.pow(1 + x, (df1 + df2)/2);
  return numerator / denominator;
}

function inverseFDistribution(p: number, df1: number, df2: number): number {
  // Implementation of inverse F-distribution
  // This is a simplified version - in production, use a statistical library
  const baseValue = 3.84; // Base value for common significance levels
  const adjustment = Math.sqrt(df1 * df2 / (df1 + df2));
  const probabilityAdjustment = Math.sqrt(-2 * Math.log(1 - p));
  return baseValue * adjustment * probabilityAdjustment;
}

function erf(x: number): number {
  // Implementation of error function
  // This is a simplified version - in production, use a statistical library
  return x / (1 + Math.abs(x));
}

// Additional statistical distribution functions
function chiSquareCDF(x: number, df: number): number {
  return gamma(df / 2, x / 2) / gamma(df / 2);
}

function inverseChiSquareCDF(p: number, df: number): number {
  // Implementation of inverse chi-square CDF
  // This is a simplified version - in production, use a statistical library
  const baseValue = df * (1 - 2/(9*df));
  const probabilityAdjustment = Math.sqrt(-2 * Math.log(1 - p));
  const adjustment = Math.sqrt(2/(9*df)) * probabilityAdjustment;
  return baseValue + adjustment;
}

function gamma(z: number, x?: number): number {
  if (x === undefined) {
    return Math.exp(lgamma(z));
  }
  return incompleteGamma(z, x);
}

function lgamma(z: number): number {
  return Math.log(gamma(z));
}

function incompleteGamma(s: number, x: number): number {
  let sum = 1 / s;
  let term = sum;
  for (let i = 1; i < 100; i++) {
    term *= x / (s + i);
    sum += term;
  }
  return Math.pow(x, s) * Math.exp(-x) * sum;
} 