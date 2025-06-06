import { MessageSquare, Tag, FileText, Smile, Frown, Meh } from 'lucide-react';

interface NLPInsightsProps {
  sentiment: {
    score: number;
    label: string;
    confidence: number;
  };
  keywords: {
    text: string;
    relevance: number;
  }[];
  summary: string;
  categories: {
    label: string;
    confidence: number;
  }[];
  loading?: boolean;
  error?: string | null;
}

export default function NLPInsights({ 
  sentiment, 
  keywords, 
  summary, 
  categories, 
  loading = false, 
  error = null 
}: NLPInsightsProps) {
  const getSentimentColor = () => {
    switch (sentiment.label) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment.label) {
      case 'positive':
        return <Smile className={`w-5 h-5 ${getSentimentColor()}`} />;
      case 'negative':
        return <Frown className={`w-5 h-5 ${getSentimentColor()}`} />;
      default:
        return <Meh className={`w-5 h-5 ${getSentimentColor()}`} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Analyzing Content...</h3>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Analysis Error</h3>
        </div>
        <p className="text-red-500">{error}</p>
        <p className="text-gray-600 text-sm mt-2">Please try again or check your input.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">Text Analysis Insights</h3>
      </div>

      <div className="space-y-6">
        {/* Sentiment Analysis */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-700">Sentiment Analysis</h4>
            <div className="flex items-center gap-1">
              {getSentimentIcon()}
              <span className={`text-sm font-medium ${getSentimentColor()}`}>
                {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    sentiment.label === 'positive' ? 'bg-green-500' :
                    sentiment.label === 'negative' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(5, sentiment.confidence * 100))}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {Math.round(sentiment.confidence * 100)}% confidence
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            Score: {sentiment.score.toFixed(2)} (range: -1 to 1)
          </p>
        </div>

        {/* Keywords */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            Key Terms
          </h4>
          <div className="flex flex-wrap gap-2">
            {keywords
              .sort((a, b) => b.relevance - a.relevance)
              .map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center"
                  title={`Relevance: ${(keyword.relevance * 100).toFixed(0)}%`}
                >
                  {keyword.text}
                  <span className="text-indigo-400 text-xs ml-1">
                    {(keyword.relevance * 100).toFixed(0)}%
                  </span>
                </span>
              ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Summary
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Content Categories</h4>
            <div className="flex flex-wrap gap-2">
              {categories
                .sort((a, b) => b.confidence - a.confidence)
                .map((category, index) => (
                  <div 
                    key={index} 
                    className="relative group"
                    title={`Confidence: ${(category.confidence * 100).toFixed(0)}%`}
                  >
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center">
                      {category.label}
                      <span className="text-gray-400 text-xs ml-1">
                        {(category.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                      Confidence: {(category.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 