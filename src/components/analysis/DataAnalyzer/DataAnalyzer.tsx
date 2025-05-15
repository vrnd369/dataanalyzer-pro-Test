import React, { useEffect } from 'react';
import { DataField, AnalyzedData } from '@/types/data';
import { Overview } from '@/components/analysis/DataAnalyzer/Overview';
import { StatisticalAnalysis } from '@/components/analysis/DataAnalyzer/StatisticalAnalysis';
import { Visualizations } from '@/components/analysis/DataAnalyzer/Visualizations';
import { Insights } from '@/components/analysis/DataAnalyzer/Insights';
import { useAnalysis } from '@/hooks/analysis';

interface DataAnalyzerProps {
  data: {
    fields: DataField[];
  };
}

export const DataAnalyzer: React.FC<DataAnalyzerProps> = ({ data }) => {
  const { isAnalyzing, error, results, analyze }: { isAnalyzing: boolean; error: Error | null; results: AnalyzedData | null; analyze: (fields: DataField[]) => void } = useAnalysis();

  useEffect(() => {
    analyze(data.fields);
  }, [data.fields, analyze]);

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Overview data={data} />
      <StatisticalAnalysis data={data} />
      <Visualizations data={data} />
      {results && <Insights analysis={results} />}
    </div>
  );
};