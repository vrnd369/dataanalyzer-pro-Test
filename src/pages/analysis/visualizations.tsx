import { Visualizations } from '@/components/analysis/Visualizations';
import { useAnalysis } from '@/hooks/useAnalysis';

export function VisualizationsPage() {
  const { results } = useAnalysis();

  if (!results) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Visualizations</h1>
        <p className="text-gray-600">Please upload data to view visualizations.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Visualizations</h1>
      <Visualizations data={results} />
    </div>
  );
} 