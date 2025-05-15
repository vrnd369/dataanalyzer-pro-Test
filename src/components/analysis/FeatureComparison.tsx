import React from 'react';
import { ArrowLeftRight, Brain, Target, AlertCircle } from 'lucide-react';
import { Line, Scatter } from 'react-chartjs-2';
import { DataField } from '@/types/data';
import { calculateFieldStats } from '@/utils/analysis/statistics/calculations';
import { determineTrend } from '@/utils/analysis/statistics/trends';
import { formatNumber } from '@/utils/analysis/formatting';
import { calculateCorrelation } from '@/utils/analysis/statistics/correlation';

interface FeatureComparisonProps {
  data: {
    fields: DataField[];
  };
}

export function FeatureComparison({ data }: FeatureComparisonProps) {
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = React.useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const numericFields = React.useMemo(() => 
    data.fields.filter(f => f.type === 'number'),
    [data.fields]
  );

  const handleFeatureSelect = (featureName: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureName)) {
        return prev.filter(f => f !== featureName);
      }
      if (prev.length < 2) {
        return [...prev, featureName];
      }
      return [prev[1], featureName];
    });
  };

  const compareFeatures = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      if (selectedFeatures.length !== 2) {
        throw new Error('Please select exactly 2 features to compare');
      }

      const feature1 = numericFields.find(f => f.name === selectedFeatures[0])!;
      const feature2 = numericFields.find(f => f.name === selectedFeatures[1])!;

      const stats1 = calculateFieldStats(feature1);
      const stats2 = calculateFieldStats(feature2);
      const trend1 = determineTrend(feature1.value as number[]);
      const trend2 = determineTrend(feature2.value as number[]);

      // Calculate similarity metrics
      const values1 = feature1.value as number[];
      const values2 = feature2.value as number[];
      const correlation = calculateCorrelation(values1, values2);
      const distance = calculateEuclideanDistance(values1, values2);
      const similarity = 1 / (1 + distance); // Convert distance to similarity score

      setComparisonResults({
        features: [
          {
            name: feature1.name,
            stats: stats1,
            trend: trend1
          },
          {
            name: feature2.name,
            stats: stats2,
            trend: trend2
          }
        ],
        metrics: {
          correlation,
          distance,
          similarity
        },
        insights: generateInsights(feature1, feature2, correlation)
      });

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Comparison failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateEuclideanDistance = (x: number[], y: number[]): number => {
    // Normalize values first
    const normalizeArray = (arr: number[]) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return arr.map(v => (v - min) / (max - min));
    };

    const normalizedX = normalizeArray(x);
    const normalizedY = normalizeArray(y);

    return Math.sqrt(
      normalizedX.reduce((sum, val, i) => 
        sum + Math.pow(val - normalizedY[i], 2), 0
      )
    );
  };

  const generateInsights = (
    feature1: DataField,
    feature2: DataField,
    correlation: number
  ): string[] => {
    const insights: string[] = [];
    const values1 = feature1.value as number[];
    const values2 = feature2.value as number[];
    
    // Correlation insights
    if (Math.abs(correlation) > 0.7) {
      insights.push(
        `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between ${
          feature1.name} and ${feature2.name}`
      );
    }

    // Trend comparison
    const trend1 = determineTrend(values1);
    const trend2 = determineTrend(values2);
    if (trend1 === trend2) {
      insights.push(`Both features show ${trend1} trends`);
    } else {
      insights.push(`${feature1.name} shows ${trend1} trend while ${
        feature2.name} shows ${trend2} trend`);
    }

    // Variability comparison
    const stats1 = calculateFieldStats(feature1);
    const stats2 = calculateFieldStats(feature2);
    
    // Calculate coefficient of variation with safety checks
    const cv1 = stats1.mean !== 0 ? stats1.standardDeviation / Math.abs(stats1.mean) : 0;
    const cv2 = stats2.mean !== 0 ? stats2.standardDeviation / Math.abs(stats2.mean) : 0;
    
    if (Math.abs(cv1 - cv2) > 0.5) {
      insights.push(`${
        cv1 > cv2 ? feature1.name : feature2.name
      } shows significantly more variability`);
    }

    return insights;
  };

  return (
    <div className="space-y-8">
      {/* Feature Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-black-500">Feature Comparison</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {numericFields.map(field => (
            <button
              key={field.name}
              onClick={() => handleFeatureSelect(field.name)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedFeatures.includes(field.name)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <p className="font-medium text-gray-900">{field.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {field.value.length} values
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={compareFeatures}
          disabled={selectedFeatures.length !== 2 || isAnalyzing}
          className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Compare Features'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResults && (
        <div className="space-y-6">
          {/* Feature Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-4">Feature Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparisonResults.features.map((feature: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">{feature.name}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mean</span>
                      <span className="font-medium">{formatNumber(feature.stats.mean)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Median</span>
                      <span className="font-medium">{formatNumber(feature.stats.median)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Std Dev</span>
                      <span className="font-medium">{formatNumber(feature.stats.standardDeviation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend</span>
                      <span className={`font-medium ${
                        feature.trend === 'up' ? 'text-green-600' :
                        feature.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {feature.trend === 'up' ? '↑ Increasing' :
                         feature.trend === 'down' ? '↓ Decreasing' :
                         '→ Stable'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-gray-900 mb-4">Relationship Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-black-500">Correlation</p>
                <p className="text-2xl font-semibold text-black-500">
                  {formatNumber(comparisonResults.metrics.correlation)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-black-500">Distance</p>
                <p className="text-2xl font-semibold text-black-500">
                  {formatNumber(comparisonResults.metrics.distance)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-black-500">Similarity</p>
                <p className="text-2xl font-semibold text-black-500">
                  {formatNumber(comparisonResults.metrics.similarity)}
                </p>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h4 className="font-medium text-black-900 mb-4">Visual Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Series Comparison */}
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: Array.from(
                      { length: Math.max(
                        ...comparisonResults.features.map((f: any) => 
                          data.fields.find(field => field.name === f.name)?.value.length || 0
                        )
                      )},
                      (_, i) => i + 1
                    ),
                    datasets: comparisonResults.features.map((feature: any, i: number) => ({
                      label: feature.name,
                      data: data.fields.find(f => f.name === feature.name)?.value,
                      borderColor: `hsl(${i * 180}, 70%, 50%)`,
                      backgroundColor: `hsla(${i * 180}, 70%, 50%, 0.1)`,
                      fill: true
                    }))
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Time Series Comparison'
                      }
                    }
                  }}
                />
              </div>

              {/* Scatter Plot */}
              <div className="h-[300px]">
                <Scatter
                  data={{
                    datasets: [{
                      label: 'Correlation',
                      data: data.fields
                        .find(f => f.name === comparisonResults.features[0].name)
                        ?.value.map((v: any, i: number) => {
                          const yValue = data.fields
                            .find(f => f.name === comparisonResults?.features?.[1]?.name)
                            ?.value?.[i];
                          return {
                            x: typeof v === 'number' ? v : 0,
                            y: typeof yValue === 'number' ? yValue : 0
                          };
                        }),
                      backgroundColor: 'rgba(99, 102, 241, 0.5)'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Feature Correlation'
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: comparisonResults.features[0].name
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: comparisonResults.features[1].name
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-black-500" />
              <h4 className="font-medium text-black">Key Insights</h4>
            </div>
            <div className="space-y-2">
              {comparisonResults.insights.map((insight: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-black-50 rounded-lg"
                >
                  <Target className="w-5 h-5 text-black-500 mt-0.5" />
                  <p className="text-black-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}