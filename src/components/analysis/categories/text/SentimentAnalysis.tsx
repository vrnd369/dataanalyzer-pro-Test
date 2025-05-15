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

  useEffect(() => {
    const analyzeSentiment = () => {
      try {
        // Base lexicon
        let positiveWords = new Set([
          'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
          'happy', 'pleased', 'delighted', 'love', 'awesome', 'best',
          'perfect', 'brilliant', 'outstanding', 'beautiful', 'helpful',
          'impressive', 'innovative', 'efficient', 'reliable', 'recommended',
          'satisfied', 'positive', 'success', 'successful', 'easy', 'enjoyed',
          'beneficial', 'exceptional', 'superb', 'remarkable', 'joy', 'like',
          'admire', 'pleasure', 'favorite', 'smooth', 'quick', 'fast'
        ]);

        let negativeWords = new Set([
          'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst',
          'sad', 'angry', 'upset', 'hate', 'disappointing', 'disappointed',
          'frustrating', 'useless', 'waste', 'difficult', 'confusing',
          'unreliable', 'inefficient', 'expensive', 'slow', 'broken',
          'failed', 'failure', 'problem', 'issue', 'bug', 'error',
          'complicated', 'annoying', 'inadequate', 'inferior', 'regret',
          'dislike', 'awful', 'unhappy', 'problematic', 'trouble', 'hard'
        ]);

        // Merge with custom lexicons if provided
        if (customLexicons?.positive) {
          customLexicons.positive.forEach(word => positiveWords.add(word.toLowerCase()));
        }
        if (customLexicons?.negative) {
          customLexicons.negative.forEach(word => negativeWords.add(word.toLowerCase()));
        }

        setLexiconInfo({
          positiveWords: positiveWords.size,
          negativeWords: negativeWords.size
        });

        // Analyze each text entry
        const textEntries = field.value as string[];
        if (!Array.isArray(textEntries)) {
          throw new Error('Input data must be an array of text entries');
        }

        const results: SentimentScore[] = textEntries.map(text => {
          if (typeof text !== 'string') return {
            score: 0,
            label: 'Neutral' as SentimentLabel,
            confidence: 0,
            text: String(text)
          };

          const cleanedText = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const words = cleanedText.split(/\s+/)
            .filter(word => word.length > 0);

          let positiveCount = 0;
          let negativeCount = 0;
          let sentimentWords = 0;

          // Count sentiment words with context awareness
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const prevWords = i > 0 ? words.slice(Math.max(0, i - 3), i) : [];
            
            // Check for negation patterns
            const isNegated = prevWords.some(w => 
              ['not', 'no', 'never', "don't", "doesn't", "didn't", "can't", "won't", "isn't"].includes(w)
            );

            // Check for intensifiers
            const isIntensified = prevWords.some(w => 
              ['very', 'extremely', 'absolutely', 'completely', 'totally', 'utterly'].includes(w)
            );

            // Check for sentiment words with context
            if (positiveWords.has(word)) {
              const count = isIntensified ? 2 : 1;
              isNegated ? negativeCount += count : positiveCount += count;
              sentimentWords += count;
            }
            if (negativeWords.has(word)) {
              const count = isIntensified ? 2 : 1;
              isNegated ? positiveCount += count : negativeCount += count;
              sentimentWords += count;
            }
          }

          // Calculate score normalized by text length
          const score = words.length === 0 ? 0 : 
            (positiveCount - negativeCount) / Math.max(words.length, 1);
          
          // Confidence based on proportion of sentiment words and score magnitude
          const sentimentRatio = sentimentWords / Math.max(words.length, 1);
          const confidence = Math.min(
            sentimentRatio * 2 + Math.abs(score) * 0.5,
            1
          );

          let label: SentimentLabel;
          if (words.length === 0 || Math.abs(score) < 0.05) {
            label = 'Neutral';
          } else {
            label = score > 0 ? 'Positive' : 'Negative';
          }

          return {
            score,
            label,
            confidence,
            text
          };
        });

        setSentiments(results);

        // Calculate statistics
        const positiveEntries = results.filter(r => r.label === 'Positive');
        const negativeEntries = results.filter(r => r.label === 'Negative');
        const neutralEntries = results.filter(r => r.label === 'Neutral');
        
        const positiveCount = positiveEntries.length;
        const negativeCount = negativeEntries.length;
        const neutralCount = neutralEntries.length;
        
        const averageScore = results.length > 0 ? 
          results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

        // Find strongest examples
        const strongestPositive = positiveEntries.length > 0 ?
          positiveEntries.reduce((max, current) => 
            (current.score > max.score) ? current : max
          ) as SentimentScore : null;
        
        const strongestNegative = negativeEntries.length > 0 ?
          negativeEntries.reduce((max, current) => 
            (current.score < max.score) ? current : max
          ) as SentimentScore : null;

        setStats({
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
          average: averageScore,
          strongestPositive,
          strongestNegative
        });

        setLoading(false);
      } catch (error) {
        console.error('Error analyzing sentiment:', error);
        setError('Failed to analyze sentiment. Please check your data format.');
        setLoading(false);
      }
    };

    analyzeSentiment();
  }, [field, customLexicons]);

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
          Ensure your data is an array of text strings. Received: {typeof field.value}
        </p>
      </div>
    );
  }

  const total = stats.positive + stats.negative + stats.neutral;
  const getPercentage = (value: number) => total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  // Sentiment emoji for average score
  const getSentimentEmoji = (score: number) => {
    if (score > 0.2) return '😊';
    if (score > 0.05) return '🙂';
    if (score < -0.2) return '😠';
    if (score < -0.05) return '😞';
    return '😐';
  };

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