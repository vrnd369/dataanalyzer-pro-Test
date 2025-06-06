import { DataField } from '@/types/data';
import { calculateFieldStats } from '../statistics/calculations';
import { calculateCorrelation } from '../statistics/correlation';

export async function performMLAnalysis(fields: DataField[]) {
  const numericFields = fields.filter(f => f.type === 'number');
  
  return numericFields.map(field => {
    const stats = calculateFieldStats(field);
    const correlations = numericFields
      .filter(f => f.name !== field.name)
      .map(otherField => ({
        field: otherField.name,
        correlation: calculateCorrelation(field.value as number[], otherField.value as number[])
      }));
    
    return {
      field: field.name,
      stats,
      correlations
    };
  });
} 