import { DataField } from '@/types/data';
import { TextAnalysisMatrix } from './TextAnalysisMatrix';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TextMining } from './TextMining';
import { TextSummarization } from './TextSummarization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

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
        {textFields.map(field => (
          <Card key={field.name} className="mb-6">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Analysis for {field.name}</h3>
            </div>
            <div className="p-6">
              <Tabs defaultValue="matrix" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="matrix">Analysis Matrix</TabsTrigger>
                  <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
                  <TabsTrigger value="mining">Text Mining</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="matrix">
                  <TextAnalysisMatrix field={field} />
                </TabsContent>
                <TabsContent value="sentiment">
                  <SentimentAnalysis field={field} />
                </TabsContent>
                <TabsContent value="mining">
                  <TextMining field={field} />
                </TabsContent>
                <TabsContent value="summary">
                  <TextSummarization field={field} />
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 