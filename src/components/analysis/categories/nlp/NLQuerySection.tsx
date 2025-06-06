import { useState, useEffect } from 'react';
import { Brain, HelpCircle, Sparkles, RotateCw } from 'lucide-react';
import { NLQueryInput } from './NLQueryInput';
import { NLQueryResponse } from './NLQueryResponse';
import { processNaturalLanguageQuery } from '@/utils/analysis/nlp/queryProcessor';
import type { DataField } from '@/types/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface NLQuerySectionProps {
  data: {
    fields: DataField[];
  };
}

const EXAMPLE_QUERIES = [
  "What's the average of each field?",
  "Show me the trends over time",
  "Compare the different fields",
  "What's the distribution of values?",
  "Give me a summary of the data",
  "Are there any outliers in the data?",
  "Which field has the highest correlation with [field name]?"
];

export function NLQuerySection({ data }: NLQuerySectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    try {
      const result = await processNaturalLanguageQuery(query, data.fields);
      setResponse(result);
      // Add to query history if not already there
      setQueryHistory(prev => 
        prev.includes(query) ? prev : [query, ...prev].slice(0, 5)
      );
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Failed to process query',
        query // Include the original query in the error response
      });
    } finally {
      setIsLoading(false);
      setShowExamples(false);
    }
  };

  const handleExampleClick = (example: string) => {
    handleQuery(example);
  };

  const handleRetry = () => {
    if (response?.query) {
      handleQuery(response.query);
    }
  };

  useEffect(() => {
    // Show examples again after clearing the input
    if (!response && !isLoading) {
      setShowExamples(true);
    }
  }, [response, isLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-black">Ask Questions About Your Data</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-gray-400 ml-1 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Ask natural language questions about your dataset and get insights</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg text-black border border-gray-200 ">
        <NLQueryInput
          onQuery={handleQuery}
          isLoading={isLoading}
          placeholder="Try asking: 'What are the trends?' or 'Show me a summary'"
        />
        
        {isLoading && (
          <div className="mt-4 flex items-center justify-center text-gray-500">
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
            <span>Processing your question...</span>
          </div>
        )}

        {showExamples && (
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Sparkles className="w-4 h-4 mr-1 text-teal-500" />
              <span className="font-medium text-black">Try these examples:</span>
            </div>
            <ul className="space-y-2">
              {EXAMPLE_QUERIES.map((query, index) => (
                <li 
                  key={index}
                  className="text-sm text-teal-600 cursor-pointer hover:text-teal-800 hover:underline"
                  onClick={() => handleExampleClick(query)}
                >
                  • {query}
                </li>
              ))}
            </ul>
          </div>
        )}

        {queryHistory.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">Recent queries:</div>
            <div className="flex flex-wrap gap-2">
              {queryHistory.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-teal-600"
                  onClick={() => handleQuery(query)}
                >
                  {query.length > 20 ? `${query.substring(0, 20)}...` : query}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {response && (
        <div className="mt-6">
          <NLQueryResponse 
            response={response} 
            onFollowUp={response.error ? handleRetry : undefined}
          />
        </div>
      )}
    </div>
  );
} 