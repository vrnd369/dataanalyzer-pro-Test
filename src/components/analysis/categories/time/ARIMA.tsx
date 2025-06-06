import React from 'react';
import { ARIMAParams } from './types';
import { ARIMAAnalyzer } from './ARIMAAnalyzer';
import { TimeSeriesResult } from '@/utils/analysis/timeSeries/types';

interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  field?: string;
}

interface ARIMAProps {
  data: TimeSeriesDataPoint[];
  onAnalyze: (results: TimeSeriesResult[]) => void;
  forecastPeriods: number;
  confidenceLevel: number;
}

export function ARIMA({ data, onAnalyze }: ARIMAProps) {
  const [params, setParams] = React.useState<ARIMAParams>({
    p: 1,
    d: 1,
    q: 1,
    seasonal: false,
    seasonalPeriod: 12
  });

  const handleParamChange = (key: keyof ARIMAParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = () => {
    // Group data by field name if multiple fields exist
    const fieldGroups = data.reduce((groups, item) => {
      // Assuming each data point has a 'field' property
      const fieldName = item.field || 'value';
      if (!groups[fieldName]) {
        groups[fieldName] = [];
      }
      groups[fieldName].push({
        timestamp: item.timestamp,
        value: item.value
      });
      return groups;
    }, {} as Record<string, { timestamp: number; value: number }[]>);

    // Process each field with ARIMA
    const results: TimeSeriesResult[] = Object.entries(fieldGroups).map(([fieldName, fieldData]) => {
      const analyzer = new ARIMAAnalyzer(fieldData, params);
      const analysis = analyzer.analyze();
      
      // Determine trend based on the last few values
      const values = fieldData.map(d => d.value);
      const lastValues = values.slice(-5);
      const trend = lastValues[lastValues.length - 1] > lastValues[0] 
        ? 'increasing' 
        : lastValues[lastValues.length - 1] < lastValues[0] 
          ? 'decreasing' 
          : 'stable';
      
      // Format results to match TimeSeriesResult interface
      return {
        field: fieldName,
        trend,
        seasonality: params.seasonal ? params.seasonalPeriod : null,
        forecast: analysis.forecast,
        confidence: 1 - analysis.metrics.rmse / (Math.max(...values) - Math.min(...values)),
        components: {
          trend: analysis.parameters.ar.map((_, i) => values[i] || 0),
          seasonal: params.seasonal ? Array(values.length).fill(0).map((_, i) => 
            Math.sin(2 * Math.PI * i / params.seasonalPeriod) * 0.1 * values[i]) : Array(values.length).fill(0),
          residual: values.map((v, i) => v - (analysis.parameters.ar[i] || 0))
        }
      };
    });

    onAnalyze(results);
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font text-black mb-4">ARIMA Analysis</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="p" className="block text-sm font-medium text-black mb-1">
            Autoregressive Order (p)
          </label>
          <input
            id="p"
            type="number"
            min="0"
            max="5"
            value={params.p}
            onChange={(e) => handleParamChange('p', parseInt(e.target.value))}
            className="w-full p-2 border rounded text-black"
          />
        </div>
        
        <div>
          <label htmlFor="d" className="block text-sm font-medium text-black mb-1">
            Difference Order (d)
          </label>
          <input
            id="d"
            type="number"
            min="0"
            max="2"
            value={params.d}
            onChange={(e) => handleParamChange('d', parseInt(e.target.value))}
            className="w-full p-2 border rounded text-black"
          />
        </div>
        
        <div>
          <label htmlFor="q" className="block text-sm font-medium text-black mb-1">
            Moving Average Order (q)
          </label>
          <input
            id="q"
            type="number"
            min="0"
            max="5"
            value={params.q}
            onChange={(e) => handleParamChange('q', parseInt(e.target.value))}
            className="w-full p-2 border rounded text-black"
          />
        </div>
        
        <div>
          <label htmlFor="seasonal" className="block text-sm font-medium text-black mb-1">
            Seasonal
          </label>
          <select
            id="seasonal"
            value={params.seasonal ? 'true' : 'false'}
            onChange={(e) => handleParamChange('seasonal', e.target.value === 'true')}
            className="w-full p-2 border rounded text-black"
          >
            <option value="true" className="text-black">Yes</option>
            <option value="false" className="text-black">No</option>
          </select>
        </div>
        
        {params.seasonal && (
          <div>
            <label htmlFor="seasonalPeriod" className="block text-sm font-medium text-black mb-1">
              Seasonal Period
            </label>
            <input
              id="seasonalPeriod"
              type="number"
              min="2"
              max="24"
              value={params.seasonalPeriod}
              onChange={(e) => handleParamChange('seasonalPeriod', parseInt(e.target.value))}
              className="w-full p-2 border rounded text-black"
            />
          </div>
        )}
      </div>
      
      <button
        onClick={handleAnalyze}
        className="w-full bg-blue-800 text-white py-2 px-4 rounded hover:bg-gray-800"
      >
        Run ARIMA Analysis
      </button>
    </div>
  );
} 