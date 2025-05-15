import React, { useState, useEffect } from 'react';

interface StatisticalAnalysisProps {
  data?: any[];
  title?: string;
  showAdvanced?: boolean;
  onStatsCalculated?: (stats: any) => void;
}

export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({
  data = [],
  title = 'Statistical Analysis',
  showAdvanced = false,
  onStatsCalculated,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [inputData, setInputData] = useState<string>('');
  const [isCustomData, setIsCustomData] = useState<boolean>(false);

  useEffect(() => {
    if (!isCustomData) {
      calculateStats(data);
    }
  }, [data, isCustomData]);

  const calculateStats = (dataset: any[]) => {
    if (!dataset || !Array.isArray(dataset)) {
      setStats(null);
      return;
    }

    // Handle both array of numbers and array of objects with numeric values
    const numericData = dataset
      .flatMap(item => {
        if (typeof item === 'number') return item;
        if (typeof item === 'object' && item !== null) {
          return Object.values(item).filter(val => typeof val === 'number');
        }
        return [];
      })
      .filter((item): item is number => typeof item === 'number');

    if (numericData.length === 0) {
      setStats(null);
      if (onStatsCalculated) onStatsCalculated(null);
      return;
    }

    // Basic statistics
    const sum = numericData.reduce((acc, val) => acc + val, 0);
    const mean = sum / numericData.length;
    const sorted = [...numericData].sort((a, b) => a - b);
    const median = 
      sorted.length % 2 === 0 
        ? (sorted[sorted.length/2 - 1] + sorted[sorted.length/2]) / 2
        : sorted[Math.floor(sorted.length/2)];
    
    // Advanced statistics
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
    const range = max - min;
    
    const variance = numericData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericData.length;
    const stdDev = Math.sqrt(variance);
    
    const q1 = calculatePercentile(sorted, 25);
    const q3 = calculatePercentile(sorted, 75);
    const iqr = q3 - q1;

    const statsResult = {
      count: numericData.length,
      mean,
      median,
      min,
      max,
      range,
      variance,
      stdDev,
      q1,
      q3,
      iqr,
      dataQuality: numericData.length / dataset.length < 0.8 ? 'Low' : 'High',
      hasOutliers: detectOutliers(numericData, q1, q3, iqr),
    };

    setStats(statsResult);
    if (onStatsCalculated) onStatsCalculated(statsResult);
  };

  const calculatePercentile = (sortedData: number[], percentile: number): number => {
    const index = (percentile / 100) * (sortedData.length - 1);
    if (Number.isInteger(index)) {
      return sortedData[index];
    }
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return (sortedData[lower] + sortedData[upper]) / 2;
  };

  const detectOutliers = (
    data: number[], 
    q1: number, 
    q3: number, 
    iqr: number
  ): boolean => {
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return data.some(val => val < lowerBound || val > upperBound);
  };

  const handleCustomDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputData(e.target.value);
  };

  const processCustomData = () => {
    try {
      const parsedData = inputData.split(',')
        .map(item => parseFloat(item.trim()))
        .filter(item => !isNaN(item));
      
      if (parsedData.length > 0) {
        setIsCustomData(true);
        calculateStats(parsedData);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Error parsing custom data:', error);
      setStats(null);
    }
  };

  const resetToPropData = () => {
    setIsCustomData(false);
    setInputData('');
    calculateStats(data);
  };

  const renderStatCard = (label: string, value: any, precision = 2) => (
    <div className="p-3 bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-medium text-gray-900">
        {typeof value === 'number' ? value.toFixed(precision) : value}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        {stats && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.dataQuality === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            Data Quality: {stats.dataQuality}
          </span>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter custom data (comma-separated numbers):
        </label>
        <div className="flex space-x-2">
          <textarea
            className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            value={inputData}
            onChange={handleCustomDataChange}
            placeholder="e.g., 12, 15.5, 18, 20, 22.3"
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            onClick={processCustomData}
          >
            Analyze
          </button>
          {isCustomData && (
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
              onClick={resetToPropData}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {stats ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {renderStatCard('Data Points', stats.count, 0)}
            {renderStatCard('Mean', stats.mean)}
            {renderStatCard('Median', stats.median)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {renderStatCard('Minimum', stats.min)}
            {renderStatCard('Maximum', stats.max)}
            {renderStatCard('Range', stats.range)}
          </div>

          {showAdvanced && (
            <>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Advanced Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {renderStatCard('Standard Deviation', stats.stdDev)}
                {renderStatCard('Variance', stats.variance)}
                {renderStatCard('Q1 (25th Percentile)', stats.q1)}
                {renderStatCard('Q3 (75th Percentile)', stats.q3)}
                {renderStatCard('IQR (Q3-Q1)', stats.iqr)}
                <div className="p-3 bg-gray-100 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Outliers Detected</div>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.hasOutliers ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Interpretation</h3>
            <p className="text-blue-700">
              {generateInterpretation(stats)}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {data.length === 0 
              ? 'No data provided for analysis'
              : 'No numeric data found in the provided dataset'}
          </p>
        </div>
      )}
    </div>
  );
};

function generateInterpretation(stats: any): string {
  let interpretation = `Your dataset contains ${stats.count} numeric values. `;
  
  if (stats.stdDev / stats.mean > 0.5) {
    interpretation += 'The data shows high variability (standard deviation is more than 50% of the mean). ';
  } else {
    interpretation += 'The data shows relatively low variability. ';
  }

  if (stats.hasOutliers) {
    interpretation += 'Potential outliers were detected in your data. ';
  }

  if (Math.abs(stats.mean - stats.median) / stats.mean > 0.1) {
    interpretation += 'The difference between mean and median suggests the data may be skewed. ';
  }

  interpretation += `The middle 50% of values fall between ${stats.q1.toFixed(2)} and ${stats.q3.toFixed(2)}.`;

  return interpretation;
}

export default StatisticalAnalysis; 