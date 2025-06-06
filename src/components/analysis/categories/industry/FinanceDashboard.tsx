import React from 'react';
import { PiggyBank, AlertTriangle } from 'lucide-react';
import type { DataField } from '@/types/data';
import { FinanceAnalyzer } from '@/utils/analysis/industry/finance';

interface FinancialData {
  [key: string]: number | undefined;
  revenue?: number;
  expenses?: number;
  investments?: number;
  assets?: number;
  liabilities?: number;
  marketVolatility?: number;
  creditExposure?: number;
  operatingCashFlow?: number;
}

interface FinancialMetrics {
  profitMargin: number;
  returnOnInvestment: number;
  riskScore: number;
  cashFlow: number;
  marketVolatility: number;
  creditRisk: number;
  currentRatio: number;
  debtToEquity: number;
}

interface FinanceDashboardProps {
  data: {
    fields: DataField[];
    metadata?: {
      currency?: string;
      timePeriod?: string;
      [key: string]: any;
    };
  };
}

export function FinanceDashboard({ data }: FinanceDashboardProps) {
  // Calculate all financial metrics
  const calculateMetrics = (input: FinancialData): FinancialMetrics => {
    // Helper function to safely calculate with default fallback
    const safeCalc = (numerator?: number, denominator?: number, fallback = 0) => {
      if (!denominator || isNaN(denominator)) return fallback;
      return ((numerator || 0) / denominator) * 100;
    };

    return {
      profitMargin: safeCalc(
        (input.revenue || 0) - (input.expenses || 0), 
        input.revenue
      ),
      returnOnInvestment: safeCalc(
        (input.revenue || 0) - (input.expenses || 0), 
        input.investments
      ),
      riskScore: Math.min(
        100,
        ((input.marketVolatility || 0) * 0.6 + 
         (input.creditExposure || 0) * 0.4) * 100
      ),
      cashFlow: input.operatingCashFlow || 0,
      marketVolatility: input.marketVolatility || 0,
      creditRisk: input.creditExposure || 0,
      currentRatio: safeCalc(input.assets, input.liabilities, 0),
      debtToEquity: safeCalc(
        input.liabilities, 
        (input.assets || 0) - (input.liabilities || 0), 
        0
      )
    };
  };

  // Enhanced financial analysis with error handling and data quality assessment
  const { financialData, dataQualityIssues } = React.useMemo(() => {
    try {
      const result = FinanceAnalyzer.analyzeFinancialMetrics(data.fields);
      
      // Data quality assessment
      const qualityIssues: string[] = [];
      if (data.fields.length < 3) {
        qualityIssues.push('Limited data points may affect accuracy');
      }
      if (result.trends && result.trends.length < 2) {
        qualityIssues.push('Insufficient trend data for reliable analysis');
      }

      return {
        financialData: {
          ...result,
          trends: result.trends || [],
          dataQuality: {
            completeness: (result as any).dataQuality?.completeness || 0,
            consistency: (result as any).dataQuality?.consistency || 0,
            timeliness: (result as any).dataQuality?.timeliness || 0,
            warnings: qualityIssues
          }
        },
        dataQualityIssues: qualityIssues
      };
    } catch (error) {
      console.error("Error analyzing financial data:", error);
      return {
        financialData: {
          trends: [],
          dataQuality: {
            completeness: 0,
            consistency: 0,
            timeliness: 0,
            warnings: ['Error processing financial data']
          }
        },
        dataQualityIssues: ['Error processing financial data']
      };
    }
  }, [data.fields]);

  const metrics = calculateMetrics({
    revenue: (financialData as any).trends?.[0]?.revenue,
    expenses: (financialData as any).trends?.[0]?.expenses,
    investments: (financialData as any).trends?.[0]?.investments,
    marketVolatility: (financialData as any).riskFactors?.marketVolatility,
    creditExposure: (financialData as any).riskFactors?.creditExposure,
    operatingCashFlow: (financialData as any).cashFlow,
    assets: (financialData as any).assets,
    liabilities: (financialData as any).liabilities
  } as FinancialData);
  const currencySymbol = data.metadata?.currency || '$';

  // Format numbers consistently
  const formatNumber = (value: number, isCurrency = false, decimals = 2) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    }
    return value.toFixed(decimals) + (value === 0 ? '' : '%');
  };

  // Data quality indicator
  const dataQualityScore = financialData.dataQuality 
    ? Math.round(
        (financialData.dataQuality.completeness * 0.4 + 
         financialData.dataQuality.consistency * 0.3 +
         financialData.dataQuality.timeliness * 0.3) * 100
      )
    : 0;

  return (
    <div className="space-y-8">
      {/* Data Quality Warning */}
      {dataQualityIssues.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Data Quality Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your analysis may be affected by:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {dataQualityIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
                {dataQualityScore > 0 && (
                  <p className="mt-2">
                    Data Quality Score: <span className="font-medium">{dataQualityScore}/100</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Metrics</h3>
          </div>
          <p className="text-sm text-gray-500">
            Analysis in {currencySymbol}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <h3>Profit Margin</h3>
            <p className="metric-value">
              {formatNumber(metrics.profitMargin)}
            </p>
            {!financialData.trends?.[0]?.revenue && (
              <p className="data-warning">Revenue data missing</p>
            )}
          </div>

          <div className="metric-card">
            <h3>Return on Investment</h3>
            <p className="metric-value">
              {formatNumber(metrics.returnOnInvestment)}
            </p>
            {!financialData.trends?.[0]?.investments && (
              <p className="data-warning">Investment data missing</p>
            )}
          </div>

          <div className="metric-card">
            <h3>Risk Score</h3>
            <p className="metric-value">
              {metrics.riskScore.toFixed(1)}%
            </p>
            <div className="risk-bar">
              <div 
                className="risk-level" 
                style={{ width: `${metrics.riskScore}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <h3>Cash Flow</h3>
            <p className="metric-value">
              {formatNumber(metrics.cashFlow, true)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Market Volatility</h3>
            <p className="metric-value">
              {formatNumber(metrics.marketVolatility)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Credit Risk</h3>
            <p className="metric-value">
              {formatNumber(metrics.creditRisk)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Current Ratio</h3>
            <p className="metric-value">
              {formatNumber(metrics.currentRatio)}
            </p>
          </div>

          <div className="metric-card">
            <h3>Debt to Equity</h3>
            <p className="metric-value">
              {formatNumber(metrics.debtToEquity)}
            </p>
          </div>
        </div>

        {Object.values(financialData).every(val => val === undefined) && (
          <div className="data-alert">
            ⚠️ No financial data provided. Please upload a data file.
          </div>
        )}
      </div>
    </div>
  );
}