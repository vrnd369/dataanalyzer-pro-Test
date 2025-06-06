import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Clock, TrendingUp } from 'lucide-react';
import { ARIMAAnalyzer } from './ARIMAAnalyzer';
import TimeSeriesView from './TimeSeriesView';
import { TimeSeriesResult } from '@/utils/analysis/timeSeries/types';

interface TimeSeriesAnalysisProps {
  data?: { timestamp: number; value: number; field?: string }[];
}

export default function TimeSeriesAnalysis({ data: initialData }: TimeSeriesAnalysisProps) {
  const [timeSeriesModel, setTimeSeriesModel] = useState('arima');
  const [data, setData] = useState<{ timestamp: number; value: number; field?: string }[]>(initialData || []);
  const [forecastData, setForecastData] = useState<number[]>([]);
  const [modelPerformance, setModelPerformance] = useState<{ rmse: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesResults, setTimeSeriesResults] = useState<TimeSeriesResult[]>([]);

  // Handle model type change
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeSeriesModel(event.target.value);
  };

  // Handle CSV file upload and parse
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        try {
          const parsedData = result.data.map((row: any) => ({
            timestamp: new Date(row['Date']).getTime(),
            value: parseFloat(row['Sales']) || 0,
          }));
          setData(parsedData);
          setError(null);
        } catch (err) {
          setError('Error parsing CSV file. Please ensure it has Date and Sales columns.');
        }
      },
      header: true,
      error: (error) => {
        setError('Error reading CSV file: ' + error.message);
      }
    });
  };

  // Process data with selected model
  const processData = async () => {
    if (!data.length) return;

    setIsLoading(true);
    setError(null);

    try {
      let forecast: number[] = [];
      let performance = { rmse: 0 };

      switch (timeSeriesModel) {
        case 'arima':
          // Use existing ARIMA implementation
          const arimaAnalyzer = new ARIMAAnalyzer(data, { p: 1, d: 1, q: 1, seasonal: false, seasonalPeriod: 12 });
          const arimaResults = arimaAnalyzer.analyze();
          forecast = arimaResults.forecast || [];
          performance = { rmse: arimaResults.metrics?.rmse || 0 };
          break;
        // Add other model implementations here
        default:
          break;
      }

      setForecastData(forecast);
      setModelPerformance(performance);
      
      // Create TimeSeriesResult object
      const result: TimeSeriesResult = {
        field: 'Time Series',
        trend: 'stable',
        seasonality: null,
        forecast: forecast,
        confidence: 0.95,
        components: {
          trend: [],
          seasonal: [],
          residual: []
        }
      };
      
      setTimeSeriesResults([result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      processData();
    }
  }, [timeSeriesModel, data]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-black-500" />
            <h4 className="text-lg font-semibold text-black">Time Series Analysis</h4>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">Model Type</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={timeSeriesModel}
              onChange={handleModelChange}
            >
              <option value="arima" className="text-black">ARIMA</option>
              <option value="exponential" className="text-black">Exponential Smoothing</option>
              <option value="prophet" className="text-black">Prophet</option>
              <option value="lstm" className="text-black">LSTM</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {data.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-black mb-2">Time Series Analysis</h5>
                <TimeSeriesView 
                  results={timeSeriesResults} 
                  isLoading={isLoading} 
                  error={error} 
                />
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md">
                    <p className="text-sm text-black">Forecast (Next 5 periods)</p>
                    <p className="text-lg font-semibold text-black-500">
                      {forecastData.length > 0 ? forecastData.join(', ') : '[Forecast values]'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <p className="text-sm text-black">Model Performance</p>
                    <p className="text-lg font-semibold text-black-500">
                      RMSE: {modelPerformance ? modelPerformance.rmse.toFixed(4) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modelPerformance && (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-black-5">Analysis Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-black">Model Performance</h4>
              <p className="text-black mt-1">
                RMSE: {modelPerformance.rmse.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 