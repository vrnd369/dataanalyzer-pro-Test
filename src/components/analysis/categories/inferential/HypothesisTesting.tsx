import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HypothesisTest, performHypothesisTests } from '@/utils/analysis/statistics/hypothesis';
import { DataField } from '@/types/data';
import { formatNumber } from '@/utils/analysis/formatting';
import { AlertCircle } from 'lucide-react';

type TestType = 'mean' | 'variance' | 'proportion' | 'correlation';

interface HypothesisTestingProps {
  fields: DataField[];
  onTestComplete?: (results: HypothesisTest) => void;
}

const hypothesisTypes = [
  { value: 'mean' as TestType, label: 'Mean Test' },
  { value: 'variance' as TestType, label: 'Variance Test' },
  { value: 'proportion' as TestType, label: 'Proportion Test' },
  { value: 'correlation' as TestType, label: 'Correlation Test' }
];

export function HypothesisTesting({ fields, onTestComplete }: HypothesisTestingProps) {
  const [selectedField, setSelectedField] = useState<string>('');
  const [hypothesisType, setHypothesisType] = useState<TestType>('mean');
  const [alpha, setAlpha] = useState<number>(0.05);
  const [results, setResults] = useState<HypothesisTest | null>(null);
  const [error, setError] = useState<string>('');

  const numericFields = fields.filter(field => field.type === 'number');

  const handleTest = () => {
    try {
      if (!selectedField) {
        throw new Error('Please select a field to test');
      }

      const field = fields.find(f => f.name === selectedField);
      if (!field) {
        throw new Error('Selected field not found');
      }

      const result = performHypothesisTests(field, hypothesisType, alpha);
      setResults(result);
      setError('');
      
      if (onTestComplete) {
        onTestComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Select Field</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger>
              <SelectValue placeholder="Choose field" />
            </SelectTrigger>
            <SelectContent>
              {numericFields.map(field => (
                <SelectItem key={field.name} value={field.name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Test Type</Label>
          <Select 
            value={hypothesisType} 
            onValueChange={(value: TestType) => setHypothesisType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              {hypothesisTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Significance Level (α)</Label>
          <Select value={alpha.toString()} onValueChange={(value) => setAlpha(parseFloat(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose alpha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.01">1% (0.01)</SelectItem>
              <SelectItem value="0.05">5% (0.05)</SelectItem>
              <SelectItem value="0.10">10% (0.10)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleTest} 
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        disabled={!selectedField}
      >
        Run Hypothesis Test
      </Button>

      {results && (
        <div className="mt-6 space-y-4">
          {error ? (
            <div className="flex items-start gap-2 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <Card className="p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Test Statistic</Label>
                    <p className="text-lg font-medium">{formatNumber(results.statistic)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">P-Value</Label>
                    <p className="text-lg font-medium">{results.pValue.toFixed(4)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Critical Value</Label>
                    <p className="text-lg font-medium">{results.criticalValue.toFixed(4)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Decision</Label>
                    <p className="text-lg font-medium text-blue-600">
                      {results.pValue < alpha ? 'Reject H₀' : 'Fail to Reject H₀'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-gray-600">Interpretation</Label>
                  <p className="mt-1 text-gray-700">{results.interpretation}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 