import React from 'react';

interface SeasonalDecompositionProps {
  data: { timestamp: number; value: number; field: string; }[];
  onAnalyze: (params: SeasonalDecompositionParams) => void;
  forecastPeriods: number;
}

interface SeasonalDecompositionParams {
  period: number;
  model: 'additive' | 'multiplicative';
  extrapolateTrend: boolean;
}

export function SeasonalDecomposition({ onAnalyze }: SeasonalDecompositionProps) {
  const [params, setParams] = React.useState<SeasonalDecompositionParams>({
    period: 12,
    model: 'additive',
    extrapolateTrend: false
  });

  const handleParamChange = (key: keyof SeasonalDecompositionParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = () => {
    onAnalyze(params);
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font text-black mb-4">Seasonal Decomposition</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-black mb-1">
            Seasonal Period
          </label>
          <input
            id="period"
            type="number"
            min="2"
            max="24"
            value={params.period}
            onChange={(e) => handleParamChange('period', parseInt(e.target.value))}
            className="w-full p-2 border rounded text-black"
          />
        </div>
        
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-black mb-1">
            Decomposition Model
          </label>
          <select
            id="model"
            value={params.model}
            onChange={(e) => handleParamChange('model', e.target.value as 'additive' | 'multiplicative')}
            className="w-full p-2 border rounded text-black"
          >
            <option value="additive" className="text-black">Additive</option>
            <option value="multiplicative" className="text-black">Multiplicative</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="extrapolateTrend" className="block text-sm font-medium text-black mb-1">
            Extrapolate Trend
          </label>
          <select
            id="extrapolateTrend"
            value={params.extrapolateTrend ? 'true' : 'false'}
            onChange={(e) => handleParamChange('extrapolateTrend', e.target.value === 'true')}
            className="w-full p-2 border rounded text-black"
          >
            <option value="true" className="text-black">Yes</option>
            <option value="false" className="text-black">No</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={handleAnalyze}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Run Seasonal Decomposition
      </button>
    </div>
  );
} 