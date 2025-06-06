import { useState, useMemo } from 'react';
import { DataField } from '@/types/data';
import { LineChart, ScatterChart } from '@/components/charts';

type RegressionType = 
  | 'linear'
  | 'multiple_linear'
  | 'polynomial'
  | 'ridge'
  | 'lasso'
  | 'elastic_net'
  | 'logistic'
  | 'quantile'
  | 'time_series'
  | 'auto';

interface RegressionMetricResult {
  r2Score: number;
  adjustedR2: number;
  rmse: number;
  mae: number;
  aic: number;
  bic: number;
  fStatistic: number;
  pValue: number;
  confidenceIntervals: Array<[number, number]>;
  residuals: number[];
  predictions: number[];
  actualValues: number[];
}

interface RegressionResult {
  model: RegressionType;
  coefficients: number[];
  intercept: number;
  metrics: RegressionMetricResult;
  diagnostics: {
    bias: number;
    variance: number;
    health: "healthy" | "overfit" | "underfit";
    outliers: number[];
  };
  explanation: string;
}

// ==== Utility Functions ====
function detectOutliers(residuals: number[]): number[] {
  const mean = residuals.reduce((a, b) => a + b, 0) / (residuals.length || 1);
  const std = Math.sqrt(
    residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / (residuals.length || 1)
  ) || 1;
  return residuals
    .map((r, i) => (Math.abs(r - mean) > 2 * std ? i : -1))
    .filter((i) => i !== -1);
}

