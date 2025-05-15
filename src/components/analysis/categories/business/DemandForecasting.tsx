import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DataField } from '@/types/data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface DemandForecastingProps {
  data: {
    fields: DataField[];
  };
}

// Mock data generator for demonstration
const generateForecastData = (periods: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < periods; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    data.push({
      date: date.toLocaleDateString(),
      actual: Math.round(100 + Math.random() * 50),
      forecast: Math.round(100 + Math.random() * 50 + (i > 5 ? 10 : 0)),
    });
  }
  
  return data;
};

export function DemandForecasting({ data }: DemandForecastingProps) {
  const fieldCount = data.fields.length;
  const [forecastPeriod, setForecastPeriod] = useState<number>(7);
  const [selectedModel, setSelectedModel] = useState<string>('prophet');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forecastData, setForecastData] = useState<any[]>(generateForecastData(7));
  
  const handleGenerateForecast = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setForecastData(generateForecastData(forecastPeriod));
      setIsLoading(false);
    }, 1000);
  };
  
  // Calculate metrics
  const calculateMetrics = () => {
    if (forecastData.length < 2) return null;
    
    const mae = forecastData.reduce((sum, point) => {
      return sum + Math.abs(point.actual - point.forecast);
    }, 0) / forecastData.length;
    
    const mape = forecastData.reduce((sum, point) => {
      return sum + (Math.abs(point.actual - point.forecast) / point.actual);
    }, 0) / forecastData.length * 100;
    
    return {
      mae: mae.toFixed(2),
      mape: mape.toFixed(2),
      accuracy: (100 - mape).toFixed(2),
    };
  };
  
  const metrics = calculateMetrics();
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6 text-black">
        <h3 className="text-lg font-semibold text-black">Demand Forecasting</h3>
        <div className="flex items-center space-x-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prophet" className="text-black">Prophet</SelectItem>
              <SelectItem value="arima" className="text-black">ARIMA</SelectItem>
              <SelectItem value="lstm" className="text-black">LSTM</SelectItem>
              <SelectItem value="ensemble" className="text-black">Ensemble</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="period" className="whitespace-nowrap">Forecast Period:</Label>
            <Input
              id="period"
              type="number"
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(Number(e.target.value))}
              className="w-20"
              min="1"
              max="365"
            />
          </div>
          
          <Button onClick={handleGenerateForecast} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </div>
      </div>
      
      {fieldCount > 0 ? (
        <div className="space-y-6">
          {/* Main Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Actual Demand"
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#82ca9d" 
                  name="Forecasted Demand"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500">Mean Absolute Error</h4>
                <p className="text-1xl font-bold text-black mt-2">{metrics.mae}</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500">Mean Absolute % Error</h4>
                <p className="text-1xl font-bold text-black mt-2">{metrics.mape}%</p>
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-medium text-gray-500">Forecast Accuracy</h4>
                <p className="text-1xl font-bold text-black mt-2">{metrics.accuracy}%</p>
              </Card>
            </div>
          )}
          
          {/* Data Table */}
          <div>
            <h4 className="text-md font-medium text-black mb-2">Forecast Details</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Forecast</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecastData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{row.actual}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{row.forecast}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`${row.forecast >= row.actual ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.round(((row.forecast - row.actual) / row.actual * 100))}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No data fields available for demand forecasting.</p>
      )}
      
      <p className="text-sm text-gray-500 mt-4">Analyzing {fieldCount} data fields.</p>
    </Card>
  );
} 