import { useEffect, useState } from 'react';
import { Brain, FileUp, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import { AnalyzedData, DataField } from '@/types';
import { DataCard } from './cards/DataCard';
import InsightList from './InsightList';
import StatisticsSummary from './StatisticsSummary';
import { ChartView } from '../visualization';
import MLInsights from './categories/ml/MLInsights';
import NLPInsights from './NLPInsights';
import { PredictiveInsights } from '../predictive/PredictiveInsights';
import RegressionView from './RegressionView';
import { generateAutoInsights } from '@/utils/analysis/insights';
import { DataCleaner } from '@/utils/analysis/preprocessing/cleaner';
import { DataHealthScore } from '../monitoring/DataHealthScore';
import TimeSeriesAnalysis from './TimeSeriesAnalysis';
import { convertFieldsToTimeSeriesData } from '@/utils/analysis/timeSeries';

interface DataAnalyzerProps {
  data: {
    fields: DataField[];
  };
}

export default function DataAnalyzer({ data }: DataAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalyzedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleanedData, setCleanedData] = useState<{
    fields: DataField[];
    results: Array<{
      field: DataField;
      fixes: Array<{
        type: string;
        count: number;
        description: string;
      }>;
      healthScore: number;
    }>;
    overallHealth: number;
  } | null>(null);

  useEffect(() => {
    const processData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clean and preprocess data
        const cleanedResult = await DataCleaner.cleanData(data.fields);
        setCleanedData(cleanedResult);

        // Generate analysis results
        const analysisResult: AnalyzedData = {
          hasNumericData: cleanedResult.fields.some(f => f.type === 'number'),
          hasTextData: cleanedResult.fields.some(f => f.type === 'string'),
          dataQuality: {
            completeness: calculateCompleteness(cleanedResult.fields),
            validity: cleanedResult.overallHealth
          },
          fields: cleanedResult.fields,
          insights: generateAutoInsights({ fields: cleanedResult.fields }),
          statistics: generateStatistics(cleanedResult.fields),
          mlAnalysis: generateMLAnalysis(cleanedResult.fields),
          nlpResults: generateNLPResults(cleanedResult.fields),
          regressionResults: generateRegressionResults(cleanedResult.fields),
          timeSeriesResults: generateTimeSeriesResults(cleanedResult.fields),
          predictions: generatePredictions(cleanedResult.fields)
        };

        setAnalysis(analysisResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during analysis');
        console.error('Error in data analysis:', err);
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Analyzing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!analysis || !cleanedData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-gray-500">No data available for analysis</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Data Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DataHealthScore
          score={cleanedData.overallHealth}
          results={cleanedData.results}
        />
        <DataCard
          icon={<FileUp className="w-5 h-5 text-indigo-600" />}
          title="Total Fields"
          value={data.fields.length}
        />
        <DataCard
          icon={<BarChart2 className="w-5 h-5 text-indigo-600" />}
          title="Numeric Fields"
          value={analysis.fields.filter(f => f.type === 'number').length}
        />
        <DataCard
          icon={<Brain className="w-5 h-5 text-indigo-600" />}
          title="Text Fields"
          value={analysis.fields.filter(f => f.type === 'string').length}
        />
      </div>

      {/* Key Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <InsightList insights={analysis.insights} />
        </div>
      )}

      {/* Data Visualization */}
      {analysis.hasNumericData && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartView data={analysis.fields} type="bar" title="Overview" />
            <ChartView data={analysis.fields} type="line" title="Trends" />
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {analysis.hasNumericData && analysis.statistics && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <StatisticsSummary statistics={analysis.statistics} />
        </div>
      )}

      {/* ML Insights */}
      {analysis.mlAnalysis && (
        <MLInsights 
          predictions={analysis.mlAnalysis.predictions}
          confidence={analysis.mlAnalysis.confidence}
          features={analysis.mlAnalysis.features}
        />
      )}

      {/* NLP Insights */}
      {analysis.hasTextData && analysis.nlpResults && analysis.nlpResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.nlpResults.map((result, index) => (
            <NLPInsights key={index} {...result.analysis} />
          ))}
        </div>
      )}

      {/* Regression Analysis */}
      {analysis.regressionResults && analysis.regressionResults.length > 0 && (
        <RegressionView results={analysis.regressionResults} />
      )}

      {/* Time Series Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold  mb-4">Time Series Analysis</h2>
        <TimeSeriesAnalysis 
          data={convertFieldsToTimeSeriesData(cleanedData.fields)} 
        />
      </div>

      {/* Predictive Insights */}
      {analysis.predictions && analysis.predictions.length > 0 && (
        <PredictiveInsights predictions={analysis.predictions} />
      )}
    </div>
  );

// Helper functions for data processing
function calculateCompleteness(fields: DataField[]): number {
  if (fields.length === 0) return 0;
  const totalValues = fields.reduce((sum, field) => sum + field.value.length, 0);
  const nonNullValues = fields.reduce((sum, field) => 
    sum + field.value.filter((v: any) => v !== null && v !== undefined).length, 0);
  return nonNullValues / totalValues;
}

function generateStatistics(fields: DataField[]): any {
  const numericFields = fields.filter(f => f.type === 'number');
  return numericFields.map(field => ({
    field: field.name,
    mean: calculateMean(field.value as number[]),
    median: calculateMedian(field.value as number[]),
    stdDev: calculateStdDev(field.value as number[]),
    min: Math.min(...(field.value as number[])),
    max: Math.max(...(field.value as number[]))
  }));
}

function generateMLAnalysis(fields: DataField[]): any {
  const numericFields = fields.filter(f => f.type === 'number');
  return {
    predictions: numericFields.map(field => ({
      field: field.name,
      predictedValue: calculateMean(field.value as number[])
    })),
    confidence: 0.85,
    features: numericFields.map(f => f.name)
  };
}

function generateNLPResults(fields: DataField[]): any[] {
  const textFields = fields.filter(f => f.type === 'string');
  return textFields.map(field => ({
    field: field.name,
    analysis: {
      sentiment: 'neutral',
      topics: ['general'],
      wordCount: field.value.length
    }
  }));
}

function generateRegressionResults(fields: DataField[]): any[] {
  const numericFields = fields.filter(f => f.type === 'number');
  return numericFields.map(field => ({
    field: field.name,
    coefficients: [1],
    intercept: 0,
    rSquared: 0.8,
    predictions: field.value as number[],
    equation: `y = x + 0`
  }));
}

function generateTimeSeriesResults(fields: DataField[]): any[] {
  try {
    const numericFields = fields.filter(f => f.type === 'number');
    if (numericFields.length === 0) {
      console.warn('No numeric fields available for time series analysis');
      return [];
    }

    return numericFields.map(field => {
      const values = field.value as number[];
      if (!values || values.length < 2) {
        console.warn(`Insufficient data for time series analysis in field: ${field.name}`);
        return null;
      }

      // Calculate trend
      const trend = calculateTrend(values);
      
      // Detect seasonality
      const seasonality = detectSeasonality(values);
      
      // Generate forecast with confidence intervals
      const forecast = generateForecast(values);
      
      // Calculate model confidence
      const confidence = calculateModelConfidence(values, forecast.predicted);

      return {
        field: field.name,
        trend,
        seasonality,
        forecast: forecast.predicted,
        confidence,
        components: {
          trend: forecast.trend,
          seasonal: forecast.seasonal,
          residual: forecast.residual
        }
      };
    }).filter(result => result !== null);
  } catch (error) {
    console.error('Error in time series analysis:', error);
    return [];
  }
}

// Helper functions for time series analysis
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  const slope = calculateSlope(values);
  if (slope > 0.1) return 'increasing';
  if (slope < -0.1) return 'decreasing';
  return 'stable';
}

