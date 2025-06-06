import React from 'react';
import { PiggyBank, DollarSign, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { DataField } from '@/types/data';
import { FinanceAnalyzer } from '@/utils/analysis/industry/finance';

interface CustomMetric {
  label: string;
  value: number | string;
  formatter?: (value: number | string) => string;
  icon?: React.ReactNode;
  description?: string;
  tooltip?: string;
}

interface MetricCardsConfig {
  metrics?: {
    [key: string]: boolean | undefined;
  };
  customMetrics?: CustomMetric[];
}

interface ChartOptions {
  lineChart?: {
    datasets?: string[];
    colors?: {
      line?: string;
      fill?: string;
    };
    title?: string;
  };
  barChart?: {
    datasets?: string[];
    title?: string;
  };
  showPieChart?: boolean;
  pieChartTitle?: string;
}

interface FinanceAnalysisConfig {
  showTrends?: boolean;
  showRiskAnalysis?: boolean;
  metricCards?: MetricCardsConfig;
  chartOptions?: ChartOptions;
  showHelpText?: boolean;
  showDataQualityWarnings?: boolean;
}

interface FinanceAnalysisProps {
  data: {
    fields: DataField[];
    metadata?: {
      currency?: string;
      timePeriod?: string;
      [key: string]: any;
    };
  };
  config?: FinanceAnalysisConfig;
}

interface FinancialData {
  [key: string]: any;
  trends?: Array<{
    period: string;
    [key: string]: any;
  }>;
  availableMetrics?: string[];
  dataQuality?: {
    completeness: number;
    consistency: number;
    timeliness: number;
    warnings?: string[];
  };
}

interface Metric {
  label: string;
  value: number;
  formatter: (value: number) => string;
  icon?: React.ReactNode;
  description?: string;
  tooltip?: string;
  historicalAverage?: number;
}

interface RiskItem {
  category: string;
  level: 'low' | 'medium' | 'high';
  metrics: {
    current: number;
    historical: number;
    industryAverage: number;
  };
  recommendations: string[];
  confidenceScore?: number;
}

export function FinanceAnalysis({ data, config = {} }: FinanceAnalysisProps) {
  const {
    showTrends = true,
    showRiskAnalysis = true,
    showHelpText = true,
    showDataQualityWarnings = true,
    metricCards = {
      metrics: {},
      customMetrics: []
    },
    chartOptions = {}
  } = config;

  const currencySymbol = data.metadata?.currency || '$';
  const timePeriod = data.metadata?.timePeriod || 'period';

  console.log('FinanceAnalysis input fields:', data.fields);
  console.log('FinanceAnalysis data:', data);

  // Dynamic financial analysis with error handling and data quality assessment
  const { financialData, dataQualityIssues } = React.useMemo(() => {
    try {
      const result = FinanceAnalyzer.analyzeFinancialMetrics(data.fields);
      console.log('Analyzer result:', result);
      
      // Data quality assessment
      const qualityIssues: string[] = [];
      if (data.fields.length < 3) {
        qualityIssues.push('Limited data points may affect accuracy');
      }
      if (result.trends && result.trends.length < 2) {
        qualityIssues.push('Insufficient trend data for reliable analysis');
      }

      // Detect available metrics dynamically
      const availableMetrics = Object.keys(result).filter(
        key => typeof (result as Record<string, any>)[key] === 'number' && key !== 'dataQuality'
      );

      return {
        financialData: {
          ...result,
          trends: result.trends || [],
          availableMetrics,
          dataQuality: {
            completeness: (result as any).dataQuality?.completeness || 0,
            consistency: (result as any).dataQuality?.consistency || 0,
            timeliness: (result as any).dataQuality?.timeliness || 0,
            warnings: qualityIssues
          }
        } as FinancialData,
        dataQualityIssues: qualityIssues
      };
    } catch (error) {
      console.error("Error analyzing financial data:", error);
      return {
        financialData: {
          trends: [],
          availableMetrics: [],
          dataQuality: {
            completeness: 0,
            consistency: 0,
            timeliness: 0,
            warnings: ['Error processing financial data']
          }
        } as FinancialData,
        dataQualityIssues: ['Error processing financial data']
      };
    }
  }, [data.fields]);

  // Enhanced risk analysis with confidence scoring
  const riskAnalysis = React.useMemo(() => {
    try {
      const result = FinanceAnalyzer.analyzeRiskMetrics(data.fields) as RiskItem[];
      return result.map(risk => ({
        ...risk,
        confidenceScore: Math.min(100, Math.max(0, 
          100 - (risk.level === 'high' ? 20 : risk.level === 'medium' ? 10 : 0)
        ))
      }));
    } catch (error) {
      console.error("Error analyzing risk data:", error);
      return [];
    }
  }, [data.fields]);

  // Formatters with enhanced formatting
  const currencyFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(1)}K`;
    }
    return `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const percentFormatter = (value: number) => 
    `${(value * 100).toFixed(Math.abs(value) < 0.01 ? 2 : 1)}%`;

  // Default metrics configuration with enhanced tooltips
  const getDefaultMetrics = () => {
    const metrics: Record<string, Metric> = {};
    
    if (!financialData.availableMetrics) return metrics;

    // Add standard financial metrics
    if (typeof financialData.profitMargin === 'number') {
      const historicalAverage = financialData.trends?.length 
        ? financialData.trends.reduce((sum, trend) => 
            sum + ((trend.revenue - (trend.expenses || 0)) / (trend.revenue || 1)) * 100, 0) / financialData.trends.length
        : undefined;
      
      metrics.profitMargin = {
        label: 'Profit Margin',
        value: financialData.profitMargin,
        formatter: percentFormatter,
        icon: <PiggyBank className="w-4 h-4" />,
        tooltip: 'Net profit as a percentage of revenue',
        historicalAverage
      };
    }

    if (typeof financialData.roi === 'number') {
      const historicalAverage = financialData.trends?.length
        ? financialData.trends.reduce((sum, trend) => 
            sum + ((trend.revenue - (trend.expenses || 0)) / (trend.investments || 1)) * 100, 0) / financialData.trends.length
        : undefined;
      
      metrics.roi = {
        label: 'Return on Investment',
        value: financialData.roi,
        formatter: percentFormatter,
        icon: <TrendingUp className="w-4 h-4" />,
        tooltip: 'Return on investment as a percentage',
        historicalAverage
      };
    }

    if (typeof financialData.riskScore === 'number') {
      const historicalAverage = financialData.trends?.length
        ? financialData.trends.reduce((sum, trend) => 
            sum + (trend.riskScore || 0), 0) / financialData.trends.length
        : undefined;
      
      metrics.riskScore = {
        label: 'Risk Score',
        value: financialData.riskScore,
        formatter: (value) => `${(value * 100).toFixed(1)}%`,
        icon: <AlertTriangle className="w-4 h-4" />,
        tooltip: 'Overall risk assessment score',
        historicalAverage
      };
    }

    if (typeof financialData.cashFlow === 'number') {
      const historicalAverage = financialData.trends?.length
        ? financialData.trends.reduce((sum, trend) => 
            sum + (trend.revenue - (trend.expenses || 0)), 0) / financialData.trends.length
        : undefined;
      
      metrics.cashFlow = {
        label: 'Cash Flow',
        value: financialData.cashFlow,
        formatter: currencyFormatter,
        icon: <DollarSign className="w-4 h-4" />,
        tooltip: 'Net cash flow (revenue - expenses)',
        historicalAverage
      };
    }

    // Add risk factor metrics if available
    if (financialData.riskFactors) {
      if (typeof financialData.riskFactors.marketVolatility === 'number') {
        metrics.marketVolatility = {
          label: 'Market Volatility',
          value: financialData.riskFactors.marketVolatility,
          formatter: (value) => `${(value * 100).toFixed(1)}%`,
          icon: <TrendingUp className="w-4 h-4" />,
          tooltip: 'Market volatility risk factor'
        };
      }

      if (typeof financialData.riskFactors.creditRisk === 'number') {
        metrics.creditRisk = {
          label: 'Credit Risk',
          value: financialData.riskFactors.creditRisk,
          formatter: (value) => `${(value * 100).toFixed(1)}%`,
          icon: <AlertTriangle className="w-4 h-4" />,
          tooltip: 'Credit risk assessment'
        };
      }

      if (typeof financialData.riskFactors.liquidityRisk === 'number') {
        metrics.liquidityRisk = {
          label: 'Liquidity Risk',
          value: financialData.riskFactors.liquidityRisk,
          formatter: (value) => `${(value * 100).toFixed(1)}%`,
          icon: <AlertTriangle className="w-4 h-4" />,
          tooltip: 'Liquidity risk assessment'
        };
      }
    }

    // Add any other available metrics
    financialData.availableMetrics.forEach(key => {
      if (metrics[key] || typeof financialData[key] !== 'number') return;

      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      metrics[key] = {
        label: formattedKey,
        value: financialData[key],
        formatter: key.toLowerCase().includes('ratio') || 
                  key.toLowerCase().includes('margin') || 
                  key.toLowerCase().includes('percent') ? 
                  percentFormatter : currencyFormatter,
        icon: key.toLowerCase().includes('profit') ? <PiggyBank className="w-4 h-4" /> :
              key.toLowerCase().includes('revenue') || key.toLowerCase().includes('income') ? <DollarSign className="w-4 h-4" /> :
              key.toLowerCase().includes('growth') || key.toLowerCase().includes('trend') ? <TrendingUp className="w-4 h-4" /> :
              <DollarSign className="w-4 h-4" />,
        tooltip: `Current ${formattedKey.toLowerCase()} value`
      };
    });

    return metrics;
  };

  const defaultMetrics = getDefaultMetrics();

  // Determine which metrics to display
  const getActiveMetrics = () => {
    // If no specific metrics are requested in config, show all available
    if (!metricCards.metrics || Object.keys(metricCards.metrics).length === 0) {
      return Object.values(defaultMetrics);
    }

    // Otherwise show only requested metrics that are available
    return Object.entries(metricCards.metrics)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => defaultMetrics[key])
      .filter(Boolean);
  };

  const activeMetrics = getActiveMetrics();

  // Enhanced chart data preparation with fallbacks
  const prepareChartData = () => {
    if (!financialData.trends || financialData.trends.length === 0) {
      return null;
    }

    const datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }> = [];
    
    const allKeys = new Set<string>();

    // Collect all available data keys
    financialData.trends.forEach(trend => {
      Object.keys(trend).forEach(key => {
        if (key !== 'period') allKeys.add(key);
      });
    });

    // Use configured datasets or all available ones
    const datasetsToShow = chartOptions.lineChart?.datasets || Array.from(allKeys);

    // Color generation with consistent hashing
    const stringToColor = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 50%)`;
    };

    datasetsToShow.forEach(key => {
      if (allKeys.has(key)) {
        const baseColor = stringToColor(key);
        datasets.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          data: financialData.trends!.map(t => t[key] as number),
          borderColor: baseColor,
          backgroundColor: baseColor.replace(')', ', 0.1)').replace('hsl', 'hsla'),
          fill: true,
          tension: 0.4
        });
      }
    });

    return {
      labels: financialData.trends.map(t => t.period),
      datasets
    };
  };

  const chartData = prepareChartData();

  // Data quality indicator
  const dataQualityScore = financialData.dataQuality 
    ? Math.round(
        (financialData.dataQuality.completeness * 0.4 + 
         financialData.dataQuality.consistency * 0.3 +
         financialData.dataQuality.timeliness * 0.3) * 100
      )
    : 0;

  const renderHistoricalComparison = (current: number, average: number) => {
    const difference = ((current - average) / average) * 100;
    return (
      <div className={`text-sm mt-1 ${
        difference >= 0 
          ? 'text-green-600' 
          : 'text-red-600'
      }`}>
        {difference >= 0 ? '↑' : '↓'} {Math.abs(difference).toFixed(1)}% vs historical average
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Data Quality Warning */}
      {showDataQualityWarnings && dataQualityIssues.length > 0 && (
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
          {showHelpText && (
            <p className="text-sm text-gray-500">
              {timePeriod} analysis in {currencySymbol}
            </p>
          )}
        </div>

        {activeMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {activeMetrics.map((metric, index) => (
              <div 
                key={index} 
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-teal-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {metric.label}
                  </h4>
                  {metric.tooltip && (
                    <span className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      <span className="absolute hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-2 rounded z-10 -mt-1 -ml-2">
                        {metric.tooltip}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  {metric.icon}
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.formatter ? metric.formatter(metric.value) : metric.value}
                  </span>
                </div>
                {metric.historicalAverage !== undefined && (
                  renderHistoricalComparison(metric.value, metric.historicalAverage)
                )}
                {metric.description && (
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                )}
              </div>
            ))}

            {metricCards.customMetrics?.map((metric, index) => (
              <div 
                key={`custom-${index}`} 
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-teal-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {metric.label}
                  </h4>
                  {metric.tooltip && (
                    <span className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      <span className="absolute hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-2 rounded z-10 -mt-1 -ml-2">
                        {metric.tooltip}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  {metric.icon}
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.formatter ? metric.formatter(metric.value) : metric.value}
                  </span>
                </div>
                {metric.description && (
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">No financial metrics available for display</p>
          </div>
        )}

        {/* Financial Trends */}
        {showTrends && chartData && (
          <div className="space-y-8">
            <div className="border rounded-lg p-4">
              <h4 className="text-md font-medium mb-4 text-gray-700">
                {chartOptions.lineChart?.title || "Financial Trends Over Time"}
              </h4>
              <div className="h-64">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.raw as number;
                            return `${label}: ${value >= 1000 ? currencyFormatter(value) : value}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) => {
                            const num = Number(value);
                            return num >= 1000 ? currencyFormatter(num) : num;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {chartOptions.showPieChart && (
              <div className="border rounded-lg p-4">
                <h4 className="text-md font-medium mb-4 text-gray-700">
                  {chartOptions.pieChartTitle || "Financial Composition"}
                </h4>
                <div className="h-64">
                  <Pie
                    data={{
                      labels: chartData.datasets.map(d => d.label),
                      datasets: [{
                        data: chartData.datasets.map(d => 
                          d.data.reduce((a, b) => a + b, 0)
                        ),
                        backgroundColor: chartData.datasets.map(d => d.backgroundColor),
                        borderColor: chartData.datasets.map(d => d.borderColor),
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${currencyFormatter(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risk Analysis */}
      {showRiskAnalysis && riskAnalysis.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
            </div>
            {showHelpText && (
              <p className="text-sm text-gray-500">
                Based on {riskAnalysis.length} risk factors
              </p>
            )}
          </div>

          <div className="grid gap-6">
            {riskAnalysis.map((risk, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{risk.category}</h4>
                  <div className="flex items-center gap-3">
                    {risk.confidenceScore && (
                      <div className="text-xs text-gray-500">
                        Confidence: {risk.confidenceScore}%
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      risk.level === 'low' ? 'bg-green-100 text-green-800' :
                      risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {risk.level.toUpperCase()} RISK
                    </span>
                  </div>
                </div>

                {/* Risk Metrics Chart */}
                <div className="h-48 mb-4">
                  <Bar
                    data={{
                      labels: ['Current', 'Historical', 'Industry Avg'],
                      datasets: [{
                        label: 'Risk Level',
                        data: [
                          risk.metrics.current,
                          risk.metrics.historical,
                          risk.metrics.industryAverage
                        ],
                        backgroundColor: [
                          risk.level === 'low' ? 'rgba(16, 185, 129, 0.2)' :
                          risk.level === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                          'rgba(239, 68, 68, 0.2)',
                          'rgba(156, 163, 175, 0.2)',
                          'rgba(209, 213, 219, 0.2)'
                        ],
                        borderColor: [
                          risk.level === 'low' ? 'rgb(16, 185, 129)' :
                          risk.level === 'medium' ? 'rgb(234, 179, 8)' :
                          'rgb(239, 68, 68)',
                          'rgb(156, 163, 175)',
                          'rgb(209, 213, 219)'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              return `${context.dataset.label}: ${context.raw}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Risk Score'
                          }
                        }
                      }
                    }}
                  />
                </div>

                {risk.recommendations.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <p className="font-medium mb-1 text-blue-800">Risk Mitigation Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          {risk.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 