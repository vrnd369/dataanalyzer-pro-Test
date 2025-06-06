import { DataField } from '@/types/data';

export interface MLAnalysisResult {
  field: string;
  stats: {
    mean: number;
    standardDeviation: number;
    median: number;
  };
  correlations: Array<{
    field: string;
    correlation: number;
  }>;
}

export function performMLAnalysis(fields: DataField[]): Promise<MLAnalysisResult[]>; 