function calculateSlope(values: number[]): number {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return numerator / denominator;
}

function detectSeasonality(values: number[]): number | null {
  const n = values.length;
  if (n < 4) return null;
  
  // Check for seasonality up to 12 periods
  for (let period = 2; period <= Math.min(12, Math.floor(n / 2)); period++) {
    const seasonalStrength = calculateSeasonalStrength(values, period);
    if (seasonalStrength > 0.5) return period;
  }
  
  return null;
}

function calculateSeasonalStrength(values: number[], period: number): number {
  const n = values.length;
  const seasonalIndices = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  
  // Calculate seasonal indices
  for (let i = 0; i < n; i++) {
    const seasonalIndex = i % period;
    seasonalIndices[seasonalIndex] += values[i];
    counts[seasonalIndex]++;
  }
  
  for (let i = 0; i < period; i++) {
    seasonalIndices[i] /= counts[i];
  }
  
  // Calculate strength
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const seasonalVariance = seasonalIndices.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
  const totalVariance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  
  return seasonalVariance / totalVariance;
}

function generateForecast(values: number[]): {
  predicted: number[];
  trend: number[];
  seasonal: number[];
  residual: number[];
} {
  const trend = calculateTrendComponent(values);
  const seasonal = calculateSeasonalComponent(values, trend);
  const residual = values.map((val, i) => val - trend[i] - seasonal[i]);
  
  // Generate forecast
  const forecastLength = Math.min(5, Math.floor(values.length / 2));
  const predicted = new Array(forecastLength).fill(0).map((_, i) => {
    const trendValue = trend[trend.length - 1] + (i + 1) * calculateSlope(trend);
    const seasonalValue = seasonal[i % seasonal.length] || 0;
    return trendValue + seasonalValue;
  });
  
  return {
    predicted,
    trend,
    seasonal,
    residual
  };
}

function calculateTrendComponent(values: number[]): number[] {
  const slope = calculateSlope(values);
  const intercept = values[0];
  
  return values.map((_, i) => intercept + slope * i);
}

function calculateSeasonalComponent(values: number[], trend: number[]): number[] {
  const detrended = values.map((val, i) => val - trend[i]);
  const period = detectSeasonality(values) || 1;
  
  const seasonal = new Array(period).fill(0);
  const counts = new Array(period).fill(0);
  
  for (let i = 0; i < values.length; i++) {
    const seasonalIndex = i % period;
    seasonal[seasonalIndex] += detrended[i];
    counts[seasonalIndex]++;
  }
  
  for (let i = 0; i < period; i++) {
    seasonal[i] /= counts[i];
  }
  
  // Extend seasonal pattern to match data length
  return values.map((_, i) => seasonal[i % period]);
}

function calculateModelConfidence(values: number[], forecast: number[]): number {
  const m = forecast.length;
  
  // Calculate prediction error
  const lastValues = values.slice(-m);
  const errors = forecast.map((pred, i) => Math.abs(pred - lastValues[i]));
  const meanError = errors.reduce((sum, err) => sum + err, 0) / m;
  
  // Calculate confidence based on error
  const maxError = Math.max(...errors);
  const confidence = 1 - (meanError / maxError);
  
  return Math.max(0, Math.min(1, confidence));
}

function generatePredictions(fields: DataField[]): any[] {
  const numericFields = fields.filter(f => f.type === 'number');
  return numericFields.map(field => ({
    field: field.name,
    nextValue: calculateMean(field.value as number[]),
    confidence: 0.9
  }));
}

// Utility functions for calculations
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}
}