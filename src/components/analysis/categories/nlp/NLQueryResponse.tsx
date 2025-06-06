import { Brain, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { ChartView } from '@/components/visualization/ChartView';
import type { DataField } from '@/types/data';
import { TooltipProvider } from '@radix-ui/react-tooltip';
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
  ScatterController,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale
} from 'chart.js';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip as TooltipComponent, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ScatterController,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

type VisualizationType = 'bar' | 'line' | 'scatter' | 'pie' | 'radar';

interface NLQueryResponseProps {
  response: {
    answer: string;
    data?: DataField[];
    visualization?: {
      type: VisualizationType;
      title?: string;
      description?: string;
    };
    error?: string;
    sources?: { title: string; url: string }[];
    followUpQuestions?: string[];
  } | null;
  isLoading?: boolean;
  onFollowUp?: (question: string) => void;
}

export function NLQueryResponse({ response, isLoading, onFollowUp }: NLQueryResponseProps) {
  const [showSources, setShowSources] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<VisualizationType | null>(null);

  useEffect(() => {
    if (response?.visualization) {
      setSelectedChartType(response.visualization.type);
    }
  }, [response]);

  if (!response && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
        <span className="ml-2 text-gray-600">Processing your query...</span>
      </div>
    );
  }

  if (response?.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-700 font-medium">Error</p>
          <p className="text-red-600 mt-1">{response.error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <TooltipProvider>
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        {/* Answer Section */}
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
          <div className="prose prose-teal max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{response.answer}</p>
          </div>
        </div>

        {/* Visualization Section */}
        {response.data && response.visualization && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  {response.visualization.title || 'Data Visualization'}
                </h3>
                {response.visualization.description && (
                  <p className="text-sm text-gray-500 mt-1">{response.visualization.description}</p>
                )}
              </div>
              
              <div className="flex gap-2 text-black">
                <TooltipComponent>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRawData(!showRawData)}
                    >
                      {showRawData ? 'Hide Data' : 'View Data'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showRawData ? 'Hide raw data table' : 'View raw data in table format'}
                  </TooltipContent>
                </TooltipComponent>
                
                {['bar', 'line', 'scatter', 'pie', 'radar'].map((type) => (
                  <TooltipComponent key={type}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedChartType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedChartType(type as VisualizationType)}
                        disabled={selectedChartType === type}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View as {type} chart</TooltipContent>
                  </TooltipComponent>
                ))}
              </div>
            </div>

            {showRawData ? (
              <div className="overflow-auto text-black">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(response.data[0]).map((key) => (
                        <th
                          key={key}
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-black">
                    {response.data.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, i) => (
                          <td
                            key={i}
                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[400px]">
                <ChartView
                  data={response.data}
                  type={selectedChartType || response.visualization.type}
                  title={response.visualization.title}
                />
              </div>
            )}
          </div>
        )}

        {/* Sources Section */}
        {response.sources && response.sources.length > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="text-gray-600 hover:bg-gray-100"
            >
              {showSources ? 'Hide Sources' : `Show Sources (${response.sources.length})`}
            </Button>
            
            {showSources && (
              <ul className="mt-2 space-y-2">
                {response.sources.map((source, index) => (
                  <li key={index} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline flex items-start gap-1"
                    >
                      <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Follow-up Questions */}
        {response.followUpQuestions && response.followUpQuestions.length > 0 && onFollowUp && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Follow-up questions</h4>
            <div className="flex flex-wrap gap-2">
              {response.followUpQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onFollowUp(question)}
                  className="text-gray-700 hover:bg-gray-50"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 