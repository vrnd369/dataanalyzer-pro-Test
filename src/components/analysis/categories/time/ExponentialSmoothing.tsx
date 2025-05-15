import React from 'react';

interface ExponentialSmoothingProps {
  data: { timestamp: number; value: number; field: string; }[];
  onAnalyze: (params: ExponentialSmoothingParams) => void;
  forecastPeriods: number;
  confidenceLevel: number;
  analysisResult?: {
    accuracyMetrics?: {
      mse?: number;
      mae?: number;
      rmse?: number;
    };
    forecast?: number[];
  };
  isLoading?: boolean;
}

interface ExponentialSmoothingParams {
  alpha: number;
  beta: number;
  gamma: number;
  seasonalPeriods: number;
  seasonalType: 'additive' | 'multiplicative';
}

export function ExponentialSmoothing({ 
  onAnalyze, 
  analysisResult, 
  isLoading = false 
}: ExponentialSmoothingProps) {
  const [params, setParams] = React.useState<ExponentialSmoothingParams>({
    alpha: 0.2,
    beta: 0.1,
    gamma: 0.05,
    seasonalPeriods: 12,
    seasonalType: 'additive'
  });

  const [showHelp, setShowHelp] = React.useState(false);

  const handleParamChange = (key: keyof ExponentialSmoothingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = () => {
    onAnalyze(params);
  };

  const getParameterDescription = (param: string) => {
    const descriptions: Record<string, string> = {
      alpha: "Controls the weight given to recent observations (level smoothing). Higher values make the model more responsive to recent changes.",
      beta: "Controls the trend component smoothing. Higher values give more weight to recent trends.",
      gamma: "Controls the seasonal component smoothing. Higher values make seasonal patterns more responsive to recent changes.",
      seasonalPeriods: "Number of periods in a complete seasonal cycle (e.g., 12 for monthly data with yearly seasonality).",
      seasonalType: "'Additive' when seasonal variations are constant, 'Multiplicative' when they vary with the level of the series."
    };
    return descriptions[param] || "";
  };

  const getAccuracyLevel = (value?: number) => {
    if (value === undefined) return null;
    if (value < 0.1) return "Excellent";
    if (value < 0.3) return "Good";
    if (value < 0.5) return "Fair";
    return "Poor";
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Exponential Smoothing Forecast</h2>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showHelp ? 'Hide Help' : 'Show Help'}
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-gray-700">
          <p className="mb-2">Exponential smoothing is a time series forecasting method that uses weighted averages of past observations, with weights decaying exponentially.</p>
          <p>Adjust the parameters below to optimize your forecast model:</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="group relative">
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
              {key.charAt(0).toUpperCase() + key.slice(1)} {key === 'alpha' ? '(Level)' : key === 'beta' ? '(Trend)' : key === 'gamma' ? '(Seasonal)' : ''}
            </label>
            {typeof value === 'number' ? (
              <div>
                <input
                  id={key}
                  type="number"
                  min={key === 'seasonalPeriods' ? 2 : 0}
                  max={key === 'seasonalPeriods' ? 24 : 1}
                  step={key === 'seasonalPeriods' ? 1 : 0.01}
                  value={value}
                  onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, 
                    key === 'seasonalPeriods' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                  className="w-full p-2 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                {key !== 'seasonalPeriods' && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                )}
              </div>
            ) : (
              <select
                id={key}
                value={value}
                onChange={(e) => handleParamChange(key as keyof ExponentialSmoothingParams, e.target.value)}
                className="w-full p-2 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="additive">Additive</option>
                <option value="multiplicative">Multiplicative</option>
              </select>
            )}
            <div className="absolute hidden group-hover:block z-10 p-2 mt-1 text-xs bg-gray-100 text-gray-700 rounded shadow-lg">
              {getParameterDescription(key)}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {isLoading ? 'Analyzing...' : 'Run Forecast Analysis'}
      </button>

      {analysisResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Analysis Results</h3>
          
          {analysisResult.accuracyMetrics && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Accuracy Metrics</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(analysisResult.accuracyMetrics).map(([metric, value]) => (
                  <div key={metric} className="p-2 bg-white rounded shadow-sm">
                    <div className="text-sm font-medium text-gray-600">{metric.toUpperCase()}</div>
                    <div className="text-lg font-semibold">{value?.toFixed(4)}</div>
                    {getAccuracyLevel(value) && (
                      <div className={`text-xs ${
                        getAccuracyLevel(value) === 'Excellent' ? 'text-green-600' :
                        getAccuracyLevel(value) === 'Good' ? 'text-blue-600' :
                        getAccuracyLevel(value) === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getAccuracyLevel(value)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResult.forecast && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">Forecast Preview</h4>
              <div className="text-sm text-gray-600">
                Next {Math.min(5, analysisResult.forecast.length)} periods: {analysisResult.forecast.slice(0, 5).map(v => v.toFixed(2)).join(', ')}
                {analysisResult.forecast.length > 5 && '...'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Tip: Start with default values and adjust based on your data characteristics.</p>
      </div>
    </div>
  );
} 