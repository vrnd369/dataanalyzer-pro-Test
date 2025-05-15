import { DataField } from '@/types/data';
import { useState, useEffect } from 'react';

interface Correlation {
  field1: string;
  field2: string;
  coefficient: number;
  significance: string;
}

interface FieldStats {
  name: string;
  type: string;
  count: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stdDev?: number;
  missing: number;
}

interface StatsSummaryProps {
  fields: DataField[];
  correlationThreshold?: number;
}

export function StatsSummary({ fields, correlationThreshold: initialThreshold = 0.5 }: StatsSummaryProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldStats, setFieldStats] = useState<FieldStats[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState(initialThreshold);

  // Calculate basic statistics for each field
  const calculateFieldStats = (fields: DataField[]): FieldStats[] => {
    return fields.map(field => {
      const stats: FieldStats = {
        name: field.name,
        type: field.type,
        count: field.value.length,
        missing: 0
      };

      if (field.type === 'number') {
        const values = field.value as number[];
        const numericValues = values.filter(v => !isNaN(v));
        stats.missing = values.length - numericValues.length;
        
        if (numericValues.length > 0) {
          const sorted = [...numericValues].sort((a, b) => a - b);
          const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          stats.mean = mean;
          stats.median = sorted[Math.floor(sorted.length / 2)];
          stats.min = sorted[0];
          stats.max = sorted[sorted.length - 1];
          
          // Calculate standard deviation using the mean we just calculated
          stats.stdDev = Math.sqrt(
            numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length
          );
        }
      } else if (field.type === 'string') {
        stats.missing = (field.value as string[]).filter(v => !v || v.trim() === '').length;
      }

      return stats;
    });
  };

  // Calculate Pearson correlation coefficient with significance check
  const calculateCorrelations = (fields: DataField[], selected: string[]): Correlation[] => {
    const numericFields = fields.filter(f => 
      f.type === 'number' && (selected.length === 0 || selected.includes(f.name))
    );
    const correlations: Correlation[] = [];

    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i];
        const field2 = numericFields[j];
        const values1 = (field1.value as number[]).filter(v => !isNaN(v));
        const values2 = (field2.value as number[]).filter(v => !isNaN(v));
        
        // Only calculate if same length and has data
        if (values1.length !== values2.length || values1.length < 2) continue;

        // Calculate Pearson correlation coefficient
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        const variance1 = values1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / values1.length;
        const variance2 = values2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / values2.length;
        
        const covariance = values1.reduce((a, b, i) => a + (b - mean1) * (values2[i] - mean2), 0) / values1.length;
        
        const coefficient = covariance / Math.sqrt(variance1 * variance2);

        // Determine significance (simple threshold-based approach)
        let significance = 'Weak';
        if (Math.abs(coefficient) > 0.8) significance = 'Very Strong';
        else if (Math.abs(coefficient) > 0.6) significance = 'Strong';
        else if (Math.abs(coefficient) > 0.4) significance = 'Moderate';

        correlations.push({
          field1: field1.name,
          field2: field2.name,
          coefficient: coefficient,
          significance
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  };

  // Initialize on component mount
  useEffect(() => {
    setIsLoading(true);
    const stats = calculateFieldStats(fields);
    setFieldStats(stats);
    setCorrelations(calculateCorrelations(fields, []));
    setIsLoading(false);
  }, [fields]);

  // Handle field selection change
  const handleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName) 
        : [...prev, fieldName]
    );
  };

  // Recalculate correlations when selected fields change
  useEffect(() => {
    if (fieldStats.length > 0) {
      setCorrelations(calculateCorrelations(fields, selectedFields));
    }
  }, [selectedFields, fieldStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const significantCorrelations = correlations.filter(c => Math.abs(c.coefficient) > threshold);
  const numericFields = fields.filter(f => f.type === 'number');

  return (
    <div className="space-y-6">
      {/* Field Selection */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-medium text-black mb-4">Select Fields for Correlation Analysis</h4>
        <div className="flex flex-wrap gap-2">
          {numericFields.map((field, index) => (
            <button
              key={index}
              onClick={() => handleFieldSelection(field.name)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedFields.includes(field.name)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {field.name}
            </button>
          ))}
          {numericFields.length === 0 && (
            <p className="text-sm text-gray-500">No numeric fields available for correlation analysis</p>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {selectedFields.length > 0 
            ? `${selectedFields.length} field(s) selected` 
            : 'All numeric fields will be analyzed (select specific fields to narrow down)'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Field Overview */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-black mb-4">Dataset Overview</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Total Fields</p>
                <p className="font-medium text-black">{fields.length}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Sample Size</p>
                <p className="font-medium text-black">{fields[0]?.value.length || 0}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Numeric Fields</p>
                <p className="font-medium text-black">{numericFields.length}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">Missing Values</p>
                <p className="font-medium text-black">
                  {fieldStats.reduce((sum, stat) => sum + stat.missing, 0)}
                </p>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium mb-2 text-black">Field Types</h5>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(fields.map(f => f.type))).map((type, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded text-black">
                    {type}: {fields.filter(f => f.type === type).length}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Correlations */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-black">Correlation Analysis</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 text-black">Threshold:</span>
              <select 
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="text-xs border rounded px-2 py-1 text-black"
              >
                <option value="0.3" className="text-black">0.3</option>
                <option value="0.5" className="text-black">0.5</option>
                <option value="0.7" className="text-black">0.7</option>
              </select>
            </div>
          </div>
          
          {significantCorrelations.length > 0 ? (
            <div className="space-y-3">
              {significantCorrelations.map((corr, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-black">
                      {corr.field1} ↔ {corr.field2}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      corr.coefficient > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {corr.coefficient.toFixed(2)} ({corr.significance})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        corr.coefficient > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.abs(corr.coefficient) * 100}%`,
                        marginLeft: corr.coefficient > 0 ? '0' : 'auto'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                {correlations.length === 0 
                  ? 'No numeric fields available for correlation analysis' 
                  : `No correlations above ${threshold} threshold found`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Field Statistics */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-medium text-black mb-4">Field Statistics</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Count</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Missing</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mean</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Median</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Min</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Max</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Std Dev</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fieldStats.map((stat, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm text-gray-900">{stat.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{stat.type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{stat.count}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.missing} ({stat.count > 0 ? ((stat.missing / stat.count) * 100).toFixed(1) : 0}%)
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.mean !== undefined ? stat.mean.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.median !== undefined ? stat.median.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.min !== undefined ? stat.min.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.max !== undefined ? stat.max.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {stat.stdDev !== undefined ? stat.stdDev.toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}