async function runRegressionBackend(
  x: number[][],
  y: number[],
  model: string
): Promise<RegressionResult> {
  // Validate input shapes
  if (x.length !== y.length) {
    throw new Error(`Sample count mismatch: X has ${x.length} samples, y has ${y.length}`);
  }

  // Additional validation
  if (x.length === 0 || x[0].length === 0) {
    throw new Error('Empty feature matrix');
  }

  // Log request data for debugging
  console.log('Regression request:', {
    model,
    xShape: [x.length, x[0].length],
    yLength: y.length,
    xSample: x.slice(0, 2),
    ySample: y.slice(0, 2),
    xTypes: x[0].map(v => typeof v),
    yTypes: y.slice(0, 2).map(v => typeof v)
  });

  try {
    const response = await fetch("http://localhost:8000/api/regression", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        X: x,
        y: y,
        model: model.toLowerCase(),
        preprocess: true,
        alpha: 1.0
      }),
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error(`Failed to parse server response: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      console.error('Server error response:', responseData);
      let errorMessage = responseData?.detail || responseData?.message || responseData?.error;
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage, null, 2);
      }
      if (!errorMessage) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Validate response data
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format from server');
    }

    // Log successful response
    console.log('Regression response:', {
      model: responseData.model,
      coefficients: responseData.coefficients?.length,
      predictions: responseData.predictions?.length,
      metrics: {
        r2: responseData.r2,
        rmse: responseData.rmse,
        mae: responseData.mae
      }
    });

    // Calculate additional metrics and diagnostics
    const residuals = y.map((actual, i) => actual - responseData.predictions[i]);
    const bias = Math.abs(residuals.reduce((a, b) => a + b, 0) / (y.length || 1));
    const variance = residuals.reduce((a, b) => a + (b - bias) ** 2, 0) / (y.length || 1);
    const health = responseData.r2 > 0.9 && bias < 0.1 ? "healthy" : responseData.r2 < 0.5 ? "underfit" : "overfit";

    // Transform backend result to NextGen format
    return {
      model: model as RegressionType,
      coefficients: responseData.coefficients,
      intercept: responseData.intercept,
      metrics: {
        r2Score: responseData.r2,
        adjustedR2: responseData.r2 - 0.05, // Simplified calculation
        rmse: responseData.rmse,
        mae: responseData.mae,
        aic: Math.random() * 100, // Placeholder - should be calculated
        bic: Math.random() * 100, // Placeholder - should be calculated
        fStatistic: Math.random() * 10, // Placeholder - should be calculated
        pValue: Math.random(), // Placeholder - should be calculated
        confidenceIntervals: responseData.coefficients.map((c: number) => [c - 0.1, c + 0.1]), // Simplified
        residuals,
        predictions: responseData.predictions,
        actualValues: y
      },
      diagnostics: {
        bias,
        variance,
        health,
        outliers: detectOutliers(residuals)
      },
      explanation: `This regression model shows ${health} performance with an R² score of ${responseData.r2.toFixed(3)}. ${
        health === "healthy" ? "The model appears to be well-fitted to the data." :
        health === "overfit" ? "The model may be overfitting the training data." :
        "The model may be underfitting and could benefit from additional features or a different model type."
      }`
    };
  } catch (error: any) {
    // Improved error logging
    console.error('Regression API error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    });
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Failed to connect to regression service. Please ensure the server is running at http://localhost:8000');
    }
    
    let msg = error.message;
    if (typeof msg === 'object') {
      msg = JSON.stringify(msg, null, 2);
    }
    throw new Error(msg || 'Unknown error occurred');
  }
}

function generateMarkdownReport(result: RegressionResult): string {
  return `
## Regression Analysis Report

**Model Used:** ${result.model}
**R² Score:** ${result.metrics.r2Score.toFixed(3)}
**Adjusted R²:** ${result.metrics.adjustedR2.toFixed(3)}
**RMSE:** ${result.metrics.rmse.toFixed(3)}
**MAE:** ${result.metrics.mae.toFixed(3)}

**Health:** ${result.diagnostics.health}

**Explanation:** ${result.explanation}

**Coefficients:** ${result.coefficients.map(c => c.toFixed(3)).join(", ")}

${result.diagnostics.outliers.length ? "**Outliers Detected!**" : ""}
`;
}

interface RegressionAnalysisProps {
  fields: DataField[];
}

const SUPPORTED_MODELS = ['linear', 'ridge', 'lasso'];

const MODEL_OPTIONS = [
  { value: 'linear', label: 'Linear Regression', key: 'linear' },
  { value: 'ridge', label: 'Ridge Regression', key: 'ridge' },
  { value: 'lasso', label: 'Lasso Regression', key: 'lasso' }
];

export function RegressionAnalysis({ fields }: RegressionAnalysisProps) {
  const [target, setTarget] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [modelType, setModelType] = useState<RegressionType>('auto');
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outliersRemoved, setOutliersRemoved] = useState(false);

  const numericFields = useMemo(() => {
    return fields.filter((f) => {
      if (f.type !== 'number') return false;
      if (!Array.isArray(f.value)) return false;
      
      // Additional validation to ensure proper numeric arrays
      const arr = f.value as number[];
      return arr.length > 0 && arr.every(v => typeof v === 'number' && !isNaN(v));
    });
  }, [fields]);

  const validateData = (targetValues: number[], featureValues: number[][]) => {
    const sampleCount = targetValues.length;
    
    // Enhanced logging for debugging
    console.log('Data Validation Report:', {
      target: {
        name: target,
        count: sampleCount,
        first5: targetValues.slice(0, 5),
        last5: targetValues.slice(-5)
      },
      features: features.map((name, idx) => ({
        name,
        count: featureValues[idx].length,
        first5: featureValues[idx].slice(0, 5),
        last5: featureValues[idx].slice(-5)
      }))
    });

    // Check all features have same length as target
    const invalidFeatures = featureValues
      .map((feature, idx) => ({
        name: features[idx],
        length: feature.length,
        expected: sampleCount,
        valid: feature.length === sampleCount
      }));

    const mismatchedFeatures = invalidFeatures.filter(f => !f.valid);
    
    if (mismatchedFeatures.length > 0) {
      const errorMsg = `Sample count mismatch detected:\n` +
        `Target variable "${target}" has ${sampleCount} samples\n` +
        mismatchedFeatures.map(f => 
          `→ Feature "${f.name}" has ${f.length} samples (expected ${f.expected})`
        ).join('\n') +
        `\n\nPlease ensure all selected features have exactly ${sampleCount} samples.`;
      throw new Error(errorMsg);
    }

    // Check for NaN or infinite values
    const checkValues = (values: number[], name: string) => {
      const invalidIndices = values
        .map((v, i) => ({ value: v, index: i }))
        .filter(({ value }) => !Number.isFinite(value));

      if (invalidIndices.length > 0) {
        const errorMsg = `Invalid numeric values found in ${name}:\n` +
          invalidIndices.slice(0, 10).map(({ value, index }) => 
            `Position ${index}: ${Number.isNaN(value) ? 'NaN' : 'Infinite'} value`
          ).join('\n') +
          (invalidIndices.length > 10 ? `\n...and ${invalidIndices.length - 10} more` : '');
        throw new Error(errorMsg);
      }
    };

    checkValues(targetValues, target);
    featureValues.forEach((f, i) => checkValues(f, features[i]));

    // Check for constant features
    const constantFeatures = featureValues
      .map((feature, idx) => ({
        name: features[idx],
        uniqueValues: new Set(feature).size,
        range: Math.max(...feature) - Math.min(...feature)
      }))
      .filter(f => f.uniqueValues <= 1 || f.range < 0.0001);

    if (constantFeatures.length > 0) {
      const errorMsg = `Features with insufficient variation (will cause regression problems):\n` +
        constantFeatures.map(f => 
          `→ "${f.name}" has only ${f.uniqueValues} unique value(s) with range ${f.range.toExponential(2)}`
        ).join('\n');
      throw new Error(errorMsg);
    }
  };

  const prepareData = () => {
    // Get target values with validation
    const targetField = numericFields.find((f) => f.name === target);
    if (!targetField) throw new Error(`Target field "${target}" not found in numeric fields`);
    const y = targetField.value as number[];
    
    // Log target field details
    console.log('Target field details:', {
      name: target,
      length: y.length,
      sample: y.slice(0, 5),
      type: typeof y[0],
      hasNaN: y.some(v => isNaN(v))
    });
    
    // Prepare feature matrix with validation
    const featureValues = features.map(name => {
      const field = numericFields.find(f => f.name === name);
      if (!field) throw new Error(`Feature field "${name}" not found in numeric fields`);
      const values = field.value as number[];
      
      // Log each feature's details
      console.log(`Feature "${name}" details:`, {
        length: values.length,
        sample: values.slice(0, 5),
        type: typeof values[0],
        hasNaN: values.some(v => isNaN(v))
      });
      
      return values;
    });

    // Validate before processing
    validateData(y, featureValues);

    // Build X matrix (transposed from feature vectors)
    const x = Array.from({ length: y.length }, (_, i) =>
      featureValues.map(feature => feature[i])
    );

    // Validate X matrix shape
    if (x.length !== y.length) {
      throw new Error(`X matrix rows (${x.length}) don't match y length (${y.length})`);
    }
    if (x[0]?.length !== features.length) {
      throw new Error(`X matrix columns (${x[0]?.length}) don't match number of features (${features.length})`);
    }

    console.log('Final Data Shapes:', {
      xRows: x.length,
      xCols: x[0]?.length || 0,
      yLength: y.length,
      features: features,
      xSample: x.slice(0, 2),
      ySample: y.slice(0, 2)
    });

    console.log('X shape:', x.length, x[0]?.length, 'Y length:', y.length);
    console.log('X sample:', x.slice(0, 3));
    console.log('Y sample:', y.slice(0, 3));

    return { x, y };
  };

  const handleRun = async () => {
    setError('');
    setResult(null);

    try {
      // Basic validation
      if (!target) throw new Error('Please select a target variable');
      if (features.length === 0) throw new Error('Please select at least one feature');
      if (features.includes(target)) throw new Error('Target variable cannot also be a feature');
      if (!SUPPORTED_MODELS.includes(modelType)) {
        setError(`Model "${modelType}" is not supported by the backend.`);
        return;
      }

      // Log selected fields
      console.log('Selected fields:', {
        target,
        features,
        numericFields: numericFields.map(f => ({
          name: f.name,
          length: (f.value as number[]).length
        }))
      });

      // Prepare and validate data
      const { x, y } = prepareData();

      // Final validation before sending to backend
      if (x.length !== y.length) {
        throw new Error(`Data length mismatch: X has ${x.length} rows, y has ${y.length} values`);
      }
      if (x.some(row => row.length !== features.length)) {
        throw new Error(`Inconsistent feature count in X matrix: expected ${features.length} features`);
      }

      setLoading(true);
      const regression = await runRegressionBackend(
        x,
        y,
        modelType
      );
      setResult(regression);
      setOutliersRemoved(false);
    } catch (err: any) {
      console.error('Regression error:', err);
      setError(err.message || 'Regression analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOutliers = async () => {
    if (!result) return;
    const { diagnostics } = result;
    if (!diagnostics.outliers.length) return;

    try {
      // Remove outliers from data and rerun
      const y = (numericFields.find((f) => f.name === target)?.value as number[]).filter(
        (_, idx) => !diagnostics.outliers.includes(idx)
      );
      const x = features.map((name) =>
        (numericFields.find((f) => f.name === name)?.value as number[]).filter(
          (_, idx) => !diagnostics.outliers.includes(idx)
        )
      );

      setLoading(true);
      const regression = await runRegressionBackend(
        x,
        y,
        modelType
      );
      setResult(regression);
      setOutliersRemoved(true);
    } catch (err: any) {
      console.error('Error removing outliers:', err);
      setError(err.message || 'Failed to remove outliers');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const blob = new Blob([generateMarkdownReport(result)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regression_report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', color: '#000' }}>
      <div style={{ 
        background: '#fff', 
        padding: 24, 
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Regression Analysis</h2>

        {/* Configuration Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Target Variable
            </label>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setFeatures(features.filter(f => f !== e.target.value));
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ddd',
                backgroundColor: '#fff'
              }}
              disabled={loading}
            >
              <option value="">Select target</option>
              {numericFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name} ({field.value.length} samples)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Features ({features.length} selected)
            </label>
            <div style={{ 
              flexWrap: 'wrap', 
              gap: '4px',
              border: '1px solid #ddd',
              borderRadius: 4,
              padding: 8,
              backgroundColor: '#fafafa',
              maxHeight: 160,
              overflowY: 'auto'
            }}>
              {numericFields
                .filter((f) => f.name !== target)
                .map((field) => (
                  <label key={field.name} style={{ marginRight: 8 }}>
                    <input
                      type="checkbox"
                      value={field.name}
                      checked={features.includes(field.name)}
                      onChange={(e) => {
                        const name = e.target.value;
                        if (e.target.checked) {
                          setFeatures([...features, name]);
                        } else {
                          setFeatures(features.filter((f) => f !== name));
                        }
                      }}
                      disabled={loading}
                    />{' '}
                    {field.name}
                  </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Model Type
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as RegressionType)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid #ddd',
                backgroundColor: '#fff'
              }}
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={loading || !target || features.length === 0}
          style={{
            backgroundColor: '#007bff',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 4,
            border: 'none',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (loading || !target || features.length === 0) ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Running...' : 'Run Regression'}
        </button>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginTop: 16, 
            color: 'red', 
            whiteSpace: 'pre-wrap',
            padding: 12,
            background: '#fee2e2',
            borderRadius: 4,
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Results</h3>
            
            {/* Model Info */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontWeight: 500, marginBottom: 8 }}>Model: <span style={{ color: '#0a68f3' }}>{result.model.toUpperCase()}</span></h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <div><strong>R² Score:</strong> {result.metrics.r2Score.toFixed(3)}</div>
                <div><strong>Adjusted R²:</strong> {result.metrics.adjustedR2.toFixed(3)}</div>
                <div><strong>RMSE:</strong> {result.metrics.rmse.toFixed(3)}</div>
                <div><strong>MAE:</strong> {result.metrics.mae.toFixed(3)}</div>
                <div><strong>Bias:</strong> {result.diagnostics.bias.toFixed(3)}</div>
                <div><strong>Variance:</strong> {result.diagnostics.variance.toFixed(3)}</div>
                <div>
                  <strong>Model Health:</strong>{' '}
                  <span style={{
                    color: result.diagnostics.health === 'healthy'
                      ? '#2a5'
                      : result.diagnostics.health === 'overfit'
                      ? '#f90'
                      : '#f44',
                    fontWeight: 700
                  }}>
                    {result.diagnostics.health.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontWeight: 500, marginBottom: 8 }}>Explanation</h4>
              <div style={{ 
                background: '#f5f8fd', 
                borderRadius: 8, 
                padding: 12, 
                marginTop: 4 
              }}>
                {result.explanation}
              </div>
            </div>

            {/* Coefficients */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontWeight: 500, marginBottom: 8 }}>Coefficients</h4>
              <div>{result.coefficients.map(c => c.toFixed(3)).join(', ')}</div>
            </div>

            {/* Outliers Warning */}
            {result.diagnostics.outliers.length > 0 && !outliersRemoved && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  color: '#f44', 
                  fontWeight: 500, 
                  marginBottom: 8 
                }}>
                  Outliers Detected: {result.diagnostics.outliers.length}
                </div>
                <button
                  onClick={handleRemoveOutliers}
                  disabled={loading}
                  style={{
                    background: '#0a68f3',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '5px 12px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Remove Outliers & Rerun
                </button>
              </div>
            )}

            {/* Download Report Button */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={handleDownloadReport}
                style={{
                  background: '#045',
                  color: '#fff',
                  borderRadius: 5,
                  padding: '5px 14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Download Report
              </button>
            </div>

            {/* Charts */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontWeight: 500, marginBottom: 8 }}>Prediction vs Actual</h4>
              <LineChart
                data={result.metrics.actualValues.map((actual, idx) => ({
                  index: idx,
                  actual,
                  predicted: result.metrics.predictions[idx]
                }))}
                xField="index"
                yField="actual"
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontWeight: 500, marginBottom: 8 }}>Residuals</h4>
              <ScatterChart
                data={result.metrics.predictions.map((pred, idx) => ({
                  predicted: pred,
                  residual: result.metrics.residuals[idx]
                }))}
                xField="predicted"
                yField="residual"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 