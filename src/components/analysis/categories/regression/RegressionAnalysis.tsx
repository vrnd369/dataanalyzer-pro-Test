import { useState } from 'react';
import { DataField } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { performLinearRegression, performPolynomialRegression } from '@/utils/analysis/regression/metrics';
import { 
  calculateAllRegressionMetrics,
  calculateFeatureImportance,
  calculateMulticollinearity,
  calculateRegularizationPath,
  generateResidualPlot,
  generateQQPlot,
  generateLeveragePlot
} from '@/utils/analysis/regression/RegressionMetricsCalculator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import { LineChart, BarChart, ScatterChart } from '@/components/charts';

interface RegressionAnalysisProps {
  fields: DataField[];
}

type RegressionType = 
  | 'linear' 
  | 'multiple_linear' 
  | 'logistic' 
  | 'polynomial'
  | 'ridge' 
  | 'lasso' 
  | 'elastic_net'
  | 'stepwise'
  | 'time_series'
  | 'quantile'
  | 'log_log';

interface RegressionResult {
  results: Array<{
    fieldName: string;
    metrics: {
      r2Score: number;
      rmse: number;
      mae: number;
      adjustedR2: number;
      aic: number;
      bic: number;
      crossValidation: number;
      fStatistic: number;
      pValue: number;
    };
    coefficients: number[];
    predictions: number[];
    residuals: number[];
    actualValues: number[];
    confidenceIntervals: Array<[number, number]>;
    featureImportance?: Array<{ name: string; importance: number }>;
    multicollinearity?: Array<{ name: string; vif: number }>;
    regularizationPath?: Array<{ alpha: number; coefficients: number[] }>;
    diagnostics?: {
      residualPlot: string;
      qqPlot: string;
      leveragePlot: string;
    };
  }>;
}

