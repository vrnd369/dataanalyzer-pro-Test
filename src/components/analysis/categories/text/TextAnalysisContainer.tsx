import { TextAnalysis } from './TextAnalysis';
import { DataField } from '@/types/data';

interface TextAnalysisContainerProps {
  fields: DataField[];
}

export function TextAnalysisContainer({ fields }: TextAnalysisContainerProps) {
  // Debug logging
  console.log('TextAnalysisContainer - Received fields:', fields);

  const textFields = fields.filter(f => f.type === 'string');
  console.log('TextAnalysisContainer - Text fields:', textFields);

  if (textFields.length === 0) {
    console.log('TextAnalysisContainer - No text fields found');
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-black">
          No text fields available for analysis. Please ensure your data contains text/string fields.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Text Analysis Header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        Text Analysis
      </div>
      
      <div className="container mx-auto text-black">
        <TextAnalysis fields={textFields} />
      </div>
    </div>
  );
} 