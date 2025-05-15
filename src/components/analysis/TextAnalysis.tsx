import { DataField } from '@/types/data';
import { Brain } from 'lucide-react';
import { TextAnalysisMatrix } from './categories/text/TextAnalysisMatrix';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TextAnalysisProps {
  fields: DataField[];
}

export default function TextAnalysis({ fields }: TextAnalysisProps) {
  // Filter for text fields only
  const textFields = fields.filter(f => f.type === 'string');
  
  if (textFields.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-black-500">Text Analysis</h3>
        </div>
        <Alert>
          <AlertDescription>
            No text fields found in the data. Please ensure your data includes fields of type 'string'.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-black-500">Text Analysis</h3>
      </div>

      <div className="space-y-6">
        {textFields.map((field, index) => (
          <div key={`${field.name}-${index}`} className="bg-white rounded-lg border border-gray-200">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Analysis for {field.name}</h3>
            </div>
            <div className="p-4">
              <TextAnalysisMatrix field={field} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}