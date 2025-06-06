import React from 'react';
import { Brain, Calculator, TrendingUp, BarChart, TestTube, LineChart, Bot, FileText, Timer, Globe, Network, Briefcase, Cpu } from 'lucide-react';
import { DataField } from '@/types/data';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnalysisEngine } from '@/utils/analysis/core/AnalysisEngine';
import { IndustryAnalysisView } from './categories/industry';
import { MLAnalysisView } from './categories/ml/MLAnalysisView';
import { TechnicalAnalysis } from './categories/technical';
import { NLPAnalysisContainer } from './categories/nlp';

interface AnalysisCategoriesProps {
  data: {
    fields: DataField[];
  };
}

function AnalysisCategories({ data }: AnalysisCategoriesProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');
  const [state, setState] = React.useState<{
    isAnalyzing: boolean;
    error: Error | null;
    results: Record<string, any>;
    selectedCategory: string | null;
  }>({
    isAnalyzing: false,
    error: null,
    results: {},
    selectedCategory: currentCategory
  });

  const handleCategorySelect = React.useCallback(async (categoryId: string) => {
    // Remove ML category mute condition
    if (categoryId === state.selectedCategory) {
      setState(prev => ({ ...prev, selectedCategory: null }));
      navigate('/analysis', { replace: true });
      return;
    }

    try {
      // Check if data exists
      if (!data || !data.fields || data.fields.length === 0) {
        throw new Error('Please upload data before running analysis');
      }

      // Special handling for industry analysis
      if (categoryId === 'industry') {
        setState(prev => ({ 
          ...prev, 
          selectedCategory: categoryId 
        }));
        navigate(`/analysis?category=${categoryId}`, {
          replace: true
        });
        return;
      }

      // Validate category requirements with user-friendly messages
      const numericFields = data.fields.filter(f => f.type === 'number');
      const textFields = data.fields.filter(f => f.type === 'string');
      
      switch (categoryId) {
        case 'descriptive':
        case 'visualization':
          if (numericFields.length === 0) {
            throw new Error('This analysis requires numeric data. Please upload a file containing numeric columns.');
          }
          break;
        case 'correlation':
        case 'regression':
        case 'ml':
          if (numericFields.length < 2) {
            throw new Error('This analysis requires at least two numeric columns. Please upload appropriate data.');
          }
          break;
        case 'text':
          if (textFields.length === 0) {
            throw new Error('This analysis requires text data. Please upload a file containing text columns.');
          }
          break;
      }

      setState(prev => ({ 
        ...prev, 
        isAnalyzing: true, 
        error: null,
        selectedCategory: categoryId 
      }));

      // Initialize analysis engine for this category
      const engine = new AnalysisEngine(data.fields);
      const results = await engine.analyze(categoryId);

      if (!results) {
        throw new Error('Analysis produced no results. Please try again with different data.');
      }

      // Store results and navigate
      setState(prev => ({
        ...prev,
        results: { ...prev.results, [categoryId]: results },
        isAnalyzing: false
      }));

      navigate(`/analysis?category=${categoryId}`, {
        replace: true,
        state: { 
          results,
          category: categoryId,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error : new Error('Analysis failed')
      }));
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      alert(errorMessage);
    }
  }, [data, navigate, state.selectedCategory]);

  const categories = [
    {
      id: 'descriptive',
      name: 'Basic Statistics',
      icon: Calculator,
      description: 'Mean, median, mode, variance, standard deviation',
      available: data.fields.some(f => f.type === 'number')
    },
    {
      id: 'visualization',
      name: 'Visualizations',
      icon: BarChart,
      description: 'Charts, graphs, and interactive visualizations',
      available: data.fields.some(f => f.type === 'number')
    },
    {
      id: 'correlation',
      name: 'Correlation Analysis',
      icon: TrendingUp,
      description: 'Relationships between variables',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'hypothesis',
      name: 'Hypothesis Testing',
      icon: TestTube,
      description: 'Statistical significance and confidence intervals',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'regression',
      name: 'Regression Analysis',
      icon: LineChart,
      description: 'Linear and multiple regression models',
      available: data.fields.filter(f => f.type === 'number').length >= 2
    },
    {
      id: 'ml',
      name: 'Machine Learning',
      icon: Bot,
      description: 'Predictive modeling and pattern recognition',
      available: data.fields.filter(f => f.type === 'number').length >= 2,
      component: MLAnalysisView
    },
    {
      id: 'text',
      name: 'Text Analysis',
      icon: FileText,
      description: 'Text mining and sentiment analysis',
      available: data.fields.filter(f => f.type === 'string').length > 0
    },
    {
      id: 'time',
      name: 'Time Series',
      icon: Timer,
      description: 'Temporal patterns and forecasting',
      available: data.fields.some(f => 
        f.type === 'date' || 
        (f.type === 'number' && f.value.length >= 10)
      )
    },
    {
      id: 'spatial',
      name: 'Spatial Analysis',
      icon: Globe,
      description: 'Geographic and location-based analysis',
      available: data.fields.some(f => 
        f.name.toLowerCase().includes('location') ||
        f.name.toLowerCase().includes('lat') ||
        f.name.toLowerCase().includes('lon')
      )
    },
    {
      id: 'business',
      name: 'Business Metrics',
      icon: LineChart,
      description: 'KPIs, ratios, and financial analysis',
      available: data.fields.some(f => 
        f.name.toLowerCase().includes('revenue') ||
        f.name.toLowerCase().includes('profit') ||
        f.name.toLowerCase().includes('sales') ||
        f.name.toLowerCase().includes('cost')
      )
    },
    {
      id: 'network',
      name: 'Network Analysis',
      icon: Network,
      description: 'Graph analysis and relationships',
      available: data.fields.filter(f => 
        f.name.toLowerCase().includes('id') ||
        f.name.toLowerCase().includes('source') ||
        f.name.toLowerCase().includes('target')
      ).length >= 2
    },
    {
      id: 'industry',
      name: 'Industry Analysis',
      icon: Briefcase,
      description: 'Industry-specific analytics and insights',
      available: true,
      component: IndustryAnalysisView
    },
    {
      id: 'technical',
      name: 'Technical Analysis',
      icon: Cpu,
      description: 'System performance, data quality, and processing efficiency',
      available: true,
      component: TechnicalAnalysis
    },
    {
      id: 'nlp',
      name: 'Natural Language Processing',
      icon: Bot,
      description: 'Text understanding, question answering, and language insights',
      available: data.fields.filter(f => f.type === 'string').length > 0,
      component: NLPAnalysisContainer
    }
  ];

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold text-black">Analysis Categories</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            disabled={!category.available || state.isAnalyzing}
            className={`p-4 rounded-lg text-left transition-all duration-300 relative overflow-hidden ${
              category.available
                ? `hover:bg-white/5 cursor-pointer border border-black/10 ${
                    currentCategory === category.id ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/20' : ''
                  }`
                : 'opacity-30 cursor-not-allowed bg-white/5 border border-black/5'
            }`}
          >
            {state.isAnalyzing && currentCategory === category.id && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500 border-t-transparent"></div>
              </div>
            )}
            {currentCategory === category.id && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50" />
            )}
            <div className="flex items-center gap-2 mb-2">
              <category.icon className={`w-5 h-5 ${
                category.available ? 'text-teal-400' : 'text-gray-400'
              }`} />
              <h4 className="font-medium text-black">{category.name}</h4>
            </div>
            <p className="text-sm text-black">{category.description}</p>
          </button>
        ))}
      </div>

      {/* Render selected category component */}
      {currentCategory && currentCategory !== 'ml' && (
        <div className="mt-8">
          {(() => {
            const category = categories.find(c => c.id === currentCategory);
            if (!category || !category.component) return null;
            const Component = category.component;
            return <Component data={data} analysis={state.results[currentCategory]} />;
          })()}
        </div>
      )}
    </div>
  );
}

export { AnalysisCategories };