import React, { useState } from "react";
import * as Papa from "papaparse";
import { DataField } from '@/types/data';
import { calculateRSquared, calculateRMSE, calculateMAE, calculateConfidenceIntervals, calculateStandardError } from '@/utils/analysis/regression/metrics';
import { performRegression } from '@/utils/analysis/regression';

const regressionFilters = [
  "Linear", "Multiple Linear", "Logistic", "Polynomial", "Ridge (L2)",
  "Lasso (L1)", "Elastic Net", "Stepwise", "Time Series", "Quantile", "Log-Log"
];

interface RegressionDashboardProps {
  data?: {
    fields: DataField[];
  };
  onResultsChange?: (results: any) => void;
}

export default function RegressionDashboard({ data: initialData, onResultsChange }: RegressionDashboardProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("Linear");
  const [features, setFeatures] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[];
          setCsvData(data);
          setHeaders(Object.keys(data[0]));
        },
      });
    }
  };

  const handleFeatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setFeatures(options);
  };

  const performRegressionAnalysis = async () => {
    if (!target || features.length === 0) {
      setError("Please select both features and target variable");
      return;
    }

    try {
      // Convert CSV data to DataField format
      const fields: DataField[] = [
        ...features.map(feature => ({
          name: feature,
          type: 'number' as const,
          value: csvData.map(row => parseFloat(row[feature]))
        })),
        {
          name: target,
          type: 'number' as const,
          value: csvData.map(row => parseFloat(row[target]))
        }
      ];

      // Perform regression analysis
      const regressionResults = await performRegression(fields, {
        type: selectedModel.toLowerCase().replace(/\s+/g, '_') as any
      });

      // Calculate additional metrics
      const predictions = regressionResults[0]?.predictions || [];
      const actualValues = regressionResults[0]?.actualValues || [];
      const residuals = actualValues.map((actual: number, i: number) => actual - predictions[i]);
      
      const r2 = calculateRSquared(actualValues, predictions);
      const rmse = calculateRMSE(residuals);
      const mae = calculateMAE(residuals);
      const stderr = calculateStandardError(residuals);
      const conf = calculateConfidenceIntervals(predictions, stderr);

      const finalResults = {
        ...regressionResults[0],
        metrics: {
          ...regressionResults[0]?.metrics,
          r2,
          rmse,
          mae,
          stderr,
          confidence: conf
        }
      };

      setResults(finalResults);
      onResultsChange?.(finalResults);
      setError("");
    } catch (err) {
      console.error('Regression analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during regression analysis');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-black mb-4">Regression Analysis</h2>

      {!initialData && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-black mb-2">
            Upload CSV Data
          </label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="block w-full text-sm text-black
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-black mb-2">Select Model</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {regressionFilters.map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                selectedModel === model 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-black border-gray-200 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {(headers.length > 0 || initialData) && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Select Features (X)
            </label>
            <select 
              multiple 
              onChange={handleFeatureChange} 
              className="w-full border border-gray-300 rounded-lg p-2 min-h-[120px] text-black"
              value={features}
            >
              {(initialData?.fields || headers).map((field) => (
                <option key={typeof field === 'string' ? field : field.name} className="text-black">
                  {typeof field === 'string' ? field : field.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Select Target (Y)
            </label>
            <select 
              onChange={(e) => setTarget(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2 text-black"
              value={target}
            >
              <option value="" className="text-black">-- Select Target --</option>
              {(initialData?.fields || headers).map((field) => (
                <option key={typeof field === 'string' ? field : field.name} className="text-black">
                  {typeof field === 'string' ? field : field.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <button 
            onClick={performRegressionAnalysis} 
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Regression Analysis
          </button>
        </>
      )}

      {results && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4 text-black">Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Model Performance</h4>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="text-black">R² Score:</span>
                    <span className="font-medium text-black">{results.metrics.r2.toFixed(4)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-black">RMSE:</span>
                    <span className="font-medium text-black">{results.metrics.rmse.toFixed(4)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-black">MAE:</span>
                    <span className="font-medium text-black">{results.metrics.mae.toFixed(4)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-black">Standard Error:</span>
                    <span className="font-medium text-black">{results.metrics.stderr.toFixed(4)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-black mb-2">Confidence Intervals (95%)</h4>
                <div className="space-y-2">
                  <p className="text-black">Upper Bound:</p>
                  <p className="font-mono text-sm text-black">
                    [{results.metrics.confidence.upper.slice(0, 3).map((v: number) => v.toFixed(2)).join(', ')}]
                  </p>
                  <p className="text-black mt-2">Lower Bound:</p>
                  <p className="font-mono text-sm text-black">
                    [{results.metrics.confidence.lower.slice(0, 3).map((v: number) => v.toFixed(2)).join(', ')}]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {results.coefficients && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-black mb-2">Model Coefficients</h4>
              <div className="space-y-2">
                {results.coefficients.map((coef: number, i: number) => (
                  <p key={i} className="flex justify-between">
                    <span className="text-black">β{i}:</span>
                    <span className="font-medium text-black">{coef.toFixed(4)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 