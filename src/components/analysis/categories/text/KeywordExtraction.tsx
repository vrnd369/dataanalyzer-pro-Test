import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface KeywordExtractionProps {
  field: DataField;
}

interface Keyword {
  term: string;
  frequency: number;
  score: number;
}

export function KeywordExtraction({ field }: KeywordExtractionProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const extractKeywords = () => {
      try {
        // Get text content from field
        const textContent = field.value.join(' ').toLowerCase();
        
        // Remove common stop words and punctuation
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const words = textContent
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word));

        // Calculate word frequencies
        const frequencies: { [key: string]: number } = {};
        words.forEach(word => {
          frequencies[word] = (frequencies[word] || 0) + 1;
        });

        // Convert to array and sort by frequency
        const keywordArray: Keyword[] = Object.entries(frequencies)
          .map(([term, frequency]) => ({
            term,
            frequency,
            score: frequency / words.length
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 20); // Get top 20 keywords

        setKeywords(keywordArray);
        setLoading(false);
      } catch (error) {
        console.error('Error extracting keywords:', error);
        setLoading(false);
      }
    };

    extractKeywords();
  }, [field]);

  if (loading) {
    return <div className="text-center p-4">Analyzing keywords...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Top Keywords</h4>
          <div className="space-y-2">
            {keywords.slice(0, 10).map((keyword, index) => (
              <div key={keyword.term} className="flex justify-between items-center">
                <span className="text-sm">{index + 1}. {keyword.term}</span>
                <span className="text-sm text-gray-500">{keyword.frequency}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Keyword Statistics</h4>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Total Unique Keywords:</span>{' '}
              {keywords.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Most Frequent:</span>{' '}
              {keywords[0]?.term} ({keywords[0]?.frequency} occurrences)
            </div>
            <div className="text-sm">
              <span className="font-medium">Average Frequency:</span>{' '}
              {(keywords.reduce((sum, k) => sum + k.frequency, 0) / keywords.length).toFixed(2)}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Keyword Distribution</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map(keyword => (
            <span
              key={keyword.term}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              style={{
                fontSize: `${Math.max(0.75, Math.min(1.5, 0.75 + keyword.score * 5))}rem`
              }}
            >
              {keyword.term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 