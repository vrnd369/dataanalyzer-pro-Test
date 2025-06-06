import React from 'react';
import { Brain, TrendingUp, AlertCircle, Activity, Settings, BarChart2, Info, HelpCircle } from 'lucide-react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  ScatterController,
  LineController
} from 'chart.js';
import type { DataField } from '@/types/data';
import { UniversalMLService, MLAlgorithm } from '@/utils/analysis/ml/UniversalMLService';
import { formatNumber } from '@/utils/analysis/formatting';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  ScatterController,
  LineController
);

// Define chart view types
type TrainingChartView = 'loss' | 'metrics' | 'lr';
type PredictionsChartView = 'line' | 'scatter' | 'residuals';

interface MLResults {
  predictions: number[];
  actuals?: number[];
  evaluation: {
    accuracy: number;
    loss: number;
    mae?: number;
    r2?: number;
    precision?: number;
    recall?: number;
    f1?: number;
  };
  training: {
    duration: number;
    training_time?: number;
    history: {
      loss: number[];
      val_loss?: number[];
      accuracy?: number[];
      val_accuracy?: number[];
      lr?: number[];
    };
  };
  featureImportance?: {name: string, importance: number}[];
}

// Helper functions for metrics calculations
const calculateMAE = (predictions: number[], actuals: number[]): number => {
  if (!predictions || !actuals || predictions.length !== actuals.length) return 0;
  return predictions.reduce((sum, pred, i) => sum + Math.abs(pred - actuals[i]), 0) / predictions.length;
};

const calculateRSquared = (predictions: number[], actuals: number[]): number => {
  if (!predictions || !actuals || predictions.length !== actuals.length) return 0;
  const mean = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  const ssTotal = actuals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const ssResidual = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actuals[i], 2), 0);
  return ssTotal === 0 ? 1 : 1 - (ssResidual / ssTotal);
};

interface UniversalMLAnalysisViewProps {
  data: {
    fields: DataField[];
  };
  onAnalysisComplete?: (results: MLResults) => void;
}

