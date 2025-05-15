import React from 'react';
import { BarChart2, Info, HelpCircle } from 'lucide-react';
import type { DataField } from '@/types/data';
import { calculateCorrelation } from '@/utils/analysis/statistics/correlation';

interface CorrelationMatrixProps {
  data: {
    fields: DataField[];
  };
  onFieldSelectionChange?: (selectedFields: string[]) => void;
}

interface CellProps {
  value: number;
  field1: string;
  field2: string;
  isSelected: boolean;
  onClick: () => void;
}

function CorrelationCell({ value, field1, field2, isSelected, onClick }: CellProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const interpretCorrelation = (value: number): { description: string; implication: string } => {
    const strength = Math.abs(value);
    const direction = value > 0 ? 'positive' : 'negative';
    
    let description = '';
    let implication = '';
    
    if (strength > 0.8) {
      description = `Very strong ${direction} correlation`;
      implication = direction === 'positive' 
        ? 'These variables tend to increase together' 
        : 'As one variable increases, the other tends to decrease';
    } else if (strength > 0.6) {
      description = `Strong ${direction} correlation`;
      implication = direction === 'positive'
        ? 'There is a clear relationship between these variables'
        : 'There is an inverse relationship between these variables';
    } else if (strength > 0.4) {
      description = `Moderate ${direction} correlation`;
      implication = 'This suggests some relationship, but other factors may be involved';
    } else if (strength > 0.2) {
      description = `Weak ${direction} correlation`;
      implication = 'The relationship is slight and may not be meaningful';
    } else {
      description = 'Very weak or no correlation';
      implication = 'These variables appear to have little to no linear relationship';
    }
    
    return { description, implication };
  };

  const { description, implication } = interpretCorrelation(value);

  return (
    <td 
      className={`relative px-4 py-2 text-center transition-all group
        ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-80 z-10' : ''}
        ${value > 0 ? 'hover:bg-blue-600/20' : 'hover:bg-red-600/20'}
      `}
      style={{
        backgroundColor: getCorrelationColor(value || 0),
        color: Math.abs(value) > 0.5 ? 'white' : 'black',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      {(value || 0).toFixed(2)}
      {showTooltip && (
        <div className="absolute z-20 w-72 p-3 bg-white rounded-lg shadow-xl border border-gray-200 -translate-x-1/2 left-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-medium text-gray-900 mb-1">{field1} ↔ {field2}</p>
          <p className="text-sm font-medium text-gray-700 mb-1">{description}</p>
          <p className="text-xs text-gray-600 mb-1">{implication}</p>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Correlation: {value.toFixed(3)}</span>
            <span>Strength: {(Math.abs(value) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </td>
  );
}

export function CorrelationMatrix({ data, onFieldSelectionChange }: CorrelationMatrixProps) {
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [showHelp, setShowHelp] = React.useState(false);
  
  const numericFields = data?.fields?.filter(f => f.type === 'number') || [];
  
  const toggleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev => {
      const newSelection = prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName];
      
      if (onFieldSelectionChange) {
        onFieldSelectionChange(newSelection);
      }
      
      return newSelection;
    });
  };

  const correlations = React.useMemo(() => {
    const matrix: Record<string, number> = {};
    
    if (numericFields.length < 2) return matrix;
    
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = 0; j < numericFields.length; j++) { 
        const field1 = numericFields[i];
        const field2 = numericFields[j];
        const values1 = field1.value as number[];
        const values2 = field2.value as number[];
        
        if (!values1?.length || !values2?.length) continue;
        
        const key = `${field1.name}_${field2.name}`;

        if (i === j) {
          matrix[key] = 1; // Perfect correlation with itself
        } else if (i < j) { // Only calculate once for each pair
          try {
            matrix[key] = calculateCorrelation(values1, values2);
            matrix[`${field2.name}_${field1.name}`] = matrix[key]; // Mirror the value
          } catch (error) {
            console.warn(`Failed to calculate correlation for ${field1.name} vs ${field2.name}:`, error);
            matrix[key] = 0;
            matrix[`${field2.name}_${field1.name}`] = 0;
          }
        }
      }
    }
    
    return matrix;
  }, [numericFields]);

  if (!data?.fields?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center gap-2 text-gray-500 p-8 bg-gray-50 rounded-lg">
          <Info className="w-5 h-5" />
          <p>No data available for correlation analysis</p>
        </div>
      </div>
    );
  }

  if (numericFields.length < 2) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-center gap-2 text-gray-500 p-8 bg-gray-50 rounded-lg">
          <Info className="w-5 h-5" />
          <p>At least 2 numeric fields are required for correlation analysis</p>
        </div>
      </div>
    );
  }

  // Find strongest correlations
  const strongestCorrelations = React.useMemo(() => {
    const pairs: { field1: string; field2: string; value: number }[] = [];
    
    for (let i = 0; i < numericFields.length; i++) {
      for (let j = i + 1; j < numericFields.length; j++) {
        const field1 = numericFields[i];
        const field2 = numericFields[j];
        const key = `${field1.name}_${field2.name}`;
        const value = correlations[key] || 0;
        
        pairs.push({
          field1: field1.name,
          field2: field2.name,
          value
        });
      }
    }
    
    return pairs
      .filter(pair => pair.field1 !== pair.field2)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3);
  }, [correlations, numericFields]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Correlation Matrix</h3>
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Explore relationships between numeric variables
          </p>
        </div>
        {selectedFields.length > 0 && (
          <div className="text-sm bg-yellow-50 px-3 py-1 rounded-full text-yellow-800">
            {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {showHelp && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2">How to interpret correlations:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
            <li>Values range from -1 to 1, where 1 is perfect positive correlation, -1 is perfect negative correlation</li>
            <li>Click on cells to select pairs for further analysis</li>
            <li>Hover over cells for detailed interpretation</li>
            <li>Strong correlations (|r| &gt; 0.7) may indicate important relationships</li>
            <li>Correlation does not imply causation</li>
          </ul>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Strongest Correlations:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {strongestCorrelations.map((corr) => (
            <div 
              key={`${corr.field1}-${corr.field2}`}
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: getCorrelationColor(corr.value),
                color: Math.abs(corr.value) > 0.5 ? 'white' : 'black'
              }}
            >
              <p className="font-medium text-sm">
                {corr.field1} ↔ {corr.field2}
              </p>
              <p className="text-xs">
                {corr.value > 0 ? 'Positive' : 'Negative'} correlation: {corr.value.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white rounded-lg overflow-hidden transform opacity-0 animate-fade-in">
          <thead>
            <tr>
              <th className="px-4 py-2 bg-gray-100"></th>
              {numericFields.map(field => (
                <th 
                  key={field.name} 
                  className={`px-4 py-2 bg-gray-100 font-medium text-gray-700 cursor-pointer transition-colors
                    ${selectedFields.includes(field.name) ? 'bg-yellow-100' : ''}
                  `}
                  onClick={() => toggleFieldSelection(field.name)}
                >
                  <div className="transform -rotate-45 origin-left translate-y-6 whitespace-nowrap transition-transform hover:scale-110">
                    {field.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numericFields.map((field1) => (
              <tr key={field1.name}>
                <th 
                  className={`px-4 py-2 bg-gray-100 font-medium text-gray-700 text-left cursor-pointer transition-colors
                    ${selectedFields.includes(field1.name) ? 'bg-yellow-100' : ''}
                  `}
                  onClick={() => toggleFieldSelection(field1.name)}
                >
                  {field1.name}
                </th>
                {numericFields.map((field2) => {
                  const key = `${field1.name}_${field2.name}`;
                  const value = correlations[key] || 0;
                  return (
                    <CorrelationCell 
                      key={key}
                      value={value}
                      field1={field1.name}
                      field2={field2.name}
                      isSelected={selectedFields.includes(field1.name) && selectedFields.includes(field2.name)}
                      onClick={() => {
                        toggleFieldSelection(field1.name);
                        toggleFieldSelection(field2.name);
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Color Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-black">Positive Correlation</p>
                <p className="text-xs text-gray-600">Darker = stronger positive relationship</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-gray-300" />
              <div className="text-sm">
                <p className="font-medium text-black">No Correlation</p>
                <p className="text-xs text-gray-600">Values near zero indicate no linear relationship</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-red-600" />
              <div className="text-sm">
                <p className="font-medium text-black">Negative Correlation</p>
                <p className="text-xs text-gray-600">Darker = stronger negative relationship</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Interpretation Guide</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">|r| ≥ 0.8</p>
              <p className="text-xs text-gray-600">Very strong relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">0.6 ≤ |r| &lt; 0.8</p>
              <p className="text-xs text-gray-600">Strong relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">0.4 ≤ |r| &lt; 0.6</p>
              <p className="text-xs text-gray-600">Moderate relationship</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">|r| &lt; 0.4</p>
              <p className="text-xs text-gray-600">Weak or no relationship</p>
            </div>
          </div>
        </div>
      </div>

      {selectedFields.length >= 2 && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <h4 className="font-medium text-indigo-800 mb-2">Selected Fields Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedFields.map((field1, i) => {
              return selectedFields.slice(i + 1).map(field2 => {
                const key = `${field1}_${field2}`;
                const value = correlations[key] || 0;
                const absValue = Math.abs(value);
                
                return (
                  <div key={key} className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-800">
                      {field1} ↔ {field2}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Correlation: <span className="font-medium">{value.toFixed(3)}</span>
                    </p>
                    {absValue > 0.6 ? (
                      <p className="text-xs text-green-700">
                        This strong correlation ({value > 0 ? 'positive' : 'negative'}) suggests a significant relationship between these variables. Consider investigating further.
                      </p>
                    ) : absValue > 0.3 ? (
                      <p className="text-xs text-blue-700">
                        This moderate correlation may indicate some relationship, but other factors are likely involved.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">
                        Weak correlation detected. These variables show little linear relationship.
                      </p>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getCorrelationColor(value: number): string {
  const absValue = Math.abs(value);
  const opacity = Math.min(0.8, absValue * 0.9 + 0.1); // Ensure minimum opacity for visibility
  
  if (value > 0) {
    return `rgba(59, 130, 246, ${opacity})`; // Blue
  } else if (value < 0) {
    return `rgba(239, 68, 68, ${opacity})`; // Red
  }
  return 'rgba(229, 231, 235, 0.7)'; // Light gray
}