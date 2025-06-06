import { DataField } from '@/types/data';
import { determineTrend } from '../statistics/trends';
import { calculateFieldStats } from '../statistics/calculations';

interface FraudDetectionResult {
  transactions: {
    id: string;
    riskScore: number;
    flags: string[];
    confidence: number;
  }[];
  summary: {
    totalFlagged: number;
    riskDistribution: {
      high: number;
      medium: number;
      low: number;
    };
    commonPatterns: string[];
  };
}

interface RiskAnalysisResult {
  overallRisk: number;
  factors: {
    name: string;
    impact: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
  }[];
  metrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export class FinanceAnalyzer {
  static detectFraud(fields: DataField[]): FraudDetectionResult {
    const transactions = this.analyzeFraudRisk(fields);
    const summary = this.summarizeFraudFindings(transactions);

    return {
      transactions,
      summary
    };
  }

  static analyzeRisk(fields: DataField[]): RiskAnalysisResult {
    const riskFactors = this.identifyRiskFactors(fields);
    const metrics = this.calculateRiskMetrics(fields);
    const overallRisk = this.calculateOverallRisk(riskFactors, metrics);

    return {
      overallRisk,
      factors: riskFactors,
      metrics
    };
  }

  static analyzeFinancialMetrics(fields: DataField[]) {
    const revenueField = fields.find(f => f.name.toLowerCase().includes('revenue'));
    const expensesField = fields.find(f => f.name.toLowerCase().includes('expenses'));
    const investmentField = fields.find(f => f.name.toLowerCase().includes('investment'));
    
    // Enhanced market data collection
    const marketData = {
      volatility: fields.find(f => f.name.toLowerCase().includes('volatility'))?.value as number[],
      marketTrend: fields.find(f => f.name.toLowerCase().includes('market') && f.name.toLowerCase().includes('trend'))?.value as number[],
      sectorPerformance: fields.find(f => f.name.toLowerCase().includes('sector') && f.name.toLowerCase().includes('performance'))?.value as number[],
      economicIndicators: fields.find(f => f.name.toLowerCase().includes('economic') && f.name.toLowerCase().includes('indicator'))?.value as number[],
      creditRatings: fields.find(f => f.name.toLowerCase().includes('credit') && f.name.toLowerCase().includes('rating'))?.value as number[],
      defaultRates: fields.find(f => f.name.toLowerCase().includes('default') && f.name.toLowerCase().includes('rate'))?.value as number[],
      interestRates: fields.find(f => f.name.toLowerCase().includes('interest') && f.name.toLowerCase().includes('rate'))?.value as number[],
      debtLevels: fields.find(f => f.name.toLowerCase().includes('debt') && f.name.toLowerCase().includes('level'))?.value as number[]
    };

    // Calculate detailed risk scores
    const riskScores = {
      marketRisk: this.calculateMarketRisk(marketData),
      creditRisk: this.calculateCreditRisk(marketData),
      overallRisk: this.calculateCompositeRisk(marketData)
    };

    const revenue = revenueField ? revenueField.value : [];
    const expenses = expensesField ? expensesField.value : [];
    const investments = investmentField?.value as number[] || [];
    const marketVolatility = fields.find(f => f.name.toLowerCase().includes('market') && f.name.toLowerCase().includes('volatility'))?.value as number[] || [];
    const liquidityRisk = fields.find(f => f.name.toLowerCase().includes('liquidity') && f.name.toLowerCase().includes('risk'))?.value as number[] || [];

    // Calculate metrics using the latest values
    const latestRevenue = revenue[revenue.length - 1] || 0;
    const latestExpenses = expenses[expenses.length - 1] || 0;
    const latestInvestments = investments[investments.length - 1] || 0;
    const latestMarketVolatility = marketVolatility[marketVolatility.length - 1] || 0;
    const latestLiquidityRisk = liquidityRisk[liquidityRisk.length - 1] || 0;

    // Profit Margin Calculation
    const profitMargin = latestRevenue && latestExpenses 
      ? ((latestRevenue - latestExpenses) / latestRevenue) * 100
      : 0;

    // ROI Calculation
    const roi = latestRevenue && latestExpenses && latestInvestments
      ? ((latestRevenue - latestExpenses) / latestInvestments) * 100
      : 0;

    // Cash Flow Calculation
    const cashFlow = latestRevenue && latestExpenses 
      ? latestRevenue - latestExpenses 
      : 0;

    const trends = revenue.map((value, index) => ({
      period: `Q${Math.floor(index / 3) + 1} ${index % 3 + 1}`,
      revenue: value,
      expenses: expenses[index] || 0,
      investments: investments[index] || 0
    }));

    // Enhanced data quality assessment
    const dataQuality = this.assessDataQuality(fields);

    return {
      profitMargin: Math.round(profitMargin * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      riskScore: Math.min(1, Math.max(0, riskScores.overallRisk)),
      cashFlow,
      trends,
      riskFactors: {
        marketRisk: riskScores.marketRisk,
        creditRisk: riskScores.creditRisk,
        marketVolatility: latestMarketVolatility,
        liquidityRisk: latestLiquidityRisk
      },
      dataQuality
    };
  }

  static analyzeRiskMetrics(fields: DataField[]) {
    const marketData = fields.find(f => f.name.toLowerCase().includes('market'))?.value as number[] || [];
    const creditData = fields.find(f => f.name.toLowerCase().includes('credit'))?.value as number[] || [];
    const operationalData = fields.find(f => f.name.toLowerCase().includes('operational'))?.value as number[] || [];

    const calculateRiskLevel = (data: number[]) => {
      if (data.length === 0) return 'low';
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      return avg > 0.7 ? 'high' : avg > 0.4 ? 'medium' : 'low';
    };

    const calculateMetrics = (data: number[]) => {
      if (data.length === 0) return { current: 0, historical: 0, industryAverage: 0 };
      const current = data[data.length - 1];
      const historical = data.reduce((a, b) => a + b, 0) / data.length;
      return {
        current,
        historical,
        industryAverage: historical * 0.95 // Simplified industry average calculation
      };
    };

    return [
      {
        category: 'Market Risk',
        level: calculateRiskLevel(marketData),
        metrics: calculateMetrics(marketData),
        recommendations: [
          'Diversify investment portfolio',
          'Consider hedging strategies',
          'Monitor market indicators more closely'
        ]
      },
      {
        category: 'Credit Risk',
        level: calculateRiskLevel(creditData),
        metrics: calculateMetrics(creditData),
        recommendations: [
          'Maintain current credit assessment procedures',
          'Consider expanding credit offerings'
        ]
      },
      {
        category: 'Operational Risk',
        level: calculateRiskLevel(operationalData),
        metrics: calculateMetrics(operationalData),
        recommendations: [
          'Implement additional security measures',
          'Review and update operational procedures',
          'Conduct staff training on risk management',
          'Consider outsourcing certain operations'
        ]
      }
    ];
  }

  private static analyzeFraudRisk(fields: DataField[]): FraudDetectionResult['transactions'] {
    const transactions: FraudDetectionResult['transactions'] = [];
    const amounts = fields.find(f => f.name.toLowerCase().includes('amount'))?.value as number[];
    const times = fields.find(f => f.name.toLowerCase().includes('time'))?.value as string[];
    const locations = fields.find(f => f.name.toLowerCase().includes('location'))?.value as string[];
    const ids = fields.find(f => f.name.toLowerCase().includes('id'))?.value as string[];

    if (!amounts || !times || !ids) return [];

    for (let i = 0; i < ids.length; i++) {
      const flags: string[] = [];
      let riskScore = 0;

      // Check for unusual amount
      const stats = calculateFieldStats({ name: 'amount', type: 'number', value: amounts });
      if (amounts[i] > stats.mean + 2 * stats.standardDeviation) {
        flags.push('Unusual amount');
        riskScore += 0.3;
      }

      // Check for unusual time
      if (times[i]) {
        const hour = new Date(times[i]).getHours();
        if (hour < 6 || hour > 22) {
          flags.push('Unusual time');
          riskScore += 0.2;
        }
      }

      // Check for location anomalies
      if (locations) {
        const userLocations = locations.filter((_, idx) => 
          times[idx] && 
          Math.abs(new Date(times[idx]).getTime() - new Date(times[i]).getTime()) < 3600000
        );
        if (userLocations.length > 1 && new Set(userLocations).size > 1) {
          flags.push('Multiple locations');
          riskScore += 0.4;
        }
      }

      if (flags.length > 0) {
        transactions.push({
          id: ids[i],
          riskScore,
          flags,
          confidence: this.calculateConfidence(flags.length, riskScore)
        });
      }
    }

    return transactions;
  }

  private static summarizeFraudFindings(
    transactions: FraudDetectionResult['transactions']
  ): FraudDetectionResult['summary'] {
    const riskDistribution = {
      high: 0,
      medium: 0,
      low: 0
    };

    transactions.forEach(t => {
      if (t.riskScore > 0.7) riskDistribution.high++;
      else if (t.riskScore > 0.4) riskDistribution.medium++;
      else riskDistribution.low++;
    });

    const patterns = new Map<string, number>();
    transactions.forEach(t => {
      t.flags.forEach(flag => {
        patterns.set(flag, (patterns.get(flag) || 0) + 1);
      });
    });

    const commonPatterns = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pattern, count]) => 
        `${pattern} (${count} occurrences)`
      );