export function RegressionAnalysis({ fields }: RegressionAnalysisProps) {
  const [selectedModel, setSelectedModel] = useState<RegressionType>('linear');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetField, setTargetField] = useState<string>('');
  const [polynomialDegree, setPolynomialDegree] = useState<number>(2);
  const [regularizationStrength, setRegularizationStrength] = useState<number>(0.1);
  const [crossValidationFolds, setCrossValidationFolds] = useState<number>(5);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [results, setResults] = useState<RegressionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('configuration');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(false);
  const [selectedVisualization, setSelectedVisualization] = useState<string>('metrics');

  // Filter numeric fields and ensure they have values
  const numericFields = fields.filter(f => 
    f.type === 'number' && 
    Array.isArray(f.value) && 
    f.value.length > 0
  );

  // Predefined features we want to analyze
  const defaultFeatures = ['donor_id', 'location', 'income', 'age', 'donation_net'];
  
  // Initialize selected features if empty and defaults exist
  React.useEffect(() => {
    if (selectedFeatures.length === 0 && numericFields.length > 0) {
      const availableFeatures = numericFields
        .filter(f => defaultFeatures.includes(f.name))
        .map(f => f.name);
      setSelectedFeatures(availableFeatures);
    }
  }, [numericFields]);

  const modelTypes: { type: RegressionType; label: string; description: string }[] = [
    { type: 'linear', label: 'Linear', description: 'Simple linear regression for single predictor' },
    { type: 'multiple_linear', label: 'Multiple Linear', description: 'Multiple predictors linear regression' },
    { type: 'logistic', label: 'Logistic', description: 'For binary classification problems' },
    { type: 'polynomial', label: 'Polynomial', description: 'Non-linear relationships with polynomial terms' },
    { type: 'ridge', label: 'Ridge (L2)', description: 'L2 regularization for multicollinearity' },
    { type: 'lasso', label: 'Lasso (L1)', description: 'L1 regularization for feature selection' },
    { type: 'elastic_net', label: 'Elastic Net', description: 'Combined L1 and L2 regularization' },
    { type: 'stepwise', label: 'Stepwise', description: 'Automated feature selection' },
    { type: 'time_series', label: 'Time Series', description: 'For temporal data analysis' },
    { type: 'quantile', label: 'Quantile', description: 'For robust regression' },
    { type: 'log_log', label: 'Log-Log', description: 'For power law relationships' }
  ];

  const handleAnalysis = async () => {
    try {
      setError('');
      
      // Validate input data
      if (!targetField) {
        setError('Please select a target field for the regression analysis');
        return;
      }

      if (selectedFeatures.length === 0) {
        setError('Please select at least one feature for the regression analysis');
        return;
      }

      // Get target field data
      const targetFieldData = numericFields.find(f => f.name === targetField);
      if (!targetFieldData) {
        setError('Selected target field not found in numeric fields');
        return;
      }

      const y = targetFieldData.value as number[];
      if (!Array.isArray(y) || y.length === 0) {
        setError('Target field contains no valid numeric data');
        return;
      }

      // Validate all selected features
      const invalidFeatures = selectedFeatures.filter(featureName => {
        const feature = numericFields.find(f => f.name === featureName);
        return !feature || !Array.isArray(feature.value) || feature.value.length === 0;
      });

      if (invalidFeatures.length > 0) {
        setError(`Invalid or empty data in features: ${invalidFeatures.join(', ')}`);
        return;
      }

      // Perform regression analysis
      const analysisResults = await Promise.all(
        selectedFeatures.map(async (featureName) => {
          const feature = numericFields.find(f => f.name === featureName);
          if (!feature) return null;

          const x = feature.value as number[];
          const featureField: DataField = {
            name: feature.name,
            type: 'number',
            value: x
          };

          let result;
          let predictions: number[] = [];
          let coefficients: number[] = [];

          try {
            switch (selectedModel) {
              case 'linear':
                result = performLinearRegression(featureField);
                predictions = result.predictions || [];
                coefficients = result.coefficients || [];
                break;
              case 'polynomial':
                result = performPolynomialRegression(featureField, polynomialDegree);
                predictions = result.predictions || [];
                coefficients = result.coefficients || [];
                break;
              case 'ridge':
              case 'lasso':
              case 'elastic_net':
                result = performLinearRegression(featureField);
                predictions = result.predictions || [];
                coefficients = result.coefficients || [];
                break;
              default:
                result = performLinearRegression(featureField);
                predictions = result.predictions || [];
                coefficients = result.coefficients || [];
            }

            if (!result || !result.metrics) {
              throw new Error('Invalid regression result structure');
            }

            // Calculate comprehensive metrics
            const metrics = calculateAllRegressionMetrics(
              y,
              predictions,
              coefficients.length,
              x,
              y,
              crossValidationFolds,
              confidenceLevel
            );

            // Calculate advanced metrics if enabled
            let advancedMetrics = {};
            if (showAdvancedMetrics) {
              const featureImportance = calculateFeatureImportance(x, y, coefficients);
              const multicollinearity = calculateMulticollinearity(x);
              const regularizationPath = calculateRegularizationPath(x, y, selectedModel);

              advancedMetrics = {
                featureImportance,
                multicollinearity,
                regularizationPath,
                diagnostics: {
                  residualPlot: generateResidualPlot(y, predictions),
                  qqPlot: generateQQPlot(metrics.residuals),
                  leveragePlot: generateLeveragePlot(x, metrics.residuals)
                }
              };
            }

            return {
              fieldName: feature.name,
              metrics,
              coefficients,
              predictions,
              residuals: metrics.residuals,
              actualValues: y,
              confidenceIntervals: metrics.confidenceIntervals,
              ...advancedMetrics
            };
          } catch (err) {
            console.error(`Error analyzing feature ${featureName}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and check if we have any valid results
      const validResults = analysisResults.filter((result): result is NonNullable<typeof result> => result !== null);
      
      if (validResults.length === 0) {
        setError('No valid regression results could be calculated. Please check your data and try again.');
        return;
      }

      setResults({ results: validResults });
      setError('');
      setActiveTab('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during regression analysis');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
          <TabsTrigger value="diagnostics" disabled={!results}>Diagnostics</TabsTrigger>
          <TabsTrigger value="visualizations" disabled={!results}>Visualizations</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                <div className="space-y-4">
                  <div>
                    <div className="bg-gray-100 p-4 rounded">
                      <Label htmlFor="target-field" className="text-black">Target Field</Label>
                      <Select 
                        value={targetField} 
                        onValueChange={setTargetField}
                      >
                        <SelectTrigger id="target-field" className="text-black bg-gray-200">
                          <SelectValue placeholder="Select target field" className="text-black" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-100">
                          {numericFields.map(field => (
                            <SelectItem 
                              key={field.name} 
                              value={field.name} 
                              className="text-black bg-gray-100 hover:bg-gray-200"
                            >
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-black">
                      {numericFields.map(field => (
                        <div key={field.name} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Checkbox
                            id={field.name}
                            checked={selectedFeatures.includes(field.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFeatures(prev => [...prev, field.name]);
                              } else {
                                setSelectedFeatures(prev => prev.filter(f => f !== field.name));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={field.name}
                            className="cursor-pointer"
                          >
                            {field.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Model Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {modelTypes.map(model => (
                        <div
                          key={model.type}
                          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedModel === model.type
                              ? 'bg-blue-50 border-blue-500'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => setSelectedModel(model.type)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedModel === model.type ? 'bg-blue-500' : 'bg-gray-200'
                            }`} />
                            <span className="text-sm font-medium text-black">{model.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-black">{model.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedModel === 'polynomial' && (
                    <div>
                      <Label>Polynomial Degree</Label>
                      <Slider
                        value={[polynomialDegree]}
                        onValueChange={([value]) => setPolynomialDegree(value)}
                        min={2}
                        max={5}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Current degree: {polynomialDegree}
                      </div>
                    </div>
                  )}

                  {(selectedModel === 'ridge' || selectedModel === 'lasso' || selectedModel === 'elastic_net') && (
                    <div>
                      <Label>Regularization Strength</Label>
                      <Slider
                        value={[regularizationStrength]}
                        onValueChange={([value]) => setRegularizationStrength(value)}
                        min={0.01}
                        max={1}
                        step={0.01}
                        className="mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Current strength: {regularizationStrength.toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Cross-Validation Folds</Label>
                    <Slider
                      value={[crossValidationFolds]}
                      onValueChange={([value]) => setCrossValidationFolds(value)}
                      min={2}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      Current folds: {crossValidationFolds}
                    </div>
                  </div>

                  <div>
                    <Label>Confidence Level</Label>
                    <Slider
                      value={[confidenceLevel]}
                      onValueChange={([value]) => setConfidenceLevel(value)}
                      min={0.8}
                      max={0.99}
                      step={0.01}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      Current level: {(confidenceLevel * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">Analysis Error</p>
                      <p className="text-sm">{error}</p>
                      {error.includes('Invalid data') && (
                        <ul className="mt-2 text-sm list-disc list-inside">
                          <li>Make sure all selected fields contain numeric data</li>
                          <li>Check that there are no empty or invalid values</li>
                          <li>Ensure you have selected both a target and feature fields</li>
                        </ul>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleAnalysis}
                className="mt-6 w-full bg-black text-white"
              >
                Run Analysis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {results && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Checkbox
                    id="advanced-metrics"
                    checked={showAdvancedMetrics}
                    onCheckedChange={(checked) => setShowAdvancedMetrics(checked as boolean)}
                  />
                  <Label htmlFor="advanced-metrics" className="ml-2">
                    Show Advanced Metrics
                  </Label>
                </div>

                {results.results.map((result, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{result.fieldName}</h3>
                    
                    {/* Basic Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">R² Score</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {(result.metrics.r2Score * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">Adjusted R²</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {(result.metrics.adjustedR2 * 100).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">RMSE</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {result.metrics.rmse.toFixed(4)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900">MAE</h4>
                        <p className="text-2xl font-bold text-blue-700">
                          {result.metrics.mae.toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {/* Advanced Metrics */}
                    {showAdvancedMetrics && result.featureImportance && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-3">Feature Importance</h4>
                        <BarChart
                          data={result.featureImportance}
                          xField="name"
                          yField="importance"
                          height={200}
                        />
                      </div>
                    )}

                    {showAdvancedMetrics && result.multicollinearity && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold mb-3">Multicollinearity (VIF)</h4>
                        <BarChart
                          data={result.multicollinearity}
                          xField="name"
                          yField="vif"
                          height={200}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostics">
          {results && (
            <Card>
              <CardContent className="pt-6">
                {results.results.map((result, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{result.fieldName}</h3>
                    
                    {/* Model Diagnostics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900">AIC</h4>
                        <p className="text-2xl font-bold text-gray-700">
                          {result.metrics.aic.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900">BIC</h4>
                        <p className="text-2xl font-bold text-gray-700">
                          {result.metrics.bic.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900">F-Statistic</h4>
                        <p className="text-2xl font-bold text-gray-700">
                          {result.metrics.fStatistic.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg w-full max-w-xs overflow-hidden">
                        <h4 className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">P-Value</h4>
                        <p className="text-2xl font-bold text-gray-700 break-words">
                           {result.metrics.pValue.toExponential(5)}
                        </p>
                      </div>

                    </div>

                    {/* Diagnostic Plots */}
                    {showAdvancedMetrics && result.diagnostics && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div>
                          <h4 className="text-md font-semibold mb-2">Residual Plot</h4>
                          <img src={result.diagnostics.residualPlot} alt="Residual Plot" className="w-full" />
                        </div>
                        <div>
                          <h4 className="text-md font-semibold mb-2">Q-Q Plot</h4>
                          <img src={result.diagnostics.qqPlot} alt="Q-Q Plot" className="w-full" />
                        </div>
                        <div>
                          <h4 className="text-md font-semibold mb-2">Leverage Plot</h4>
                          <img src={result.diagnostics.leveragePlot} alt="Leverage Plot" className="w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualizations">
          {results && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-black">
                  <Select
                    value={selectedVisualization}
                    onValueChange={setSelectedVisualization}
                  >
                    <SelectTrigger className="text-black" >
                      <SelectValue placeholder="Select visualization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metrics" className=" bg-gray-100 text-black">Model Comparison</SelectItem>
                      <SelectItem value="regularization" className=" bg-gray-100 text-black">Regularization Path</SelectItem>
                      <SelectItem value="predictions" className=" bg-gray-100 text-black">Predictions vs Actual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {results.results.map((result, index) => (
                  <div key={index} className="mb-8">
                    <h3 className="text-lg font-semibold text-black mb-4">{result.fieldName}</h3>
                    
                    {selectedVisualization === 'metrics' && (
                      <div className="h-[400px]">
                        <LineChart
                          data={[
                            { name: 'R²', value: result.metrics.r2Score },
                            { name: 'Adjusted R²', value: result.metrics.adjustedR2 },
                            { name: 'RMSE', value: result.metrics.rmse },
                            { name: 'MAE', value: result.metrics.mae }
                          ]}
                          xField="name"
                          yField="value"
                        />
                      </div>
                    )}

                    {selectedVisualization === 'regularization' && result.regularizationPath && (
                      <div className="h-[400px]">
                        <LineChart
                          data={result.regularizationPath.map(path => ({
                            alpha: path.alpha,
                            coefficient: path.coefficients[0]
                          }))}
                          xField="alpha"
                          yField="coefficient"
                        />
                      </div>
                    )}

                    {selectedVisualization === 'predictions' && (
                      <div className="h-[400px]">
                        <ScatterChart
                          data={result.predictions.map((pred, i) => ({
                            actual: result.residuals[i] + pred,
                            predicted: pred
                          }))}
                          xField="actual"
                          yField="predicted"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 