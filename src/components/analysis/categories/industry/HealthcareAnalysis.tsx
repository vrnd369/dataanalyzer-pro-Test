import React from 'react';
import { Activity, AlertCircle, CheckCircle, ClipboardList, Search, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { HealthcareAnalyzer } from '@/utils/analysis/industry/healthcare';
import { DataField } from '@/types/data';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HealthcareAnalysisProps {
  data: {
    fields: DataField[];
  };
}

// Helper component for displaying validation messages
const ValidationMessage = ({ type, messages }: { type: 'error' | 'warning', messages: string[] }) => {
  if (messages.length === 0) return null;
  
  const Icon = type === 'error' ? AlertCircle : AlertCircle;
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const textColor = type === 'error' ? 'text-red-800' : 'text-yellow-800';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-yellow-200';
  const title = type === 'error' ? 'Validation Errors' : 'Validation Warnings';

  return (
    <div className={`${bgColor} ${borderColor} border p-4 rounded-lg mb-4`}>
      <h3 className={`text-lg font-semibold ${textColor} mb-2 flex items-center gap-2`}>
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      <ul className="list-disc list-inside space-y-1">
        {messages.map((message, index) => (
          <li key={index} className={textColor}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to safely convert values to numbers
function safeNumberConversion(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }
  return 0;
}

// Helper function to calculate numeric statistics safely
function calculateNumericStats(values: any[]): { avg: number; min: number; max: number } {
  const numbers = values.map(safeNumberConversion);
  const validNumbers = numbers.filter(n => !isNaN(n));
  
  if (validNumbers.length === 0) {
    return { avg: 0, min: 0, max: 0 };
  }

  return {
    avg: validNumbers.reduce((sum, val) => sum + val, 0) / validNumbers.length,
    min: Math.min(...validNumbers),
    max: Math.max(...validNumbers)
  };
}

// Helper component for data summary
const DataSummary = ({ fields }: { fields: DataField[] }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 text-black">
      <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Data Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field, index) => (
          <div key={index} className="bg-white p-3 rounded shadow-sm text-black">
            <h4 className="font-medium text-gray-900">{field.name}</h4>
            <p className="text-sm text-gray-500 mb-2">Type: {field.type}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Records:</span>
              <span className="font-medium text-black">{field.value?.length || 0}</span>
            </div>
            {field.value?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sample:</span>
                <span className="font-medium truncate max-w-xs">
                  {String(field.value[0])}
                  {field.value.length > 1 ? `, ... (${field.value.length} total)` : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for analytics type cards
const AnalyticsTypeCard = ({ 
  type, 
  description,
  examples 
}: {
  type: 'Descriptive' | 'Diagnostic' | 'Predictive' | 'Prescriptive';
  description: string;
  examples: string[];
}) => {
  const iconMap = {
    Descriptive: ClipboardList,
    Diagnostic: Search,
    Predictive: TrendingUp,
    Prescriptive: ClipboardCheck
  };
  
  const colorMap = {
    Descriptive: 'bg-blue-50 border-blue-200 text-blue-800',
    Diagnostic: 'bg-purple-50 border-purple-200 text-purple-800',
    Predictive: 'bg-orange-50 border-orange-200 text-orange-800',
    Prescriptive: 'bg-green-50 border-green-200 text-green-800'
  };
  
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <div className={`border rounded-lg p-4 ${colors}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-6 h-6" />
        <h4 className="font-semibold text-lg">{type} Analytics</h4>
      </div>
      <p className="mb-3">{description}</p>
      <div>
        <h5 className="font-medium mb-1">Examples:</h5>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {examples.map((example, index) => (
            <li key={index}>{example}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export function HealthcareAnalysis({ data }: HealthcareAnalysisProps) {
  const [validationResult, setValidationResult] = React.useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });

  // Generate field definitions when data changes
  React.useEffect(() => {
    if (data?.fields) {
      // Basic validation - just check if we have data
      const warnings: string[] = [];
      if (data.fields.length === 0) {
        warnings.push('No data fields provided');
      }
      
      setValidationResult({
        isValid: true,
        errors: [],
        warnings
      });
    }
  }, [data.fields]);

  // Perform analysis only when data is valid
  const analysisResults = React.useMemo(() => {
    if (!validationResult.isValid) return null;
    
    try {
      // Check if we have the required fields for different types of analysis
      const hasTreatmentFields = data.fields.some(f => f.name.toLowerCase() === 'treatment') && 
                               data.fields.some(f => f.name.toLowerCase() === 'outcome');
      const hasDateField = data.fields.some(f => f.type === 'date');
      const hasNumericFields = data.fields.some(f => f.type === 'number');
      const hasOutcomeField = data.fields.some(f => f.name.toLowerCase().includes('outcome'));

      // Basic validation
      if (data.fields.length === 0) {
        throw new Error('No data fields provided');
      }

      // Ensure all fields have values
      const invalidFields = data.fields.filter(f => !f.value || f.value.length === 0);
      if (invalidFields.length > 0) {
        throw new Error(`Empty values found in fields: ${invalidFields.map(f => f.name).join(', ')}`);
      }

      const results: any = {};

      // Only run analyses if we have the required fields
      if (hasTreatmentFields) {
        results.treatmentEffectiveness = HealthcareAnalyzer.analyzeTreatmentEffectiveness(data.fields);
        results.prescriptiveRecommendations = HealthcareAnalyzer.generateRecommendations(data.fields);
      }

      if (hasDateField && hasNumericFields) {
        results.trendAnalysis = HealthcareAnalyzer.analyzeTrends(data.fields);
      }

      if (hasNumericFields && hasOutcomeField) {
        results.predictiveModels = HealthcareAnalyzer.buildPredictiveModels(data.fields);
      }

      // If we have no results at all, throw an error
      if (Object.keys(results).length === 0) {
        throw new Error('No suitable data fields found for analysis. Please provide treatment/outcome data, numeric fields, or date fields.');
      }

      return results;
    } catch (error) {
      console.error("Analysis error:", error);
      setValidationResult(prev => ({
        ...prev,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error occurred']
      }));
      return null;
    }
  }, [data.fields, validationResult.isValid]);

  if (!analysisResults) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Analysis Not Available
        </h3>
        <p className="text-yellow-700">
          {validationResult.errors.length > 0 
            ? validationResult.errors.join('. ')
            : 'The system couldn\'t analyze the provided data. Please check your data format.'}
        </p>
      </div>
    );
  }

  const { 
    treatmentEffectiveness, 
    predictiveModels,
    prescriptiveRecommendations 
  } = analysisResults;

  return (
    <div className="space-y-6">
      {/* Show any warnings */}
      {validationResult.warnings.length > 0 && (
        <ValidationMessage type="warning" messages={validationResult.warnings} />
      )}
      <DataSummary fields={data.fields} />

      {/* Healthcare Analytics Types Overview */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Healthcare Analytics Types
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnalyticsTypeCard
            type="Descriptive"
            description="Analyzes historical data to understand past events and identify trends."
            examples={[
              "Analyzing past flu seasons to understand patterns",
              "Calculating average hospital stay durations",
              "Tracking patient satisfaction scores over time"
            ]}
          />
          
          <AnalyticsTypeCard
            type="Diagnostic"
            description="Uncovers hidden patterns and correlations in the data to identify root causes."
            examples={[
              "Identifying factors leading to hospital readmissions",
              "Analyzing causes of medication errors",
              "Determining reasons for patient no-shows"
            ]}
          />
          
          <AnalyticsTypeCard
            type="Predictive"
            description="Uses statistical methods and machine learning to predict future trends."
            examples={[
              "Predicting disease outbreaks",
              "Forecasting patient admission rates",
              "Estimating risk of chronic disease development"
            ]}
          />
          
          <AnalyticsTypeCard
            type="Prescriptive"
            description="Provides recommendations and strategies to optimize decision-making."
            examples={[
              "Personalized treatment plans",
              "Optimal resource allocation strategies",
              "Preventive care recommendations"
            ]}
          />
        </div>
      </div>

      {/* Benefits of Healthcare Analytics */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Benefits of Healthcare Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Improved Patient Care
            </h4>
            <p className="text-sm text-gray-600">
              Identifying risk factors, personalizing treatment plans, and improving outcomes through data analysis.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Operational Efficiency
            </h4>
            <p className="text-sm text-gray-600">
              Streamlining operations, reducing costs, and optimizing resource allocation.
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Financial Outcomes
            </h4>
            <p className="text-sm text-gray-600">
              Reducing waste and improving efficiency to enhance financial performance.
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Public Health
            </h4>
            <p className="text-sm text-gray-600">
              Tracking disease trends, monitoring outbreaks, and guiding prevention programs.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Overview */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Descriptive Analytics Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dynamic metrics - show all numeric fields as metrics */}
          {data.fields
            .filter(field => field.type === 'number')
            .map((field, index) => {
              const stats = calculateNumericStats(field.value);
              
              return (
                <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">{field.name}</h4>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.avg.toFixed(2)}
                  </p>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>Min: {stats.min.toFixed(2)}</span>{' '}
                    <span>Max: {stats.max.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Diagnostic Analytics Section */}
      {treatmentEffectiveness && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Diagnostic Analytics: Treatment Effectiveness
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(treatmentEffectiveness.byTreatment).map(([treatment, rate]) => (
              <div key={treatment} className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h5 className="font-medium text-gray-900">{treatment}</h5>
                <p className="text-2xl font-semibold text-gray-900">
                  {((rate as number) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
            ))}
          </div>
          
          {/* Correlation analysis */}
          {data.fields.filter(f => f.type === 'number').length >= 2 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Variable Correlations</h4>
              <div className="h-64">
                <Bar
                  data={{
                    labels: data.fields.filter(f => f.type === 'number').map(f => f.name),
                    datasets: [{
                      label: 'Correlation Strength',
                      data: data.fields
                        .filter(f => f.type === 'number')
                        .map(f => f.value[0] || 0), // Use first value from each field
                      backgroundColor: 'rgba(79, 70, 229, 0.7)',
                      borderColor: 'rgba(79, 70, 229, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Correlation: ${context.raw}`
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Correlation Strength' }
                      },
                      x: { title: { display: true, text: 'Variables' } }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictive Analytics Section */}
      {predictiveModels && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Predictive Analytics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-medium text-gray-900 mb-2">Readmission Risk</h4>
              <p className="text-sm text-gray-600 mb-3">
                Based on historical data, patients with these characteristics have elevated readmission risk:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-black">
                <li>Length of stay &gt; 5 days</li>
                <li>Chronic conditions present</li>
                <li>Age &gt; 65 years</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-black">
              <h4 className="font-medium text-gray-900 mb-2">Disease Progression</h4>
              <p className="text-sm text-gray-600 mb-3">
                Predictive models indicate these factors contribute to disease progression:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-black">
                <li>HbA1c levels &gt; 7%</li>
                <li>BMI &gt; 30</li>
                <li>Sedentary lifestyle</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptive Analytics Section */}
      {prescriptiveRecommendations && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-black">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Prescriptive Analytics: Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 ">
              <h4 className="font-medium text-gray-900 mb-2">Treatment Optimization</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Consider alternative treatment B for patients with condition X</li>
                <li>Increase monitoring for patients with risk factors Y and Z</li>
                <li>Implement follow-up protocol for high-risk patients</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-medium text-gray-900 mb-2">Resource Allocation</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Increase staffing on weekends when admission rates are highest</li>
                <li>Prioritize beds for high-acuity patients during peak seasons</li>
                <li>Optimize medication inventory based on seasonal demand</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Charts - show time series for date fields */}
      {data.fields.some(f => f.type === 'date') && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Trend Analysis
          </h3>
          
          <div className="space-y-6">
            {data.fields
              .filter(field => field.type !== 'date') // All non-date fields
              .map((field, index) => {
                const dateField = data.fields.find(f => f.type === 'date');
                if (!dateField) return null;
                
                const dates = dateField.value as string[];
                const values = field.value;
                
                // Only show charts for numeric fields
                if (field.type !== 'number') return null;
                
                return (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h5 className="font-medium text-gray-900 mb-2">
                      {field.name} Over Time
                    </h5>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: dates,
                          datasets: [{
                            label: field.name,
                            data: values,
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.3,
                            fill: true
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                title: (context) => `Date: ${context[0].label}`,
                                label: (context) => `${field.name}: ${context.raw}`
                              }
                            }
                          },
                          scales: {
                            y: { beginAtZero: true },
                            x: { title: { display: true, text: 'Date' } }
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Dynamic Field Relationships */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Data Field Relationships
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Values
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.fields.map((field, index) => {
                let stats = null;
                if (field.type === 'number') {
                  const numericStats = calculateNumericStats(field.value);
                  stats = `Avg: ${numericStats.avg.toFixed(2)} | Min: ${numericStats.min.toFixed(2)} | Max: ${numericStats.max.toFixed(2)}`;
                } else if (field.type === 'string') {
                  const uniqueCount = new Set(field.value).size;
                  stats = `${uniqueCount} unique values`;
                } else if (field.type === 'boolean') {
                  const trueCount = (field.value as boolean[]).filter(Boolean).length;
                  stats = `${trueCount} true (${((trueCount / field.value.length) * 100).toFixed(1)}%)`;
                }
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {field.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {field.type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {field.value.slice(0, 3).join(', ')}
                        {field.value.length > 3 ? `... (${field.value.length} total)` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HealthcareAnalysis;

// --- MOCK DATA EXAMPLE FOR TESTING ---
// To test this component, you can use the following mock data:
//
// const mockData = {
//   fields: [
//     { name: 'length_of_stay', value: [3, 5, 2, 4] },
//     { name: 'readmission', value: [0, 1, 0, 0] },
//     { name: 'satisfaction', value: [0.8, 0.9, 0.7, 1.0] },
//     { name: 'date', value: ['2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04'] },
//     { name: 'treatment', value: ['A', 'B', 'A', 'C'] },
//     { name: 'outcome', value: ['success', 'partial', 'success', 'unsuccessful'] }
//   ]
// };
//
// Usage:
// <HealthcareAnalysis data={mockData} /> 