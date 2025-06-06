import { AnalysisSection } from '@/components/analysis/categories/nlp';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAnalysisData } from '@/utils/storage/db';
import { useAnalysis } from '@/hooks/analysis';
import type { FileData } from '@/types/file';
import type { AnalyzedData } from '@/types/analysis';
import { Brain, ArrowLeft, AlertCircle } from 'lucide-react';
import { performAnalysis } from '@/utils/analysis/core';

function Analysis() {
  const [data, setData] = useState<FileData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const { analyze, isAnalyzing, progress, error: analysisError } = useAnalysis();
  useEffect(() => {
    async function loadData() {
      try {
        setIsProcessing(true);
        setError(null);

        const analysisData = await getAnalysisData();
        if (!analysisData) {
          navigate('/', { 
            replace: true,
            state: { error: 'No analysis data found. Please upload a file to analyze.' }
          });
          return;
        }

        if (!analysisData.content?.fields?.length) {
          throw new Error('Invalid analysis data structure');
        }
        
        setData(analysisData);
        analyze(analysisData.content.fields);
      } catch (err) {
        console.error('Analysis data loading error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load analysis data'));
      } finally {
        setIsProcessing(false);
      }
    }
    loadData();
  }, [navigate, analyze]);

  
  const computedResults = useMemo<AnalyzedData | null>(() => {
    if (!data || !category) return null;
    try {
      const analysisResults = performAnalysis(data.content.fields, category);
      if (!analysisResults) {
        throw new Error('No analysis results available');
      }

      // Transform the analysis results to match AnalyzedData type
      const baseResult: AnalyzedData = {
        fields: data.content.fields.map(field => ({
          ...field,
          values: field.value
        })),
        statistics: {},
        trends: [],
        correlations: [],
        insights: [],
        recommendations: [],
        pros: [],
        cons: [],
        hasNumericData: data.content.fields.some(f => f.type === 'number'),
        hasTextData: data.content.fields.some(f => f.type === 'string'),
        dataQuality: {
          completeness: 1,
          validity: 1
        },
        analysis: {
          trends: []
        }
      };

      // Merge the analysis results based on the category
      if ('statistics' in analysisResults) {
        baseResult.statistics = analysisResults.statistics as Record<string, any>;
      }
      if ('trends' in analysisResults) {
        baseResult.trends = (analysisResults.trends as Array<{ field: string; trend: 'up' | 'down' | 'stable' }>) || [];
      }
      if ('correlations' in analysisResults) {
        const correlations = analysisResults.correlations as Record<string, number>;
        baseResult.correlations = Object.entries(correlations).map(([field, correlation]) => ({
          fields: [field],
          correlation
        }));
      }
      if ('insights' in analysisResults) {
        baseResult.insights = (analysisResults.insights as string[]) || [];
      }
      if ('analysis' in analysisResults && 'trends' in analysisResults.analysis) {
        baseResult.analysis.trends = (analysisResults.analysis.trends as Array<{
          field: string;
          direction: 'up' | 'down' | 'stable';
          confidence: number;
        }>) || [];
      }
      if ('mlAnalysis' in analysisResults) {
        baseResult.mlAnalysis = analysisResults.mlAnalysis as {
          predictions: number[];
          evaluation: { accuracy: number; loss: number };
          training: { duration: number; history: { loss: number[]; val_loss?: number[] } };
        };
      }

      return baseResult;
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        fields: data.content.fields.map(field => ({
          ...field,
          values: field.value
        })),
        statistics: {},
        trends: [],
        correlations: [],
        insights: [],
        recommendations: [],
        pros: [],
        cons: [],
        hasNumericData: data.content.fields.some(f => f.type === 'number'),
        hasTextData: data.content.fields.some(f => f.type === 'string'),
        dataQuality: {
          completeness: 1,
          validity: 1
        },
        analysis: {
          trends: []
        },
        error: error instanceof Error ? error.message : 'Failed to perform analysis'
      };
    }
  }, [data, category]);

  if (error || analysisError) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg flex flex-col items-center gap-3 shadow-sm max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8" />
          <div>
            <p className="font-medium text-black">{(error || analysisError)?.message}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Return to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isProcessing || isAnalyzing) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-600 font-medium">
              {isProcessing ? 'Processing data...' : `Analyzing... ${Math.round(progress)}%`}
            </p>
            {progress > 0 && (
              <div className="w-full max-w-md mt-4">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-white hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Upload
        </button>
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
          <h1 className="text-2xl font-bold text-gray-900">
            {category 
              ? `${category.charAt(0).toUpperCase() + category.slice(1)} Analysis`
              : 'Analysis Results'
            }
          </h1>
        </div>
      </div>

      {data ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <AnalysisSection
              data={data.content} 
              category={category}
              results={computedResults as any}
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      )}
    </div>
  );
}

export { Analysis };