import React, { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import type { DataField } from '@/types/data';
import type { AnalyzedData } from '@/types/analysis';
import { AnalysisHeader } from '@/components/analysis/AnalysisSection/components/AnalysisHeader';
import { ChartView } from '@/components/visualization';

interface BusinessMetricsProps {
  data: {
    fields: DataField[];
  };
  results: AnalyzedData | null;
}

interface MetricResult {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export function BusinessMetrics({ data, results: _results }: BusinessMetricsProps) {
  // State to hold the input field values (search terms)
  const [searchFields, setSearchFields] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<MetricResult[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Handle user input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFields(event.target.value);
  };

  // Check if business metrics fields exist based on user input
  const checkFieldsAvailability = () => {
    const keywords = searchFields.split(',').map(word => word.trim().toLowerCase());
    
    const availableFields = data.fields.filter(f => 
      keywords.some(keyword => f.name.toLowerCase().includes(keyword))
    );
    
    setIsAvailable(availableFields.length > 0);
    
    if (availableFields.length > 0) {
      setSelectedMetrics(availableFields.map(f => f.name));
      calculateMetrics(availableFields);
    } else {
      setMetrics([]);
    }
  };

  // Calculate business metrics based on available fields
  const calculateMetrics = (fields: DataField[]) => {
    // This is a simplified calculation - in a real app, you would use actual data
    const calculatedMetrics: MetricResult[] = fields.map(field => {
      // Generate random values for demonstration
      const value = Math.floor(Math.random() * 10000);
      const change = Math.floor(Math.random() * 20) - 10; // -10 to +10
      
      return {
        name: field.name,
        value,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });
    
    setMetrics(calculatedMetrics);
  };

  // Get icon based on metric name
  const getMetricIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sales') || lowerName.includes('revenue') || lowerName.includes('profit')) {
      return <DollarSign className="w-5 h-5 text-green-500" />;
    } else if (lowerName.includes('customer') || lowerName.includes('user')) {
      return <Users className="w-5 h-5 text-blue-500" />;
    } else if (lowerName.includes('growth') || lowerName.includes('trend')) {
      return <TrendingUp className="w-5 h-5 text-purple-500" />;
    } else {
      return <Activity className="w-5 h-5 text-indigo-500" />;
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <AnalysisHeader 
        title="Business Metrics Analysis" 
        icon={<BarChart2 className="w-5 h-5 text-indigo-600" />} 
      />
      
      <div className="space-y-4 mt-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchFields}
            onChange={handleInputChange}
            placeholder="Enter fields (e.g., 'revenue, profit, sales')"
            className="flex-1 p-2 border rounded-md"
          />
          <button 
            onClick={checkFieldsAvailability}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
          >
            Analyze Metrics
          </button>
        </div>

        {isAvailable ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Business Metrics Results</h3>
            
            {metrics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ChartView 
                  data={data.fields.filter(f => selectedMetrics.includes(f.name))} 
                  type="bar" 
                  title="Metrics Overview" 
                />
                <ChartView 
                  data={data.fields.filter(f => selectedMetrics.includes(f.name))} 
                  type="line" 
                  title="Metrics Trends" 
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.name)}
                      <h4 className="font-medium">{metric.name}</h4>
                    </div>
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(metric.value)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {metric.trend === 'up' ? 'Increasing' : 
                     metric.trend === 'down' ? 'Decreasing' : 'Stable'} trend
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-red-600">No matching business metrics found. Try different keywords.</p>
            <p className="text-sm text-gray-500 mt-2">
              Available fields: {data.fields.map(f => f.name).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 