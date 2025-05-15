import { DataField } from '@/types/data';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { TextMining } from './TextMining';
// import { SentimentAnalysis } from './SentimentAnalysis';

interface TextAnalysisMatrixProps {
  field: DataField;
}

interface AnalysisMetrics {
  basic: {
    wordCount: number;
    charCount: number;
    uniqueWords: number;
    sentences: number;
    readingTime: number;
  };
  complexity: {
    avgWordLength: number;
    avgWordsPerSentence: number;
    readabilityScore: number;
    mostFrequentWord: string;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    average: number;
  };
  distribution: {
    wordLength: Record<string, number>;
    topWords: Array<{ word: string; count: number }>;
  };
}

export function TextAnalysisMatrix({ field }: TextAnalysisMatrixProps) {
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeText = () => {
      try {
        const texts = field.value as string[];
        const allText = texts.join(' ');

        // Basic text cleaning
        const cleanText = allText.toLowerCase()
          .replace(/[^\w\s.!?]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Split into sentences and words
        const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);
        const chars = cleanText.replace(/\s+/g, '');

        // Calculate word frequencies
        const wordFreq = new Map<string, number>();
        words.forEach(word => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });

        // Get top words (excluding common stop words)
        const stopWords = new Set([
          'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
          'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
          'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
          'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
        ]);

        const topWords = Array.from(wordFreq.entries())
          .filter(([word]) => !stopWords.has(word))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));

        // Find most frequent word
        const mostFrequentWord = topWords[0]?.word || '';

        // Calculate word length distribution
        const wordLengthDist: Record<string, number> = {};
        words.forEach(word => {
          const length = word.length;
          const category = length <= 3 ? 'Short (1-3)'
            : length <= 6 ? 'Medium (4-6)'
            : length <= 9 ? 'Long (7-9)'
            : 'Very Long (10+)';
          wordLengthDist[category] = (wordLengthDist[category] || 0) + 1;
        });

        // Calculate readability score (simplified Flesch-Kincaid)
        const syllables = words.reduce((count, word) => {
          return count + countSyllables(word);
        }, 0);

        const readabilityScore = 206.835 - 1.015 * (words.length / sentences.length)
          - 84.6 * (syllables / words.length);

        // Calculate reading time (assuming average reading speed of 200 words per minute)
        const readingTime = Number((words.length / 200).toFixed(1));

        // Calculate sentiment distribution
        const sentimentWords = {
          positive: new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'best', 'perfect']),
          negative: new Set(['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'sad', 'hate', 'disappointing'])
        };

        let positiveCount = 0;
        let negativeCount = 0;
        words.forEach(word => {
          if (sentimentWords.positive.has(word)) positiveCount++;
          if (sentimentWords.negative.has(word)) negativeCount++;
        });

        const totalSentiment = positiveCount + negativeCount;
        const sentiment = {
          positive: totalSentiment > 0 ? (positiveCount / totalSentiment) * 100 : 0,
          negative: totalSentiment > 0 ? (negativeCount / totalSentiment) * 100 : 0,
          neutral: totalSentiment > 0 ? ((totalSentiment - positiveCount - negativeCount) / totalSentiment) * 100 : 100,
          average: totalSentiment > 0 ? ((positiveCount - negativeCount) / totalSentiment) * 100 : 0
        };

        setMetrics({
          basic: {
            wordCount: words.length,
            charCount: chars.length,
            uniqueWords: new Set(words).size,
            sentences: sentences.length,
            readingTime
          },
          complexity: {
            avgWordLength: Number((chars.length / words.length).toFixed(2)),
            avgWordsPerSentence: Number((words.length / sentences.length).toFixed(2)),
            readabilityScore: Number(readabilityScore.toFixed(2)),
            mostFrequentWord
          },
          sentiment,
          distribution: {
            wordLength: wordLengthDist,
            topWords
          }
        });
      } catch (error) {
        console.error('Error analyzing text:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeText();
  }, [field]);

  if (loading) {
    return <div>Analyzing text...</div>;
  }

  if (!metrics) {
    return <div>No text data available for analysis.</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Metrics</TabsTrigger>
          <TabsTrigger value="complexity">Complexity</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Word Count</h4>
                <p className="text-2xl">{metrics.basic.wordCount}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Character Count</h4>
                <p className="text-2xl">{metrics.basic.charCount}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Unique Words</h4>
                <p className="text-2xl">{metrics.basic.uniqueWords}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Sentences</h4>
                <p className="text-2xl">{metrics.basic.sentences}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Reading Time</h4>
                <p className="text-2xl">{metrics.basic.readingTime} min</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="complexity">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Average Word Length</h4>
                <p className="text-2xl">{metrics.complexity.avgWordLength}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Words per Sentence</h4>
                <p className="text-2xl">{metrics.complexity.avgWordsPerSentence}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Readability Score</h4>
                <p className="text-2xl">{metrics.complexity.readabilityScore}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Most Frequent Word</h4>
                <p className="text-2xl">{metrics.complexity.mostFrequentWord}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Positive</h4>
                <p className="text-2xl">{metrics.sentiment.positive.toFixed(1)}%</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Negative</h4>
                <p className="text-2xl">{metrics.sentiment.negative.toFixed(1)}%</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Neutral</h4>
                <p className="text-2xl">{metrics.sentiment.neutral.toFixed(1)}%</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Average Sentiment</h4>
                <p className="text-2xl">{metrics.sentiment.average.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="p-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Word Length Distribution</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(metrics.distribution.wordLength).map(([category, count]) => (
                    <div key={category}>
                      <h5 className="text-sm text-gray-600">{category}</h5>
                      <p className="text-xl">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Top Words</h4>
                <div className="grid grid-cols-2 gap-4">
                  {metrics.distribution.topWords.map(({ word, count }) => (
                    <div key={word}>
                      <h5 className="text-sm text-gray-600">{word}</h5>
                      <p className="text-xl">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
} 