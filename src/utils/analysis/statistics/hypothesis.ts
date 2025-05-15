import { DataField } from '@/types/data';

export interface HypothesisTest {
  name: string;
  testType: 'mean' | 'variance' | 'proportion' | 'correlation';
  nullHypothesis: string;
  alternativeHypothesis: string;
  statistic: number;
  pValue: number;
  criticalValue: number;
  alpha: number;
  significant: boolean;
  interpretation: string;
  effectSize: number;
  power: number;
}

// Error function implementation
function erf(x: number): number {
  // Constants for the approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Natural logarithm of the gamma function
function lgamma(x: number): number {
  // Lanczos approximation
  const c = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp = (x + 0.5) * Math.log(tmp) - tmp;
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += c[j] / y;
  }

  return tmp + Math.log(2.5066282746310005 * ser / x);
}

// More accurate t-distribution implementation
function tDistribution(t: number, df: number): number {
  const x = (df + 1) / 2;
  const y = Math.pow(1 + (t * t) / df, -x);
  const beta = Math.exp(
    lgamma(x) + lgamma(0.5) - lgamma(x + 0.5)
  );
  return 1 - (y / (2 * beta));
}

// More accurate chi-square distribution implementation
function chiSquareDistribution(x: number, df: number): number {
  const k = df / 2;
  return 1 - Math.exp(-x / 2) * Math.pow(x / 2, k - 1) / Math.exp(lgamma(k));
}

// Normal distribution using error function
function normalDistribution(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// Critical value functions
function getTCriticalValue(alpha: number, df: number): number {
  // More accurate t-distribution critical value
  const a = 1 - alpha;
  if (df === 1) return Math.tan(Math.PI * (a - 0.5));
  if (df === 2) return Math.sqrt(2 / (a * (2 - a)) - 2);
  const h = 2 / (1 / (df - 0.5) + 1 / (df - 1.5));
  const w = Math.sqrt(h * a * (1 - a));
  return w * (1 - (h - w * w) * (a - 1/3) / (4 * h));
}

function getChiSquareCriticalValue(alpha: number, df: number): number {
  // More accurate chi-square critical value
  const p = 1 - alpha;
  const n = df;
  const x = n + Math.sqrt(2 * n) * Math.sqrt(Math.log(1 / p));
  return x;
}

function getNormalCriticalValue(alpha: number): number {
  return Math.sqrt(2) * Math.abs(erf(1 - 2 * alpha));
}

// Power calculation
function calculatePower(effectSize: number, n: number, alpha: number): number {
  const criticalValue = getNormalCriticalValue(alpha);
  const noncentrality = effectSize * Math.sqrt(n);
  return 1 - normalDistribution(criticalValue - noncentrality);
}

/**
 * Performs hypothesis tests on a data field
 */
export function performHypothesisTests(
  field: DataField, 
  testType: string = 'mean',
  alpha: number = 0.05
): HypothesisTest {
  if (!field.value || !Array.isArray(field.value) || field.value.length === 0) {
    throw new Error('Invalid data field: must contain a non-empty array of values');
  }

  const values = field.value as number[];
  const n = values.length;
  
  // Calculate basic statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  switch (testType) {
    case 'mean':
      return performMeanTest(mean, stdDev, n, alpha);
    case 'variance':
      return performVarianceTest(variance, n, alpha);
    case 'proportion':
      return performProportionTest(values, n, alpha);
    case 'correlation':
      return performCorrelationTest(values, variance, n, alpha);
    default:
      return performMeanTest(mean, stdDev, n, alpha);
  }
}

function performMeanTest(
  mean: number,
  stdDev: number,
  n: number,
  alpha: number
): HypothesisTest {
  const nullHypothesis = "H₀: μ = 0";
  const alternativeHypothesis = "H₁: μ ≠ 0";
  
  const tStatistic = (mean - 0) / (stdDev / Math.sqrt(n));
  const pValue = 2 * (1 - tDistribution(Math.abs(tStatistic), n - 1));
  const criticalValue = getTCriticalValue(alpha / 2, n - 1);
  const significant = pValue < alpha;
  const effectSize = mean / stdDev; // Cohen's d
  const power = calculatePower(effectSize, n, alpha);

  return {
    name: "Mean Test (t-test)",
    testType: 'mean',
    nullHypothesis,
    alternativeHypothesis,
    statistic: tStatistic,
    pValue,
    criticalValue,
    alpha,
    significant,
    interpretation: generateInterpretation('mean', significant, pValue, alpha, mean, stdDev, n),
    effectSize,
    power
  };
}

