import { DataField } from '@/types/data';

interface PatientOutcomeMetrics {
  successRate: number;
  readmissionRate: number;
  avgRecoveryTime: number;
  riskFactors: string[];
}

interface TreatmentEffectiveness {
  name: string;
  successRate: number;
  description?: string;
  outcomes: {
    successful: number;
    partial: number;
    unsuccessful: number;
  };
  recommendations: string[];
  insights?: string[];
  comparison?: {
    industryAvg: number;
    benchmark: number;
  };
}

interface PatientMetrics {
  avgLengthOfStay: number;
  readmissionRate: number;
  satisfactionScore: number;
  lengthOfStayTrend: number;
  readmissionTrend: number;
  satisfactionTrend: number;
  flowData: {
    date: string;
    volume: number;
  }[];
}

export class HealthcareAnalyzer {
  static analyzePatientOutcomes(fields: DataField[]): PatientOutcomeMetrics {
    const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
    const readmissions = fields.find(f => f.name.toLowerCase().includes('readmission'))?.value as number[];
    const recoveryTimes = fields.find(f => f.name.toLowerCase().includes('recovery'))?.value as number[];

    const successRate = outcomes ? 
      outcomes.filter(o => o.toLowerCase().includes('success')).length / outcomes.length : 0;

    const readmissionRate = readmissions ?
      readmissions.filter(r => r === 1).length / readmissions.length : 0;

    const avgRecoveryTime = recoveryTimes ?
      recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : 0;

    return {
      successRate,
      readmissionRate,
      avgRecoveryTime,
      riskFactors: this.identifyRiskFactors(fields)
    };
  }

  static analyzeTreatmentEffectiveness(fields: DataField[]): TreatmentEffectiveness[] {
    const treatments = fields.find(f => f.name.toLowerCase().includes('treatment'))?.value as string[];
    const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
    const sideEffects = fields.find(f => f.name.toLowerCase().includes('side_effects'))?.value as string[];

    const treatmentResults = new Map<string, { 
      success: number; 
      total: number; 
      effects: Set<string>;
      partial: number;
    }>();

    if (treatments && outcomes) {
      treatments.forEach((treatment, i) => {
        if (!treatmentResults.has(treatment)) {
          treatmentResults.set(treatment, { success: 0, total: 0, effects: new Set(), partial: 0 });
        }
        const result = treatmentResults.get(treatment)!;
        result.total++;
        if (outcomes[i].toLowerCase().includes('success')) {
          result.success++;
        } else if (outcomes[i].toLowerCase().includes('partial')) {
          result.partial++;
        }
        if (sideEffects?.[i]) {
          result.effects.add(sideEffects[i]);
        }
      });
    }

    return Array.from(treatmentResults.entries()).map(([treatment, data]) => ({
      name: treatment,
      successRate: data.success / data.total,
      description: `Treatment analysis for ${treatment}`,
      outcomes: {
        successful: data.success,
        partial: data.partial,
        unsuccessful: data.total - data.success - data.partial
      },
      recommendations: this.generateRecommendations(data),
      insights: Array.from(data.effects).map(effect => `Observed side effect: ${effect}`),
      comparison: {
        industryAvg: 0.75, // Default industry average
        benchmark: 0.90    // Default benchmark
      }
    }));
  }

  private static generateRecommendations(data: { success: number; total: number; effects: Set<string> }): string[] {
    const recommendations: string[] = [];
    const successRate = data.success / data.total;

    if (successRate < 0.7) {
      recommendations.push('Review and update treatment protocols');
      recommendations.push('Consider additional patient monitoring');
    }
    if (data.effects.size > 2) {
      recommendations.push('Evaluate side effect management strategies');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current treatment protocols');
    }

    return recommendations;
  }

  private static identifyRiskFactors(fields: DataField[]): string[] {
    const riskFactors: string[] = [];
    const outcomes = fields.find(f => f.name.toLowerCase().includes('outcome'))?.value as string[];
    
    fields.forEach(field => {
      if (field.type === 'number' && outcomes) {
        const values = field.value as number[];
        const correlation = this.calculateRiskCorrelation(values, outcomes);
        if (Math.abs(correlation) > 0.3) {
          riskFactors.push(
            `${field.name} (${correlation > 0 ? 'Positive' : 'Negative'} correlation: ${Math.abs(correlation).toFixed(2)})`
          );
        }
      }
    });

    return riskFactors;
  }

  private static calculateRiskCorrelation(values: number[], outcomes: string[]): number {
    const successValues = outcomes.map(o => o.toLowerCase().includes('success') ? 1 : 0);
    const meanX = values.reduce((a, b) => a + b, 0) / values.length;
    const meanY = successValues.reduce((a: number, b) => a + b, 0) / successValues.length;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < values.length; i++) {
      const diffX = values[i] - meanX;
      const diffY = successValues[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  static analyzePatientMetrics(fields: DataField[], timeRange?: string): PatientMetrics {
    const lengthOfStay = fields.find(f => f.name.toLowerCase().includes('length_of_stay'))?.value as number[] || [];
    const readmissions = fields.find(f => f.name.toLowerCase().includes('readmission'))?.value as number[] || [];
    const satisfaction = fields.find(f => f.name.toLowerCase().includes('satisfaction'))?.value as number[] || [];
    const dates = fields.find(f => f.name.toLowerCase().includes('date'))?.value as string[] || [];

    const filterByTimeRange = (values: any[]) => {
      if (!timeRange || !dates.length) return values;
      const [start, end] = timeRange.split(' to ').map(d => new Date(d));
      return values.filter((_, i) => {
        const date = new Date(dates[i]);
        return date >= start && date <= end;
      });
    };

    const filteredLengthOfStay = filterByTimeRange(lengthOfStay);
    const filteredReadmissions = filterByTimeRange(readmissions);
    const filteredSatisfaction = filterByTimeRange(satisfaction);
    const filteredDates = filterByTimeRange(dates);

    const avgLengthOfStay = filteredLengthOfStay.length > 0 ? 
      filteredLengthOfStay.reduce((a, b) => a + b, 0) / filteredLengthOfStay.length : 0;

    const readmissionRate = filteredReadmissions.length > 0 ? 
      filteredReadmissions.filter(r => r === 1).length / filteredReadmissions.length : 0;

    const satisfactionScore = filteredSatisfaction.length > 0 ? 
      filteredSatisfaction.reduce((a, b) => a + b, 0) / filteredSatisfaction.length : 0;

    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return 0;
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      return (secondAvg - firstAvg) / firstAvg;
    };

    const flowData = filteredDates.map((date, i) => ({
      date,
      volume: filteredLengthOfStay[i] || 0
    }));

    return {
      avgLengthOfStay,
      readmissionRate,
      satisfactionScore,
      lengthOfStayTrend: calculateTrend(filteredLengthOfStay),
      readmissionTrend: calculateTrend(filteredReadmissions),
      satisfactionTrend: calculateTrend(filteredSatisfaction),
      flowData
    };
  }
}