    return {
      totalFlagged: transactions.length,
      riskDistribution,
      commonPatterns
    };
  }

  private static identifyRiskFactors(fields: DataField[]): RiskAnalysisResult['factors'] {
    return fields
      .filter(f => f.type === 'number')
      .map(field => {
        const values = field.value as number[];
        const stats = calculateFieldStats(field);
        const trend = this.analyzeTrend(values);
        const impact = this.calculateRiskImpact(values, stats);

        return {
          name: field.name,
          impact,
          trend,
          recommendations: this.generateRiskRecommendations(field.name, impact, trend)
        };
      })
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  private static calculateRiskMetrics(fields: DataField[]): RiskAnalysisResult['metrics'] {
    const returns = fields.find(f => f.name.toLowerCase().includes('return'))?.value as number[];
    
    if (!returns?.length) {
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      };
    }

    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns, volatility);
    const maxDrawdown = this.calculateMaxDrawdown(returns);

    return {
      volatility,
      sharpeRatio,
      maxDrawdown
    };
  }

  private static calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);
  }

  private static calculateSharpeRatio(returns: number[], volatility: number): number {
    const riskFreeRate = 0.02; // Assumed risk-free rate
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    return (meanReturn - riskFreeRate) / volatility;
  }

  private static calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = returns[0];
    
    returns.forEach(value => {
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    });

    return maxDrawdown;
  }

  private static calculateOverallRisk(
    factors: RiskAnalysisResult['factors'],
    metrics: RiskAnalysisResult['metrics']
  ): number {
    const factorRisk = factors.reduce((sum, factor) => 
      sum + Math.abs(factor.impact), 0) / factors.length;
    
    const metricRisk = (
      (metrics.volatility * 0.4) +
      (Math.max(0, -metrics.sharpeRatio) * 0.3) +
      (metrics.maxDrawdown * 0.3)
    );

    return (factorRisk * 0.6 + metricRisk * 0.4);
  }

  private static analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    const trend = determineTrend(values as number[]);
    return trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable';
  }

  private static calculateRiskImpact(values: number[], stats: any): number {
    const volatility = stats.standardDeviation / stats.mean;
    const trend = this.analyzeTrend(values);
    const trendFactor = trend === 'increasing' ? 1.2 : trend === 'decreasing' ? 0.8 : 1;
    
    return volatility * trendFactor;
  }

  private static generateRiskRecommendations(
    name: string,
    impact: number,
    trend: 'increasing' | 'decreasing' | 'stable'
  ): string[] {
    const recommendations: string[] = [];

    if (Math.abs(impact) > 0.5) {
      recommendations.push(`Monitor ${name} closely due to high volatility`);
    }

    if (trend === 'increasing' && impact > 0) {
      recommendations.push(`Consider hedging against rising ${name}`);
    } else if (trend === 'decreasing' && impact > 0) {
      recommendations.push(`Evaluate exposure to declining ${name}`);
    }

    if (recommendations.length === 0) {
      recommendations.push(`Maintain current position on ${name}`);
    }

    return recommendations;
  }

  private static calculateConfidence(flagCount: number, riskScore: number): number {
    // More flags and higher risk score increase confidence
    return Math.min(0.3 + (flagCount * 0.2) + (riskScore * 0.5), 1);
  }

  private static calculateMarketRisk(marketData: {
    volatility?: number[];
    marketTrend?: number[];
    sectorPerformance?: number[];
    economicIndicators?: number[];
  }): number {
    const weights = {
      volatility: 0.4,
      marketTrend: 0.3,
      sectorPerformance: 0.2,
      economicIndicators: 0.1
    };

    let riskScore = 0;
    let totalWeight = 0;

    if (marketData.volatility?.length) {
      const volatility = this.calculateVolatility(marketData.volatility);
      riskScore += volatility * weights.volatility;
      totalWeight += weights.volatility;
    }

    if (marketData.marketTrend?.length) {
      const trend = this.analyzeTrend(marketData.marketTrend);
      const trendScore = trend === 'decreasing' ? 0.8 : trend === 'stable' ? 0.5 : 0.2;
      riskScore += trendScore * weights.marketTrend;
      totalWeight += weights.marketTrend;
    }

    if (marketData.sectorPerformance?.length) {
      const avgPerformance = marketData.sectorPerformance.reduce((a, b) => a + b, 0) / marketData.sectorPerformance.length;
      const performanceScore = avgPerformance < 0 ? 0.8 : avgPerformance < 0.1 ? 0.5 : 0.2;
      riskScore += performanceScore * weights.sectorPerformance;
      totalWeight += weights.sectorPerformance;
    }

    if (marketData.economicIndicators?.length) {
      const avgIndicator = marketData.economicIndicators.reduce((a, b) => a + b, 0) / marketData.economicIndicators.length;
      const indicatorScore = avgIndicator < 0 ? 0.8 : avgIndicator < 0.1 ? 0.5 : 0.2;
      riskScore += indicatorScore * weights.economicIndicators;
      totalWeight += weights.economicIndicators;
    }

    return totalWeight > 0 ? riskScore / totalWeight : 0;
  }

  private static calculateCreditRisk(marketData: {
    creditRatings?: number[];
    defaultRates?: number[];
    interestRates?: number[];
    debtLevels?: number[];
  }): number {
    const weights = {
      creditRatings: 0.3,
      defaultRates: 0.3,
      interestRates: 0.2,
      debtLevels: 0.2
    };

    let riskScore = 0;
    let totalWeight = 0;

    if (marketData.creditRatings?.length) {
      const avgRating = marketData.creditRatings.reduce((a, b) => a + b, 0) / marketData.creditRatings.length;
      const ratingScore = avgRating < 3 ? 0.8 : avgRating < 4 ? 0.5 : 0.2;
      riskScore += ratingScore * weights.creditRatings;
      totalWeight += weights.creditRatings;
    }

    if (marketData.defaultRates?.length) {
      const avgDefaultRate = marketData.defaultRates.reduce((a, b) => a + b, 0) / marketData.defaultRates.length;
      const defaultScore = avgDefaultRate > 0.05 ? 0.8 : avgDefaultRate > 0.02 ? 0.5 : 0.2;
      riskScore += defaultScore * weights.defaultRates;
      totalWeight += weights.defaultRates;
    }

    if (marketData.interestRates?.length) {
      const avgInterestRate = marketData.interestRates.reduce((a, b) => a + b, 0) / marketData.interestRates.length;
      const interestScore = avgInterestRate > 0.05 ? 0.8 : avgInterestRate > 0.03 ? 0.5 : 0.2;
      riskScore += interestScore * weights.interestRates;
      totalWeight += weights.interestRates;
    }

    if (marketData.debtLevels?.length) {
      const avgDebtLevel = marketData.debtLevels.reduce((a, b) => a + b, 0) / marketData.debtLevels.length;
      const debtScore = avgDebtLevel > 0.7 ? 0.8 : avgDebtLevel > 0.5 ? 0.5 : 0.2;
      riskScore += debtScore * weights.debtLevels;
      totalWeight += weights.debtLevels;
    }

    return totalWeight > 0 ? riskScore / totalWeight : 0;
  }

  private static calculateCompositeRisk(marketData: any): number {
    const marketRisk = this.calculateMarketRisk(marketData);
    const creditRisk = this.calculateCreditRisk(marketData);

    // Weight market risk and credit risk equally
    return (marketRisk * 0.5 + creditRisk * 0.5);
  }

  private static assessDataQuality(fields: DataField[]) {
    const totalFields = fields.length;
    if (totalFields === 0) return { completeness: 0, consistency: 0, timeliness: 0 };

    // Check completeness (percentage of fields with required data)
    const hasRevenue = fields.some(f => f.name.toLowerCase().includes('revenue'));
    const hasExpenses = fields.some(f => f.name.toLowerCase().includes('expenses'));
    const completeFields = hasRevenue && hasExpenses ? 1 : 0;
    
    // Check consistency (variance in reporting periods)
    const periodField = fields.find(f => f.name.toLowerCase().includes('period'));
    const periods = periodField ? periodField.value : [];
    const periodConsistency = periods.length > 0 ? 
      (fields.length / periods.length) / 3 : 0; // Normalize to 0-1
    
    // Check timeliness (how recent the data is)
    const now = new Date();
    const dateField = fields.find(f => f.name.toLowerCase() === 'date');
    const dates = dateField ? dateField.value : [];
    
    const timeliness = dates.length > 0 ? 
      Math.max(0, 1 - (now.getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24 * 90)) : 0; // 90 days
    
    return {
      completeness: completeFields / totalFields,
      consistency: Math.min(1, periodConsistency),
      timeliness
    };
  }
}