import { useState, useEffect } from 'react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ARIMA } from './ARIMA';
import { ExponentialSmoothing } from './ExponentialSmoothing';
import { SeasonalDecomposition } from './SeasonalDecomposition';
import { TimeSeriesResult } from '@/utils/analysis/timeSeries/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface TimeSeriesAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function TimeSeriesAnalysisContainer({ data }: TimeSeriesAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('arima');
  const [results, setResults] = useState<TimeSeriesResult[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [forecastPeriods, setForecastPeriods] = useState(5);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Get all numeric fields
  const numericFields = data.fields.filter(field => field.type === 'number');

  // Set default selected field
  useEffect(() => {
    if (numericFields.length > 0 && !selectedField) {
      setSelectedField(numericFields[0].name);
    }
  }, [numericFields, selectedField]);

  // Convert selected field data to time series format
  const getTimeSeriesData = () => {
    const field = data.fields.find(f => f.name === selectedField);
    if (!field || field.type !== 'number') return [];

    return (field.value as number[]).map((value, index) => ({
      timestamp: index,
      value,
      field: field.name
    }));
  };

  // Simulate analysis progress
  const simulateProgress = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  };

  // Common handler for all analysis methods
  const handleAnalyze = (method: string, params: any, results: TimeSeriesResult[]) => {
    simulateProgress();
    
    // Add metadata about the analysis method
    const enhancedResults = results.map(result => ({
      ...result,
      analysisMethod: method,
      analysisParams: params,
      timestamp: new Date().toISOString()
    }));
    
    setResults(prev => [...prev, ...enhancedResults]);
  };

  // Handler for ARIMA
  const handleArimaAnalyze = (results: TimeSeriesResult[]) => {
    handleAnalyze('ARIMA', {}, results);
  };

  // Handler for Exponential Smoothing
  const handleExponentialSmoothingAnalyze = (params: any) => {
    const results: TimeSeriesResult[] = [{
      field: selectedField,
      trend: 'stable',
      confidence: confidenceLevel / 100,
      seasonality: null,
      forecast: [],
      components: {
        trend: [],
        seasonal: [],
        residual: []
      }
    }];
    handleAnalyze('Exponential Smoothing', params, results);
  };

  // Handler for Seasonal Decomposition
  const handleSeasonalDecompositionAnalyze = (params: any) => {
    const results: TimeSeriesResult[] = [{
      field: selectedField,
      trend: 'stable',
      confidence: confidenceLevel / 100,
      seasonality: null,
      forecast: [],
      components: {
        trend: [],
        seasonal: [],
        residual: []
      }
    }];
    handleAnalyze('Seasonal Decomposition', params, results);
  };

  return (
    <div className="space-y-6">
      {/* Time Series Analysis Header */}
      <div className="bg-blue-900 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        <i className="fas fa-chart-line mr-2"></i>
        Time Series Analysis
      </div>
      
      {/* Configuration Panel */}
      <Card className="p-4">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
            <div>
              <Label htmlFor="field-select">Select Field</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger id="field-select">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {numericFields.map(field => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="forecast-periods">Forecast Periods</Label>
              <Input 
                id="forecast-periods" 
                type="number" 
                min="1" 
                max="20" 
                value={forecastPeriods}
                onChange={(e) => setForecastPeriods(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="confidence-level">Confidence Level (%)</Label>
              <Input 
                id="confidence-level" 
                type="number" 
                min="80" 
                max="99" 
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              />
            </div>
          </div>
          
          {isLoading && (
            <div className="space-y-2">
              <Label>Analysis Progress</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500">
                Analyzing time series data... {progress}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Methods */}
      <Card className="p-4">
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="arima" className="text-black">
                <i className="fas fa-chart-bar mr-2"></i>ARIMA
              </TabsTrigger>
              <TabsTrigger value="exponential" className="text-black">
                <i className="fas fa-chart-line mr-2"></i>Exponential Smoothing
              </TabsTrigger>
              <TabsTrigger value="seasonal" className="text-black">
                <i className="fas fa-calendar-alt mr-2"></i>Seasonal Decomposition
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="arima" className="mt-4">
              <ARIMA 
                data={getTimeSeriesData()} 
                forecastPeriods={forecastPeriods}
                confidenceLevel={confidenceLevel / 100}
                onAnalyze={handleArimaAnalyze} 
              />
            </TabsContent>
            
            <TabsContent value="exponential" className="mt-4">
              <ExponentialSmoothing 
                data={getTimeSeriesData()}
                forecastPeriods={forecastPeriods}
                confidenceLevel={confidenceLevel / 100}
                onAnalyze={handleExponentialSmoothingAnalyze} 
              />
            </TabsContent>
            
            <TabsContent value="seasonal" className="mt-4">
              <SeasonalDecomposition 
                data={getTimeSeriesData()}
                forecastPeriods={forecastPeriods}
                onAnalyze={handleSeasonalDecompositionAnalyze} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card className="p-4">
          <CardContent>
            <div className="flex justify-between items-center mb-4 text-black">
              <h3 className="text-lg font-semibold text-black">Analysis Results</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setResults([])}
              >
                Clear Results
              </Button>
            </div>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-black">{result.field}</h4>
                      <p className="text-sm text-gray-500">
                        Method: {result.analysisMethod || 'N/A'} • {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                      result.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {result.trend}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-black">Confidence</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">{(result.confidence * 100).toFixed(1)}% confidence</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-black">Seasonality</p>
                        <p className="text-sm text-gray-600">
                          {result.seasonality ? (
                            <span className="text-green-600">Present ({result.seasonality})</span>
                          ) : (
                            <span className="text-gray-600">Not detected</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-black">Forecast (next {forecastPeriods} periods)</p>
                      <div className="flex flex-wrap gap-2">
                        {result.forecast.slice(0, forecastPeriods).map((value, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-sm">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-black">Components</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-purple-50 text-purple-800 rounded text-sm">
                          Trend: {result.components.trend.length} points
                        </span>
                        {result.seasonality && (
                          <span className="px-2 py-1 bg-teal-50 text-teal-800 rounded text-sm">
                            Seasonal: {result.components.seasonal.length} points
                          </span>
                        )}
                        <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded text-sm">
                          Residual: {result.components.residual.length} points
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-black">Analysis Parameters</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto text-black">
                      {JSON.stringify(result.analysisParams, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 