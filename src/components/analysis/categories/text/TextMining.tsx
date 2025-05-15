import { DataField } from '@/types/data';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TextMiningProps {
  field: DataField;
  onAnalysisComplete?: (stats: TextStats) => void;
}

interface TextStats {
  wordCount: number;
  charCount: number;
  avgWordLength: number;
  uniqueWords: number;
  lexicalDiversity: number;
  sentences: number;
  paragraphs: number;
  avgWordsPerSentence: number;
  topWords: Array<{ word: string; count: number }>;
  readabilityScore: number;
  readingTime: number;
  speakingTime: number;
  wordLengthDistribution: Record<string, number>;
  sentimentScore: number;
  keywordDensity: Record<string, number>;
}

export function TextMining({ field, onAnalysisComplete }: TextMiningProps) {
  const [stats, setStats] = useState<TextStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minWordLength, setMinWordLength] = useState(3);
  const [minWordFrequency, setMinWordFrequency] = useState(2);

  useEffect(() => {
    const analyzeText = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const texts = Array.isArray(field.value) ? field.value : [String(field.value)];
        const allText = texts.join('\n\n'); // Preserve paragraphs

        if (!allText.trim()) {
          throw new Error('No text content to analyze');
        }

        // Enhanced text cleaning with preservation of paragraph breaks
        const cleanText = allText
          .replace(/[^\w\s.!?''\-\n]/g, '') // Keep basic punctuation and apostrophes
          .replace(/\s+/g, ' ')
          .trim();

        // Split into paragraphs, sentences and words
        const paragraphs = allText.split(/\n+/).filter(p => p.trim().length > 0);
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);
        const chars = cleanText.replace(/\s+/g, '');

        if (words.length === 0) {
          throw new Error('No words found in the text');
        }

        // Calculate word frequencies with case insensitivity
        const wordFreq = new Map<string, number>();
        words.forEach(word => {
          const lowerWord = word.toLowerCase();
          wordFreq.set(lowerWord, (wordFreq.get(lowerWord) || 0) + 1);
        });

        // Enhanced stop words list
        const stopWords = new Set([
          'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'as', 'at', 
          'by', 'in', 'of', 'on', 'to', 'with', 'this', 'that', 'these', 'those', 'is', 
          'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
          'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must'
        ]);

        // Filter words based on user settings
        const filteredWords = Array.from(wordFreq.entries())
          .filter(([word, count]) => 
            !stopWords.has(word) && 
            word.length >= minWordLength && 
            count >= minWordFrequency
          );

        // Get top words sorted by frequency
        const topWords = filteredWords
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([word, count]) => ({ word, count }));

        // Calculate word length distribution with more granular categories
        const wordLengthDist: Record<string, number> = {};
        words.forEach(word => {
          const length = word.length;
          const category = length === 1 ? '1 letter' :
            length === 2 ? '2 letters' :
            length === 3 ? '3 letters' :
            length <= 5 ? '4-5 letters' :
            length <= 7 ? '6-7 letters' :
            length <= 10 ? '8-10 letters' :
            '11+ letters';
          wordLengthDist[category] = (wordLengthDist[category] || 0) + 1;
        });

        // Enhanced readability score (Flesch-Kincaid Reading Ease)
        const syllables = words.reduce((count, word) => {
          return count + countSyllables(word);
        }, 0);

        const readabilityScore = Math.max(0, Math.min(100, 
          206.835 - 1.015 * (words.length / Math.max(1, sentences.length)) - 
          84.6 * (syllables / words.length)
        ));

        // Calculate reading and speaking time (average reading speed: 200wpm, speaking: 150wpm)
        const readingTime = Math.ceil(words.length / 200); // in minutes
        const speakingTime = Math.ceil(words.length / 150); // in minutes

        // Basic sentiment analysis
        const positiveWords = ['happy', 'good', 'great', 'excellent', 'positive', 'success'];
        const negativeWords = ['bad', 'sad', 'terrible', 'awful', 'negative', 'failure'];
        
        let sentimentScore = 0;
        words.forEach(word => {
          const lowerWord = word.toLowerCase();
          if (positiveWords.includes(lowerWord)) sentimentScore += 1;
          if (negativeWords.includes(lowerWord)) sentimentScore -= 1;
        });
        sentimentScore = Math.max(-5, Math.min(5, sentimentScore));

        // Keyword density calculation (top 10%)
        const keywordDensity: Record<string, number> = {};
        const top10Percent = Math.ceil(wordFreq.size * 0.1);
        Array.from(wordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, top10Percent)
          .forEach(([word, count]) => {
            keywordDensity[word] = (count / words.length) * 100;
          });

        const result = {
          wordCount: words.length,
          charCount: chars.length,
          avgWordLength: parseFloat((chars.length / words.length).toFixed(2)),
          uniqueWords: wordFreq.size,
          lexicalDiversity: parseFloat(((wordFreq.size / words.length) * 100).toFixed(2)),
          sentences: sentences.length,
          paragraphs: paragraphs.length,
          avgWordsPerSentence: parseFloat((words.length / sentences.length).toFixed(2)),
          topWords,
          readabilityScore: parseFloat(readabilityScore.toFixed(1)),
          readingTime,
          speakingTime,
          wordLengthDistribution: wordLengthDist,
          sentimentScore,
          keywordDensity
        };

        setStats(result);
        onAnalysisComplete?.(result);
        setLoading(false);
      } catch (err) {
        console.error('Error in text mining:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze text');
        setLoading(false);
      }
    };

    // Add debounce to prevent rapid re-analysis
    const timer = setTimeout(() => {
      analyzeText();
    }, 500);

    return () => clearTimeout(timer);
  }, [field, minWordLength, minWordFrequency, onAnalysisComplete]);

  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (Post-graduate)';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 3) return 'Very Positive';
    if (score > 1) return 'Positive';
    if (score < -3) return 'Very Negative';
    if (score < -1) return 'Negative';
    return 'Neutral';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="text-sm text-gray-500">Analyzing text content...</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-2">{error}</div>
        <Button variant="outline" onClick={() => setLoading(true)}>
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center p-4 text-red-500">No analysis results available</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Analysis Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant={showAdvanced ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
        </div>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium mb-1 text-black">
                Minimum Word Length: {minWordLength}
              </label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[minWordLength]}
                onValueChange={([value]) => setMinWordLength(value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">
                Minimum Frequency: {minWordFrequency}
              </label>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[minWordFrequency]}
                onValueChange={([value]) => setMinWordFrequency(value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Word Count" 
          value={stats.wordCount} 
          description="Total words in the text"
        />
        <StatCard 
          title="Unique Words" 
          value={stats.uniqueWords} 
          secondaryValue={`${stats.lexicalDiversity}%`}
          description="Lexical diversity score"
        />
        <StatCard 
          title="Sentences" 
          value={stats.sentences} 
          description="Total sentences detected"
        />
        <StatCard 
          title="Paragraphs" 
          value={stats.paragraphs} 
          description="Paragraph breaks found"
        />
        <StatCard 
          title="Avg Word Length" 
          value={stats.avgWordLength} 
          unit="letters"
          description="Average characters per word"
        />
        <StatCard 
          title="Avg Sentence Length" 
          value={stats.avgWordsPerSentence} 
          unit="words"
          description="Words per sentence average"
        />
        <StatCard 
          title="Reading Time" 
          value={stats.readingTime} 
          unit="min"
          description="At 200 words per minute"
        />
        <StatCard 
          title="Speaking Time" 
          value={stats.speakingTime} 
          unit="min"
          description="At 150 words per minute"
        />
      </div>

      {/* Readability & Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-black">Readability Score</h4>
            <span className="text-xs text-black">
              {getReadabilityLevel(stats.readabilityScore)}
            </span>
          </div>
          <div className="space-y-2">
            <Progress value={stats.readabilityScore} className="h-2" />
            <div className="flex justify-between text-xs text-black">
              <span>0 (Very Difficult)</span>
              <span>100 (Very Easy)</span>
            </div>
            <div className="text-sm mt-2">
              <p className="text-black">
                This text is suitable for {getReadabilityLevel(stats.readabilityScore).split('(')[1].replace(')', '')} readers.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-black">Sentiment Analysis</h4>
            <span className="text-xs text-black">
              {getSentimentLabel(stats.sentimentScore)}
            </span>
          </div>
          <div className="space-y-2">
            <Progress 
              value={((stats.sentimentScore + 5) / 10) * 100} 
              className="h-2" 
            />
            <div className="flex justify-between text-xs text-black">
              <span>Negative</span>
              <span>Positive</span>
            </div>
            <div className="text-sm mt-2">
              <p className="text-black">
                The text appears to be {getSentimentLabel(stats.sentimentScore).toLowerCase()}.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Word Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-3">
            Word Length Distribution
          </h4>
          <div className="space-y-3">
            {Object.entries(stats.wordLengthDistribution)
              .sort(([a], [b]) => {
                const getOrder = (cat: string) => {
                  if (cat.includes('1')) return 1;
                  if (cat.includes('2')) return 2;
                  if (cat.includes('3')) return 3;
                  if (cat.includes('4-5')) return 4;
                  if (cat.includes('6-7')) return 5;
                  if (cat.includes('8-10')) return 6;
                  return 7;
                };
                return getOrder(a) - getOrder(b);
              })
              .map(([category, count]) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-black">{category}</span>
                    <span className="text-black">
                      {count} ({((count / stats.wordCount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(count / stats.wordCount) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-3">
            Most Common Words
          </h4>
          <div className="space-y-3">
            {stats.topWords.length > 0 ? (
              stats.topWords.map(({ word, count }) => (
                <div key={word} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">{word}</span>
                  <div className="flex items-center w-48">
                    <Progress 
                      value={(count / stats.topWords[0].count) * 100} 
                      className="h-2 mr-2" 
                    />
                    <span className="text-sm text-black w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-black py-4">
                No words match the current filters
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Advanced Metrics */}
      {showAdvanced && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-3">
            Keyword Density
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.keywordDensity)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([word, density]) => (
                <div key={word} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-black">{word}</div>
                  <div className="text-xs text-black">
                    {density.toFixed(2)}% of text
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper component for statistic cards
function StatCard({
  title,
  value,
  secondaryValue,
  unit,
  description
}: {
  title: string;
  value: number | string;
  secondaryValue?: string;
  unit?: string;
  description?: string;
}) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-black">
        {title}
      </h4>
      <div className="mt-2">
        <span className="text-2xl font-bold text-black">
          {value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </span>
        {secondaryValue && (
          <span className="text-sm text-black ml-2">
            {secondaryValue}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-black mt-1">{description}</p>
      )}
    </div>
  );
}

// Enhanced syllable counter
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 2) return 1;
  
  // Exception words
  const exceptions: Record<string, number> = {
    'simile': 3,
    'forever': 3,
    'shoreline': 2
  };
  
  if (exceptions[word]) return exceptions[word];
  
  // Remove silent 'e' and plurals
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  // Count vowel groups
  const syllables = word.match(/[aeiouy]{1,2}/g);
  
  // Adjust for certain endings
  if (word.endsWith('le') && word.length > 2 && !['a','e','i','o','u','y'].includes(word.charAt(word.length-3))) {
    return (syllables?.length || 0) + 1;
  }
  
  return syllables ? Math.max(1, syllables.length) : 1;
} 