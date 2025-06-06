import React from 'react';
import { Brain, TrendingUp, AlertCircle, LineChart } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { formatNumber } from '@/utils/analysis/formatting';

interface MLAnalysisViewProps {
  analysis: {
    predictions: number[];
    evaluation: {
      accuracy: number;
      loss: number;
    };
    training: {
      duration: number;
      history: {
        loss: number[];
        val_loss?: number[];
      };
    };
  };
}

export function MLAnalysisView({ analysis }: MLAnalysisViewProps) {
  if (!analysis) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p>No machine learning analysis results available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        {/* Header with confidence indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">ML Analysis Results</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Accuracy:</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${(analysis.evaluation.accuracy || 0) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {((analysis.evaluation.accuracy || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Training History Chart */}
        <div className="h-64 mb-6">
          <Line
            data={{
              labels: Array.from({ length: analysis.training.history.loss.length }, (_, i) => `Epoch ${i+1}`),
              datasets: [
                {
                  label: 'Training Loss',
                  data: analysis.training.history.loss,
                  borderColor: 'rgb(99, 102, 241)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                ...(analysis.training.history.val_loss ? [{
                  label: 'Validation Loss',
                  data: analysis.training.history.val_loss,
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.1)',
                  fill: true,
                  tension: 0.4
                }] : [])
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'Training History'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Accuracy"
            value={formatNumber(analysis.evaluation.accuracy)}
            icon={<Brain className="w-4 h-4" />}
          />
          <MetricCard
            title="Loss"
            value={formatNumber(analysis.evaluation.loss)}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="Training Time"
            value={formatNumber(analysis.training.duration)}
            suffix="ms"
            icon={<LineChart className="w-4 h-4" />}
          />
          <MetricCard
            title="Final Loss"
            value={formatNumber(analysis.training.history.loss[analysis.training.history.loss.length - 1])}
            icon={<Brain className="w-4 h-4" />}
          />
        </div>

        {/* Predictions Chart */}
        <div className="h-64">
          <Line
            data={{
              labels: Array.from({ length: analysis.predictions.length }, (_, i) => `t+${i+1}`),
              datasets: [{
                label: 'Predictions',
                data: analysis.predictions,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: 'ML Predictions'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Extracted components for better organization
function MetricCard({ title, value, suffix = '', icon }: { 
  title: string; 
  value: string | number; 
  suffix?: string;
  icon: React.ReactNode 
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-indigo-600">{icon}</div>
        <h5 className="text-sm font-medium text-gray-600">{title}</h5>
      </div>
      <p className="text-2xl font-semibold text-gray-900">
        {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </p>
    </div>
  );
}

export function PatternCard({ type, description, confidence }: { 
  type: string;
  description: string;
  confidence: number;
}) {
  const confidenceColor = confidence > 0.7 ? 'bg-green-100 text-green-700' :
                        confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700';

  return (
    <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
      <div className={`p-2 rounded-lg ${confidenceColor}`}>
        <Brain className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{type}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 rounded-full bg-indigo-600"
              style={{ width: `${(confidence || 0) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {((confidence || 0) * 100).toFixed()}% confidence
          </span>
        </div>
      </div>
    </div>
  );
}

export function FeatureImportanceBar({ feature, importance }: {
  feature: string;
  importance: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 min-w-[120px]">{feature}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full">
        <div
          className="h-2 bg-indigo-600 rounded-full"
          style={{ width: `${importance}%` }}
        />
      </div>
    </div>
  );
} 