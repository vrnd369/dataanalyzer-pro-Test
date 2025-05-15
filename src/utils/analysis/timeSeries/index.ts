import { TimeSeriesResult } from './types';

// Re-export the TimeSeriesResult type
export type { TimeSeriesResult } from './types';

interface DataField {
  name: string;
  type: string;
  value: any;
}

export function convertFieldsToTimeSeriesData(fields: DataField[]): { timestamp: number; value: number; field: string }[] {
  const result: { timestamp: number; value: number; field: string }[] = [];
  
  // Find numeric fields
  const numericFields = fields.filter(f => f.type === 'number');
  
  // For each numeric field, create time series data points
  numericFields.forEach(field => {
    const values = field.value as number[];
    if (!values || !Array.isArray(values)) return;
    
    // Create data points with timestamps (using indices as timestamps)
    values.forEach((value, index) => {
      if (typeof value === 'number') {
        result.push({
          timestamp: index,
          value,
          field: field.name
        });
      }
    });
  });
  
  return result;
}

export function generateTimeSeriesResults(): TimeSeriesResult[] {
  // This is a placeholder that will be replaced by the ARIMA analysis
  // The actual implementation will be handled by the TimeSeriesAnalysis component
  return [];
} 