import { DollarSign, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RatioAnalysis } from './RatioAnalysis';
import { BreakEven } from './BreakEven';
import { Attribution } from './Attribution';
import { CustomerSegmentation } from './CustomerSegmentation';
import { DemandForecasting } from './DemandForecasting';
import { ROIAnalysis } from './ROIAnalysis';
import { RouteOptimization } from './RouteOptimization';
import { InventoryOptimization } from './InventoryOptimization';
import { FinancialModeling } from './FinancialModeling';
import type { DataField } from '@/types/data';
import { useState, useEffect } from 'react';

interface BusinessMetricsProps {
  data: {
    fields: DataField[];
  };
}

interface AnalysisResult {
  category: string;
  metrics: {
    name: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  insights: string[];
}

export function BusinessMetrics({ data }: BusinessMetricsProps) {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Simulate file analysis
    const analyzeData = async () => {
      setIsAnalyzing(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock analysis results based on available data
      const results: AnalysisResult[] = [];
      
      // Financial Analysis
      const financialFields = data.fields.filter(f => 
        f.name.toLowerCase().includes('revenue') || 
        f.name.toLowerCase().includes('profit') || 
        f.name.toLowerCase().includes('cost') ||
        f.name.toLowerCase().includes('sales')
      );
      
      if (financialFields.length > 0) {
        results.push({
          category: 'Financial',
          metrics: [
            { name: 'Revenue Growth', value: '12.5%', change: 2.3, trend: 'up' },
            { name: 'Profit Margin', value: '18.2%', change: -0.5, trend: 'down' },
            { name: 'Operating Efficiency', value: '76%', change: 3.2, trend: 'up' }
          ],
          insights: [
            'Revenue has shown consistent growth over the last 3 quarters',
            'Profit margins are slightly declining, suggesting increased costs',
            'Operating efficiency improvements indicate better resource utilization'
          ]
        });
      }
      
      // Customer Analysis
      const customerFields = data.fields.filter(f => 
        f.name.toLowerCase().includes('customer') || 
        f.name.toLowerCase().includes('client') || 
        f.name.toLowerCase().includes('user')
      );
      
      if (customerFields.length > 0) {
        results.push({
          category: 'Customer',
          metrics: [
            { name: 'Customer Satisfaction', value: '4.2/5', change: 0.3, trend: 'up' },
            { name: 'Customer Retention', value: '87%', change: 1.5, trend: 'up' },
            { name: 'Acquisition Cost', value: '$45', change: -5, trend: 'down' }
          ],
          insights: [
            'Customer satisfaction scores have improved significantly',
            'Retention rates are above industry average',
            'Customer acquisition costs are decreasing, indicating more efficient marketing'
          ]
        });
      }
      
      // Operations Analysis
      const operationsFields = data.fields.filter(f => 
        f.name.toLowerCase().includes('inventory') || 
        f.name.toLowerCase().includes('supply') || 
        f.name.toLowerCase().includes('logistics')
      );
      
      if (operationsFields.length > 0) {
        results.push({
          category: 'Operations',
          metrics: [
            { name: 'Inventory Turnover', value: '4.8x', change: 0.5, trend: 'up' },
            { name: 'Supply Chain Efficiency', value: '92%', change: 2.1, trend: 'up' },
            { name: 'Delivery Time', value: '2.3 days', change: -0.4, trend: 'down' }
          ],
          insights: [
            'Inventory turnover has improved, reducing holding costs',
            'Supply chain efficiency is at an all-time high',
            'Delivery times have decreased, improving customer satisfaction'
          ]
        });
      }
      
      setAnalysisResults(results);
      setIsAnalyzing(false);
    };
    
    analyzeData();
  }, [data]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-teal-500" />
        <h3 className="text-lg font-semibold text-black">Business Metrics Analysis</h3>
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Analyzing business data...</p>
        </div>
      ) : (
        <>
          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
              <TabsTrigger value="financial" className="text-black">Financial</TabsTrigger>
              <TabsTrigger value="operations" className="text-black">Operations</TabsTrigger>
              <TabsTrigger value="customer" className="text-black">Customer</TabsTrigger>
              <TabsTrigger value="inventory" className="text-black">Inventory</TabsTrigger>
              <TabsTrigger value="optimization" className="text-black">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-4">
              {analysisResults.find(r => r.category === 'Financial') ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResults.find(r => r.category === 'Financial')?.metrics.map((metric, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-700">{metric.name}</h4>
                          {metric.trend && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                              metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} 
                              {metric.change && Math.abs(metric.change)}%
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-teal-600 mt-2">{metric.value}</p>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-teal-500" />
                    <h4 className="font-medium text-black">Key Insights</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysisResults.find(r => r.category === 'Financial')?.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-teal-500 mt-1">•</span>
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <RatioAnalysis data={data} />
              <BreakEven data={data} />
              <ROIAnalysis data={data} />
              <FinancialModeling data={data} />
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              {analysisResults.find(r => r.category === 'Operations') ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResults.find(r => r.category === 'Operations')?.metrics.map((metric, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-700">{metric.name}</h4>
                          {metric.trend && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                              metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} 
                              {metric.change && Math.abs(metric.change)}%
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-teal-600 mt-2">{metric.value}</p>
                      </Card>
                    ))}
                  </div>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-teal-500" />
                      <h4 className="font-medium text-black">Key Insights</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysisResults.find(r => r.category === 'Operations')?.insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-teal-500 mt-1">•</span>
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ) : (
                <RouteOptimization data={data} />
              )}
              <Attribution data={data} />
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              {analysisResults.find(r => r.category === 'Customer') ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResults.find(r => r.category === 'Customer')?.metrics.map((metric, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-700">{metric.name}</h4>
                          {metric.trend && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              metric.trend === 'up' ? 'bg-green-100 text-green-800' : 
                              metric.trend === 'down' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} 
                              {metric.change && Math.abs(metric.change)}%
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-teal-600 mt-2">{metric.value}</p>
                      </Card>
                    ))}
                  </div>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-teal-500" />
                      <h4 className="font-medium text-black">Key Insights</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysisResults.find(r => r.category === 'Customer')?.insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-teal-500 mt-1">•</span>
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ) : null}
              <CustomerSegmentation data={data} />
              <DemandForecasting data={data} />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <InventoryOptimization data={data} />
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <RouteOptimization data={data} />
              <InventoryOptimization data={data} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 