function performVarianceTest(
  variance: number,
  n: number,
  alpha: number
): HypothesisTest {
  const nullHypothesis = "H₀: σ² = σ₀²";
  const alternativeHypothesis = "H₁: σ² ≠ σ₀²";
  
  const chiSquare = ((n - 1) * variance) / 1; // Assuming null hypothesis variance is 1
  const pValue = 2 * Math.min(
    chiSquareDistribution(chiSquare, n - 1),
    1 - chiSquareDistribution(chiSquare, n - 1)
  );
  const criticalValue = getChiSquareCriticalValue(alpha / 2, n - 1);
  const significant = pValue < alpha;
  const effectSize = Math.sqrt(chiSquare / n);
  const power = calculatePower(effectSize, n, alpha);

  return {
    name: "Variance Test (Chi-square)",
    testType: 'variance',
    nullHypothesis,
    alternativeHypothesis,
    statistic: chiSquare,
    pValue,
    criticalValue,
    alpha,
    significant,
    interpretation: generateInterpretation('variance', significant, pValue, alpha, Math.sqrt(variance), 0, n),
    effectSize,
    power
  };
}

function performProportionTest(
  values: number[],
  n: number,
  alpha: number
): HypothesisTest {
  const proportion = values.filter(v => v === 1).length / n;
  const nullProportion = 0.5;
  const nullHypothesis = "H₀: p = 0.5";
  const alternativeHypothesis = "H₁: p ≠ 0.5";
  
  const zStatistic = (proportion - nullProportion) / Math.sqrt(nullProportion * (1 - nullProportion) / n);
  const pValue = 2 * (1 - normalDistribution(Math.abs(zStatistic)));
  const criticalValue = getNormalCriticalValue(alpha / 2);
  const significant = pValue < alpha;
  const effectSize = 2 * Math.asin(Math.sqrt(proportion)) - 2 * Math.asin(Math.sqrt(nullProportion));
  const power = calculatePower(effectSize, n, alpha);

  return {
    name: "Proportion Test (z-test)",
    testType: 'proportion',
    nullHypothesis,
    alternativeHypothesis,
    statistic: zStatistic,
    pValue,
    criticalValue,
    alpha,
    significant,
    interpretation: generateInterpretation('proportion', significant, pValue, alpha, proportion, 0, n),
    effectSize,
    power
  };
}

function performCorrelationTest(
  values: number[],
  variance: number,
  n: number,
  alpha: number
): HypothesisTest {
  // Calculate correlation with a lag of 1 (autocorrelation)
  const correlation = values.slice(0, -1).reduce((sum, val, i) => {
    return sum + (val - values[i + 1]) * (values[i + 1] - values[i + 2]);
  }, 0) / ((n - 2) * Math.sqrt(variance));
  
  const nullHypothesis = "H₀: ρ = 0";
  const alternativeHypothesis = "H₁: ρ ≠ 0";
  
  const tStatistic = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
  const pValue = 2 * (1 - tDistribution(Math.abs(tStatistic), n - 2));
  const criticalValue = getTCriticalValue(alpha / 2, n - 2);
  const significant = pValue < alpha;
  const effectSize = correlation;
  const power = calculatePower(effectSize, n, alpha);

  return {
    name: "Correlation Test",
    testType: 'correlation',
    nullHypothesis,
    alternativeHypothesis,
    statistic: tStatistic,
    pValue,
    criticalValue,
    alpha,
    significant,
    interpretation: generateInterpretation('correlation', significant, pValue, alpha, correlation, 0, n),
    effectSize,
    power
  };
}

function generateInterpretation(
  testType: string,
  significant: boolean,
  pValue: number,
  alpha: number,
  mainStat: number,
  variation: number,
  n: number
): string {
  const significancePhrase = significant ? 
    `statistically significant (p = ${pValue.toFixed(4)} < α = ${alpha})` :
    `not statistically significant (p = ${pValue.toFixed(4)} > α = ${alpha})`;

  let interpretation = `The test result is ${significancePhrase}. `;

  switch (testType) {
    case 'mean':
      interpretation += significant ?
        `We reject the null hypothesis and conclude that the population mean (${mainStat.toFixed(2)}) is significantly different from 0. ` :
        `We fail to reject the null hypothesis and cannot conclude that the population mean (${mainStat.toFixed(2)}) is different from 0. `;
      interpretation += `The standard deviation is ${variation.toFixed(2)} based on ${n} observations.`;
      break;
    case 'variance':
      interpretation += significant ?
        `We reject the null hypothesis and conclude that the population variance is significantly different from the hypothesized value. ` :
        `We fail to reject the null hypothesis about the population variance. `;
      interpretation += `The sample standard deviation is ${mainStat.toFixed(2)} based on ${n} observations.`;
      break;
    case 'proportion':
      interpretation += significant ?
        `We reject the null hypothesis and conclude that the proportion (${(mainStat * 100).toFixed(1)}%) is significantly different from 50%. ` :
        `We fail to reject the null hypothesis about the proportion (${(mainStat * 100).toFixed(1)}%). `;
      interpretation += `This conclusion is based on ${n} observations.`;
      break;
    case 'correlation':
      interpretation += significant ?
        `We reject the null hypothesis and conclude that there is a significant correlation (r = ${mainStat.toFixed(3)}). ` :
        `We fail to reject the null hypothesis and cannot conclude that there is a significant correlation. `;
      interpretation += `The correlation coefficient is ${mainStat.toFixed(3)} based on ${n} observations.`;
      break;
    default:
      interpretation += `The test was performed on ${n} observations.`;
  }

  return interpretation;
}