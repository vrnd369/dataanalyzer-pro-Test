import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface TopicModelingProps {
  field: DataField;
}

interface Topic {
  id: number;
  keywords: string[];
  score: number;
  documents: number;
}

export function TopicModeling({ field }: TopicModelingProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeTopics = () => {
      try {
        const texts = field.value as string[];
        
        // Tokenize and clean texts
        const processedTexts = texts.map(text => 
          text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2)
        );

        // Calculate term frequencies
        const termFreq = new Map<string, number>();
        processedTexts.forEach(words => {
          const uniqueWords = new Set(words);
          uniqueWords.forEach(word => {
            termFreq.set(word, (termFreq.get(word) || 0) + 1);
          });
        });

        // Calculate IDF
        const docCount = texts.length;
        const idf = new Map<string, number>();
        termFreq.forEach((freq, term) => {
          const idfScore = Math.log(docCount / freq);
          idf.set(term, idfScore);
        });

        // Calculate TF-IDF scores
        const tfidfScores = new Map<string, number>();
        termFreq.forEach((freq, term) => {
          const tfidf = freq * (idf.get(term) || 0);
          tfidfScores.set(term, tfidf);
        });

        // Group terms into topics using simple clustering
        const topTerms = Array.from(tfidfScores.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50);

        const topicCount = Math.min(5, Math.ceil(topTerms.length / 5));
        const generatedTopics: Topic[] = [];

        for (let i = 0; i < topicCount; i++) {
          const startIdx = i * 5;
          const topicTerms = topTerms.slice(startIdx, startIdx + 5);
          const topicScore = topicTerms.reduce((sum, [_, score]) => sum + score, 0) / 5;
          
          // Count documents containing any of the topic terms
          const docMatches = texts.filter(text => 
            topicTerms.some(([term]) => text.toLowerCase().includes(term))
          ).length;

          generatedTopics.push({
            id: i + 1,
            keywords: topicTerms.map(([term]) => term),
            score: topicScore,
            documents: docMatches
          });
        }

        setTopics(generatedTopics);
        setLoading(false);
      } catch (error) {
        console.error('Error analyzing topics:', error);
        setLoading(false);
      }
    };

    analyzeTopics();
  }, [field]);

  if (loading) {
    return <div className="text-center p-4">Analyzing topics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map(topic => (
          <Card key={topic.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Topic {topic.id}</h4>
                <span className="text-sm text-gray-500">
                  Score: {topic.score.toFixed(2)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {topic.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600">
                  Found in {topic.documents} documents
                  ({((topic.documents / (field.value as string[]).length) * 100).toFixed(1)}%)
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${(topic.documents / (field.value as string[]).length) * 100}%`
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h4 className="font-semibold mb-3">Topic Distribution Overview</h4>
        <div className="space-y-2">
          {topics.map(topic => (
            <div key={topic.id} className="flex items-center space-x-2">
              <span className="w-20 text-sm">Topic {topic.id}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(topic.documents / (field.value as string[]).length) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {((topic.documents / (field.value as string[]).length) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 