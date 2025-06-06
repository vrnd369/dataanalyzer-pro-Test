import { DataField } from '@/types/data';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { InfoIcon, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SentimentAnalysisProps {
  field: DataField;
  customLexicons?: {
    positive?: string[];
    negative?: string[];
  };
}

type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';

interface SentimentScore {
  score: number;
  label: SentimentLabel;
  confidence: number;
  text: string;
}

interface SentimentStats {
  positive: number;
  negative: number;
  neutral: number;
  average: number;
  strongestPositive: SentimentScore | null;
  strongestNegative: SentimentScore | null;
}

export function SentimentAnalysis({ field, customLexicons }: SentimentAnalysisProps) {
  const [sentiments, setSentiments] = useState<SentimentScore[]>([]);
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    neutral: 0,
    average: 0,
    strongestPositive: null,
    strongestNegative: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lexiconInfo, setLexiconInfo] = useState({
    positiveWords: 0,
    negativeWords: 0
  });

  const transformDataToText = (data: any): string[] => {
    if (!data) {
      throw new Error('No data provided for analysis');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        
        if (typeof item === 'object') {
          return `Product: ${item.productName || 'Unknown'}. ` +
                 `Category: ${item.category || 'N/A'}. ` +
                 `Sold ${item.quantity || 0} units at $${item.price || 0}. ` +
                 `Stock: ${item.currentStock || 0}. ` +
                 `Risk: ${item.risk || 'unknown'}.`;
        }
        
        return String(item);
      });
    }
    
    return [String(data)];
  };

  useEffect(() => {
    const analyzeSentiment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Transform the input data into text strings
        const texts = transformDataToText(field.value);
        console.log('Transformed texts:', texts);
        
        // Ensure we have valid text data
        if (!texts.length || texts.every(text => !text || text.trim() === '')) {
          throw new Error('No valid text data to analyze');
        }

        // Ensure each text is a non-empty string and clean it
        const validTexts = texts
          .filter(text => text && typeof text === 'string' && text.trim() !== '')
          .map(text => text.trim())
          .filter(text => text.length > 0); // Additional check for empty strings

        if (validTexts.length === 0) {
          throw new Error('No valid text data to analyze');
        }

        // Prepare custom lexicons
        const customLexiconsData = customLexicons ? {
          positive: Array.isArray(customLexicons.positive) 
            ? customLexicons.positive.filter(word => typeof word === 'string' && word.trim().length > 0)
            : [],
          negative: Array.isArray(customLexicons.negative)
            ? customLexicons.negative.filter(word => typeof word === 'string' && word.trim().length > 0)
            : []
        } : null;

        // Ensure the payload matches what your API expects
        const payload = {
          texts: validTexts,
          custom_lexicons: customLexiconsData
        };

        // Add detailed logging
        console.log('Raw field value:', field.value);
        console.log('Transformed texts:', texts);
        console.log('Valid texts:', validTexts);
        console.log('Full request payload:', JSON.stringify(payload, null, 2));
        console.log('Custom lexicons:', customLexiconsData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch('http://localhost:8003/api/analyze', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Full API Error:', {
              status: response.status,
              statusText: response.statusText,
              errorDetails: errorData,
              requestPayload: payload,
              responseHeaders: Object.fromEntries(response.headers.entries())
            });

            // Handle validation errors (422)
            if (response.status === 422) {
              let errorMessage = 'Validation error: ';
              if (Array.isArray(errorData.detail)) {
                errorMessage += errorData.detail.map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  if (err.message) return err.message;
                  if (err.loc) return `${err.loc.join('.')}: ${err.msg || err.message || JSON.stringify(err)}`;
                  return JSON.stringify(err);
                }).join('. ');
              } else if (typeof errorData.detail === 'string') {
                errorMessage += errorData.detail;
              } else if (errorData.detail) {
                errorMessage += JSON.stringify(errorData.detail);
              } else {
                errorMessage += 'Invalid request format';
              }
              throw new Error(errorMessage);
            }

            throw new Error(errorData.detail || `API Error (${response.status}): ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('API Success Response:', data);
          
          if (!data || !data.sentiments || !data.stats) {
            throw new Error('Invalid response format from sentiment analysis service');
          }

          setSentiments(data.sentiments);
          setStats({
            positive: data.stats.positive,
            negative: data.stats.negative,
            neutral: data.stats.neutral,
            average: data.stats.average,
            strongestPositive: data.stats.strongest_positive,
            strongestNegative: data.stats.strongest_negative
          });
          setLexiconInfo({
            positiveWords: data.lexicon_info?.positive_words || 0,
            negativeWords: data.lexicon_info?.negative_words || 0
          });
        } catch (error: unknown) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            setError('Request timed out after 5 seconds');
          } else {
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
          }
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Analysis error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    };

    analyzeSentiment();
  }, [field, customLexicons]);

  const total = stats.positive + stats.negative + stats.neutral;
  const getPercentage = (value: number) => total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  const getSentimentEmoji = (score: number) => {
    if (score > 0.2) return '😊';
    if (score > 0.05) return '🙂';
    if (score < -0.2) return '😠';
    if (score < -0.05) return '😞';
    return '😐';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing sentiment patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-medium">Analysis Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <p className="text-red-600 text-sm mt-2">
          Required format: {"{ texts: string[] }"}<br />
          Received data type: {Array.isArray(field.value) ? 'array' : typeof field.value}
        </p>
        <p className="text-red-600 text-sm mt-2">
          Example valid input: {"{ texts: ['I love this product', 'This needs improvement'] }"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lexicon Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Using {lexiconInfo.positiveWords} positive and {lexiconInfo.negativeWords} negative words</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p>The analysis uses a built-in lexicon of sentiment words. 
                {customLexicons ? ' Custom words were added to improve accuracy.' : ''}
                You can provide your own word lists via the customLexicons prop.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Overall Sentiment Distribution */}
      <div>
        <h3 className="text-sm font-medium mb-3">Sentiment Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-green-800">Positive</h4>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-green-600">{getPercentage(stats.positive)}%</span>
                  <span className="text-sm text-green-600 ml-2">({stats.positive} of {total})</span>
                </div>
              </div>
              <span className="text-2xl">😊</span>
            </div>
            {stats.strongestPositive && (
              <p className="text-xs text-green-700 mt-2 line-clamp-2">
                "{stats.strongestPositive.text.substring(0, 60)}{stats.strongestPositive.text.length > 60 ? '...' : ''}"
              </p>
            )}
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-red-800">Negative</h4>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-red-600">{getPercentage(stats.negative)}%</span>
                  <span className="text-sm text-red-600 ml-2">({stats.negative} of {total})</span>
                </div>
              </div>
              <span className="text-2xl">😞</span>
            </div>
            {stats.strongestNegative && (
              <p className="text-xs text-red-700 mt-2 line-clamp-2">
                "{stats.strongestNegative.text.substring(0, 60)}{stats.strongestNegative.text.length > 60 ? '...' : ''}"
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Neutral</h4>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-gray-600">{getPercentage(stats.neutral)}%</span>
                  <span className="text-sm text-gray-600 ml-2">({stats.neutral} of {total})</span>
                </div>
              </div>
              <span className="text-2xl">😐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Sentiment Score */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Average Sentiment Score</h3>
        <div className="flex items-center gap-4">
          <span className="text-3xl">{getSentimentEmoji(stats.average)}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Negative</span>
              <span>Positive</span>
            </div>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 h-full ${
                  stats.average > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(stats.average) * 200, 100)}%`,
                  left: stats.average > 0 ? '50%' : `${50 - Math.min(Math.abs(stats.average) * 100, 50)}%`
                }}
              />
              <div className="absolute top-0 left-1/2 h-full w-px bg-gray-400" />
            </div>
            <div className="mt-2 text-center">
              <span className="text-sm font-medium">
                Score: {stats.average.toFixed(3)} (range: -1 to 1)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Sentiment Examples */}
      <div>
        <h3 className="text-sm font-medium mb-3">Sentiment Examples</h3>
        <div className="space-y-3">
          {sentiments.slice(0, 5).map((sentiment, index) => (
            <Card 
              key={index}
              className={`p-3 border ${
                sentiment.label === 'Positive' ? 'border-green-100' :
                sentiment.label === 'Negative' ? 'border-red-100' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${
                    sentiment.label === 'Positive' ? 'bg-green-500' :
                    sentiment.label === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    sentiment.label === 'Positive' ? 'text-green-800' :
                    sentiment.label === 'Negative' ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    {sentiment.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Confidence: {(sentiment.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm mt-2 line-clamp-2">
                "{sentiment.text.substring(0, 120)}{sentiment.text.length > 120 ? '...' : ''}"
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Score: {sentiment.score.toFixed(3)}
                </span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      sentiment.label === 'Positive' ? 'bg-green-500' :
                      sentiment.label === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${Math.min(Math.abs(sentiment.score) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 