export function UniversalMLAnalysisView({ data, onAnalysisComplete }: UniversalMLAnalysisViewProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = React.useState<MLAlgorithm>('neural');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<MLResults | null>(null);
  const [trainingChartView, setTrainingChartView] = React.useState<TrainingChartView>('loss');
  const [predictionsChartView, setPredictionsChartView] = React.useState<PredictionsChartView>('line');
  const [advancedSettings, setAdvancedSettings] = React.useState({
    trainTestSplit: 0.8,
    epochs: 50,
    learningRate: 0.001,
    normalizeData: true,
    featureSelection: true,
    showAdvanced: false
  });
  const [targetFieldIndex, setTargetFieldIndex] = React.useState<number>(-1);
  const [featureFieldIndices, setFeatureFieldIndices] = React.useState<number[]>([]);
  const [dataWarnings, setDataWarnings] = React.useState<string[]>([]);
  const [showToast, setShowToast] = React.useState(false);
  const [predictionProgress, setPredictionProgress] = React.useState(0);

  // Get singleton instance
  const mlService = React.useMemo(() => UniversalMLService.getInstance(), []);

  // Data quality check function
  const checkDataQuality = React.useCallback(() => {
    const warnings: string[] = [];
    const numericFields = data.fields.filter(f => f.type === 'number');
    // Only check selected fields
    const selectedFields = [
      ...(targetFieldIndex !== -1 ? [numericFields[targetFieldIndex]] : []),
      ...featureFieldIndices.map(idx => numericFields[idx])
    ];
    // Check for missing values
    selectedFields.forEach(field => {
      if (!field || !Array.isArray(field.value)) return;
      if (field.value.some(v => v === null || v === undefined || Number.isNaN(v))) {
        warnings.push(`Missing values detected in column: ${field.name || 'Unnamed'}`);
      }
    });
    // Check for small dataset
    if (selectedFields.length > 0 && selectedFields[0].value && selectedFields[0].value.length < 30) {
      warnings.push('Very small dataset (less than 30 samples). Results may not be reliable.');
    }
    // Check for outliers using IQR
    selectedFields.forEach(field => {
      if (!field || !Array.isArray(field.value)) return;
      const values = (field.value as number[]).filter(v => typeof v === 'number' && !Number.isNaN(v));
      if (values.length < 5) return; // Not enough data for outlier detection
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      const outliers = values.filter(v => v < lower || v > upper);
      if (outliers.length > 0) {
        warnings.push(`Outliers detected in column: ${field.name || 'Unnamed'} (${outliers.length} outlier${outliers.length > 1 ? 's' : ''})`);
      }
    });
    setDataWarnings(warnings);
  }, [data.fields, targetFieldIndex, featureFieldIndices]);

  // Run data quality check when selection changes
  React.useEffect(() => {
    checkDataQuality();
  }, [checkDataQuality]);

  // Helper for chunked prediction
  async function chunkedPredict(predictFn: (features: number[][]) => Promise<number[]>, features: number[][], chunkSize = 500, onProgress?: (progress: number) => void) {
    const total = features.length;
    let results: number[] = [];
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = features.slice(i, i + chunkSize);
      // eslint-disable-next-line no-await-in-loop
      const preds = await predictFn(chunk);
      results = results.concat(preds);
      if (onProgress) onProgress(Math.min(1, (i + chunk.length) / total));
      // Small delay to keep UI responsive
      await new Promise(res => setTimeout(res, 10));
    }
    return results;
  }

  const handleAnalyze = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setResults(null);
      setShowToast(false);
      setPredictionProgress(0);

      const numericFields = data.fields.filter(f => f.type === 'number');
      if (numericFields.length < 2) {
        throw new Error('ML analysis requires at least 2 numeric fields');
      }

      // Dynamic selection validation
      if (targetFieldIndex === -1 || featureFieldIndices.length === 0) {
        throw new Error('Please select a target and at least one feature column.');
      }

      // Validate fields have values
      if (numericFields.some(f => !f.value || !Array.isArray(f.value))) {
        throw new Error('Numeric fields must have array values');
      }

      // Prepare features and labels based on user selection
      const targetField = numericFields[targetFieldIndex];
      const featureFields = featureFieldIndices.map(idx => numericFields[idx]);
      const numSamples = targetField.value.length;

      // Transpose features to match target length
      const transposeFeatures = (fields: DataField[]) => {
        const features: number[][] = [];
        for (let i = 0; i < numSamples; i++) {
          features.push(fields.map(f => (f.value as number[])[i]));
        }
        return features;
      };

      // Configure service with advanced settings
      mlService.configure({
        trainTestSplit: advancedSettings.trainTestSplit,
        epochs: advancedSettings.epochs,
        learningRate: advancedSettings.learningRate,
        normalizeData: advancedSettings.normalizeData,
        featureSelection: advancedSettings.featureSelection,
      });

      // Try all algorithms and find the best one
      const algorithms: MLAlgorithm[] = ['neural', 'decisionTree', 'regression'];
      let bestResults: MLResults | null = null;
      let bestR2 = -Infinity;
      let bestAlgorithm: MLAlgorithm = 'neural';

      for (const algorithm of algorithms) {
        try {
          const trainingResult = await mlService.trainModel(
            algorithm,
            {
              train: {
                features: transposeFeatures(featureFields),
                labels: targetField.value as number[]
              },
              validation: {
                features: transposeFeatures(featureFields),
                labels: targetField.value as number[]
              },
              test: {
                features: transposeFeatures(featureFields),
                labels: targetField.value as number[]
              }
            },
            {
              hyperparameters: {
                epochs: advancedSettings.epochs,
                batchSize: 32,
                learningRate: advancedSettings.learningRate,
                optimizer: 'adam',
                loss: 'meanSquaredError',
                activations: ['relu', 'relu'],
                layers: [64, 32],
                dropout: 0.2,
                l1Regularization: 0.01,
                l2Regularization: 0.01,
                patience: 10,
                minDelta: 0.001
              },
              dataConfig: {
                trainTestSplit: advancedSettings.trainTestSplit,
                validationSplit: 0.2,
                scalingMethod: 'standard',
                handleMissing: 'mean',
                outlierDetection: 'iqr',
                featureEngineering: {
                  polynomialFeatures: false,
                  interactions: false
                }
              }
            }
          );

          const features = transposeFeatures(featureFields);
          const predictions = await chunkedPredict(
            (f) => mlService.predict(trainingResult, f),
            features,
            500,
            (progress) => setPredictionProgress(progress)
          );
          const evaluation = await mlService.evaluate(algorithm, numericFields);
          const actuals = numericFields[numericFields.length - 1].value as number[];
          
          const r2 = calculateRSquared(predictions, actuals);
          
          if (r2 > bestR2) {
            bestR2 = r2;
            bestAlgorithm = algorithm;
            
            let featureImportance;
            if (algorithm === 'decisionTree' || algorithm === 'regression') {
              const importances = mlService.getRegressionFeatureImportance(trainingResult);
              featureImportance = featureFields.map((field, idx) => ({
                name: field.name || `Feature ${idx + 1}`,
                importance: importances[idx] || 0
              })).sort((a, b) => b.importance - a.importance);
            }

            bestResults = {
              predictions,
              actuals,
              evaluation: {
                ...evaluation,
                mae: calculateMAE(predictions, actuals),
                r2: r2,
              },
              training: trainingResult,
              featureImportance
            };
          }
        } catch (err) {
          console.warn(`Algorithm ${algorithm} failed:`, err);
          continue;
        }
      }

      if (!bestResults) {
        throw new Error('All algorithms failed to produce valid results');
      }

      // Update the selected algorithm to the best one
      setSelectedAlgorithm(bestAlgorithm);

      // Log detailed accuracy metrics
      console.log('=== Detailed Accuracy Metrics ===');
      console.log('Best Algorithm:', bestAlgorithm);
      console.log('Overall Model Accuracy:', (bestResults.evaluation.accuracy * 100).toFixed(2) + '%');
      console.log('R² Score:', ((bestResults.evaluation.r2 || 0) * 100).toFixed(2) + '%');
      console.log('MAE:', (bestResults.evaluation.mae || 0).toFixed(4));
      
      // Calculate per-file accuracy
      const fileAccuracies = featureFields.map((field, index) => {
        const fieldPredictions = bestResults.predictions.map(p => p);
        const fieldActuals = field.value as number[];
        const fieldAccuracy = 1 - calculateMAE(fieldPredictions, fieldActuals);
        return {
          fileName: field.name || `File ${index + 1}`,
          accuracy: fieldAccuracy * 100
        };
      });

      console.log('\nPer-File Accuracy:');
      fileAccuracies.forEach(file => {
        console.log(`${file.fileName}: ${file.accuracy.toFixed(2)}%`);
      });

      setResults(bestResults);
      onAnalysisComplete?.(bestResults);
      setShowToast(true);
    } catch (err) {
      console.error('ML Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsProcessing(false);
      setPredictionProgress(0);
    }
  };

  // Enhanced chart options with better readability
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#000000',
          font: {
            weight: 'normal' as const,
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatNumber(context.parsed.y);
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        color: '#000000',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#000000',
          font: {
            weight: 'normal' as const,
            size: 12
          },
          callback: (value: number | string) => formatNumber(Number(value))
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#000000',
          font: {
            weight: 'normal' as const,
            size: 12
          }
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6
      },
      line: {
        borderWidth: 2
      }
    }
  } as const;

  const toggleAdvancedSettings = () => {
    setAdvancedSettings(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  // Tooltip helper
  const Tooltip = ({ text }: { text: string }) => (
    <span className="relative group cursor-pointer">
      <HelpCircle className="w-4 h-4 text-gray-400 ml-1 inline" />
      <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 z-50 pointer-events-none whitespace-pre-line">
        {text}
      </span>
    </span>
  );

  return (
    <div className="space-y-8 p-4 bg-gray-50 rounded-lg">
      {/* Algorithm Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-black">Universal ML Analysis</h3>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-teal-500 h-2 rounded-full animate-pulse"
              style={{ width: `${Math.round((predictionProgress || 0) * 100)}%` }}
            />
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
            <BarChart2 className="w-5 h-5" />
            Analysis complete!
            <button onClick={() => setShowToast(false)} className="ml-2 text-white hover:text-gray-200">×</button>
          </div>
        )}

        {/* Data Quality Warnings */}
        {dataWarnings.length > 0 && (
          <div className="mb-4">
            {dataWarnings.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded mb-1 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Target and Feature Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Target Column</label>
          <select
            value={targetFieldIndex}
            onChange={e => setTargetFieldIndex(Number(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value={-1}>-- Select Target --</option>
            {data.fields.filter(f => f.type === 'number').map((field, idx) => (
              <option key={idx} value={idx}>{field.name || `Column ${idx + 1}`}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Feature Columns</label>
          <select
            multiple
            value={featureFieldIndices.map(String)}
            onChange={e => setFeatureFieldIndices(Array.from(e.target.selectedOptions, o => Number(o.value)))}
            className="w-full p-2 border rounded"
          >
            {data.fields.filter(f => f.type === 'number').map((field, idx) => (
              <option key={idx} value={idx}>{field.name || `Column ${idx + 1}`}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple features.</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { id: 'neural', name: 'Neural Network', icon: Brain, description: 'Powerful for complex patterns' },
            { id: 'decisionTree', name: 'Decision Tree', icon: Activity, description: 'Interpretable with feature importance' },
            { id: 'regression', name: 'Regression', icon: TrendingUp, description: 'Fast and simple linear relationships' }
          ].map(algorithm => (
            <button
              key={algorithm.id}
              onClick={() => setSelectedAlgorithm(algorithm.id as MLAlgorithm)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedAlgorithm === algorithm.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <algorithm.icon className={`w-5 h-5 ${
                  selectedAlgorithm === algorithm.id ? 'text-teal-600' : 'text-gray-600'
                }`} />
                <span className="font-medium text-black">{algorithm.name}</span>
              </div>
              <p className="text-xs text-gray-600">{algorithm.description}</p>
            </button>
          ))}
        </div>

        {/* Advanced Settings Collapsible */}
        <div className="mb-6">
          <button
            onClick={toggleAdvancedSettings}
            className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium mb-2"
          >
            <Settings className="w-4 h-4" />
            {advancedSettings.showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
          
          {advancedSettings.showAdvanced && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Train/Test Split: {Math.round(advancedSettings.trainTestSplit * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={advancedSettings.trainTestSplit}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, trainTestSplit: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Epochs: {advancedSettings.epochs}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="10"
                    value={advancedSettings.epochs}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, epochs: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Learning Rate: {advancedSettings.learningRate}
                  </label>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    value={advancedSettings.learningRate}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, learningRate: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettings.normalizeData}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, normalizeData: e.target.checked})}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Normalize Data</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedSettings.featureSelection}
                    onChange={(e) => setAdvancedSettings({...advancedSettings, featureSelection: e.target.checked})}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Feature Selection</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isProcessing || data.fields.length === 0}
          className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium shadow-md flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <BarChart2 className="w-5 h-5" />
              Run Analysis
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Model Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-medium text-black mb-4">Model Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title={<span>Accuracy<Tooltip text="Classification accuracy: Percentage of correct predictions." /></span>}
                value={formatNumber(results.evaluation.accuracy * 100)}
                suffix="%"
                description="Classification accuracy"
                icon={<Brain className="w-4 h-4 text-teal-600" />}
              />
              <MetricCard
                title={<span>R² Score<Tooltip text="R² (coefficient of determination): How well predictions match actual values. 1 = perfect, 0 = mean predictor, < 0 = worse than mean." /></span>}
                value={formatNumber(results.evaluation.r2 || 0)}
                description="Variance explained"
                icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
              />
              <MetricCard
                title={<span>MAE<Tooltip text="Mean Absolute Error: Average absolute difference between predictions and actual values. Lower is better." /></span>}
                value={formatNumber(results.evaluation.mae || 0)}
                description="Mean Absolute Error"
                icon={<Activity className="w-4 h-4 text-purple-600" />}
              />
              <MetricCard
                title={<span>Loss<Tooltip text="Training loss: How well the model fits the data during training. Lower is better." /></span>}
                value={formatNumber(results.evaluation.loss)}
                description="Training loss value"
                icon={<AlertCircle className="w-4 h-4 text-amber-600" />}
              />
            </div>
            {/* Model Suggestions */}
            {((results.evaluation.r2 !== undefined && results.evaluation.r2 < 0.5) || results.evaluation.loss > 1 || results.evaluation.accuracy < 0.7) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-start gap-2 text-sm">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Suggestions to improve your model:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {results.evaluation.r2 !== undefined && results.evaluation.r2 < 0.5 && <li>Try increasing the number of epochs or using a more complex model.</li>}
                    {results.evaluation.loss > 1 && <li>Check your data for outliers or normalization issues.</li>}
                    {results.evaluation.accuracy < 0.7 && <li>Try adding more data or features, or tuning hyperparameters.</li>}
                    <li>Consider removing outliers or filling missing values if warnings are shown above.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Feature Importance */}
          {results.featureImportance && results.featureImportance.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-lg font-medium text-black mb-4">Feature Importance</h4>
              <div className="space-y-3">
                {results.featureImportance.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700 truncate" title={feature.name}>
                      {feature.name}
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-teal-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, feature.importance * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-2 text-sm font-medium text-gray-900 w-16 text-right">
                      {formatNumber(feature.importance * 100)}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Higher values indicate more important features for the model's predictions
              </div>
            </div>
          )}

          {/* Training History Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-gray-900 flex items-center">Training History<Tooltip text="Shows how loss and accuracy change during training. Look for decreasing loss and increasing accuracy." /></h4>
              <div className="flex gap-2">
                {['loss', 'metrics', 'lr'].map(view => (
                  <button
                    key={view}
                    onClick={() => setTrainingChartView(view as 'loss' | 'metrics' | 'lr')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      trainingChartView === view
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-96">
              {trainingChartView === 'loss' && (
                <Line
                  data={{
                    labels: Array.from({ length: results.training.history.loss.length }, (_, i) => i + 1),
                    datasets: [{
                      label: 'Training Loss',
                      data: results.training.history.loss,
                      borderColor: 'rgb(13, 148, 136)',
                      backgroundColor: 'rgba(13, 148, 136, 0.1)',
                      tension: 0.1,
                      fill: true
                    },
                    ...(results.training.history.val_loss ? [{
                      label: 'Validation Loss',
                      data: results.training.history.val_loss,
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderDash: [5, 5],
                      tension: 0.1,
                      fill: true
                    }] : [])]
                  }}
                  options={chartOptions}
                />
              )}
              {trainingChartView === 'metrics' && results.training.history.accuracy && (
                <Line
                  data={{
                    labels: Array.from({ length: results.training.history.accuracy.length }, (_, i) => i + 1),
                    datasets: [{
                      label: 'Training Accuracy',
                      data: results.training.history.accuracy,
                      borderColor: 'rgb(13, 148, 136)',
                      backgroundColor: 'rgba(13, 148, 136, 0.1)',
                      tension: 0.1,
                      fill: true
                    },
                    ...(results.training.history.val_accuracy ? [{
                      label: 'Validation Accuracy',
                      data: results.training.history.val_accuracy,
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderDash: [5, 5],
                      tension: 0.1,
                      fill: true
                    }] : [])]
                  }}
                  options={chartOptions}
                />
              )}
              {trainingChartView === 'lr' && results.training.history.lr && (
                <Line
                  data={{
                    labels: Array.from({ length: results.training.history.lr.length }, (_, i) => i + 1),
                    datasets: [{
                      label: 'Learning Rate',
                      data: results.training.history.lr,
                      borderColor: 'rgb(245, 158, 11)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      tension: 0.1,
                      fill: true
                    }]
                  }}
                  options={chartOptions}
                />
              )}
            </div>
          </div>

          {/* Predictions Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-gray-900 flex items-center">Predictions vs Actuals<Tooltip text="Compares model predictions to actual values. Closer lines or points mean better predictions." /></h4>
              <div className="flex gap-2">
                {['line', 'scatter', 'residuals'].map(view => (
                  <button
                    key={view}
                    onClick={() => setPredictionsChartView(view as 'line' | 'scatter' | 'residuals')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      predictionsChartView === view
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-96">
              {predictionsChartView === 'line' && (
                <Line
                  data={{
                    labels: Array.from({ length: results.predictions.length }, (_, i) => i + 1),
                    datasets: [
                      {
                        label: 'Predictions',
                        data: results.predictions,
                        borderColor: 'rgb(13, 148, 136)',
                        backgroundColor: 'rgba(13, 148, 136, 0.05)',
                        tension: 0.1,
                        fill: true
                      },
                      {
                        label: 'Actual Values',
                        data: results.actuals,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        borderDash: [5, 5],
                        tension: 0.1,
                        fill: true
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              )}
              {predictionsChartView === 'scatter' && (
                <Scatter
                  data={{
                    datasets: [{
                      label: 'Predictions vs Actuals',
                      data: results.predictions.map((pred, i) => ({
                        x: results.actuals![i],
                        y: pred
                      })),
                      backgroundColor: 'rgba(13, 148, 136, 0.6)',
                      borderColor: 'rgb(13, 148, 136)',
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }, {
                      label: 'Perfect Prediction',
                      data: [
                        { x: Math.min(...results.actuals!), y: Math.min(...results.actuals!) },
                        { x: Math.max(...results.actuals!), y: Math.max(...results.actuals!) }
                      ],
                      type: 'scatter',
                      borderColor: '#dc2626',
                      borderDash: [10, 5],
                      pointRadius: 0,
                      showLine: true
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      x: {
                        ...(chartOptions.scales?.x || {}),
                        title: { display: true, text: 'Actual Values' }
                      },
                      y: {
                        ...(chartOptions.scales?.y || {}),
                        title: { display: true, text: 'Predicted Values' }
                      }
                    }
                  }}
                />
              )}
              {predictionsChartView === 'residuals' && (
                <Scatter
                  data={{
                    datasets: [{
                      label: 'Residuals',
                      data: results.predictions.map((pred, i) => ({
                        x: pred,
                        y: pred - results.actuals![i]
                      })),
                      backgroundColor: 'rgba(245, 158, 11, 0.6)',
                      borderColor: 'rgb(245, 158, 11)',
                      pointRadius: 4,
                      pointHoverRadius: 7
                    }, {
                      label: 'Zero Line',
                      data: [
                        { x: Math.min(...results.predictions), y: 0 },
                        { x: Math.max(...results.predictions), y: 0 }
                      ],
                      type: 'scatter',
                      borderColor: '#6b7280',
                      borderDash: [5, 5],
                      pointRadius: 0,
                      showLine: true
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      x: {
                        ...(chartOptions.scales?.x || {}),
                        title: { display: true, text: 'Predicted Values' }
                      },
                      y: {
                        ...(chartOptions.scales?.y || {}),
                        title: { display: true, text: 'Residuals' }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Per-sample error table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Per-Sample Errors (Residuals)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-gray-700">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Index</th>
                    <th className="px-2 py-1">Actual</th>
                    <th className="px-2 py-1">Predicted</th>
                    <th className="px-2 py-1">Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {results.actuals && results.predictions && results.actuals.map((actual, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-2 py-1">{i + 1}</td>
                      <td className="px-2 py-1">{formatNumber(actual)}</td>
                      <td className="px-2 py-1">{formatNumber(results.predictions[i])}</td>
                      <td className="px-2 py-1">{formatNumber(results.predictions[i] - actual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: React.ReactNode;
  value: string | number;
  suffix?: string;
  description: string;
  icon?: React.ReactNode;
}

function MetricCard({ title, value, suffix = '', description, icon }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-600">{title}</h5>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-black mb-2">
        {typeof value === 'number' ? value : value}{suffix}
      </p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}
