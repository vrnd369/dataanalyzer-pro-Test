export interface TimeSeriesResult {
  field: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: number | null;
  forecast: number[];
  confidence: number;
  components: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  // Additional metadata fields
  analysisMethod?: string;
  analysisParams?: any;
  timestamp?: string;
} 