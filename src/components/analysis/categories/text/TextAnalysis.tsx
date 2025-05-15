import { useState, useEffect } from 'react';
import { DataField } from '@/types/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TextMining } from './TextMining';
import { TextSummarization } from './TextSummarization';

interface TextAnalysisProps {
  fields: DataField[];
}

export function TextAnalysis({ fields }: TextAnalysisProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Filter text fields and ensure they have values
  const textFields = fields.filter(f => {
    const isString = f.type === 'string';
    const hasValues = Array.isArray(f.value) && f.value.length > 0;
    const hasTextContent = hasValues && f.value.some(v => 
      typeof v === 'string' && v.trim().length > 0
    );
    return isString && hasValues && hasTextContent;
  });

  // Initialize with first text field if available
  useEffect(() => {
    if (selectedFields.length === 0 && textFields.length > 0) {
      setSelectedFields([textFields[0].name]);
    }
  }, [textFields]);

  if (textFields.length === 0) {
    return (
      <Alert>
        <AlertDescription className="text-black">
          No text fields found in the data. Please ensure your data includes fields of type 'string' with text content.
        </AlertDescription>
      </Alert>
    );
  }

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldName]);
    } else {
      setSelectedFields(prev => prev.filter(f => f !== fieldName));
    }
  };

  return (
    <div className="space-y-6">
      {/* Field Selection */}
      <Card className="bg-white">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">Text Analysis</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium text-black">Select Text Fields to Analyze</Label>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                {textFields.map(field => (
                  <div 
                    key={field.name}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Checkbox
                      id={field.name}
                      checked={selectedFields.includes(field.name)}
                      onCheckedChange={(checked) => handleFieldToggle(field.name, checked as boolean)}
                    />
                    <Label 
                      htmlFor={field.name}
                      className="cursor-pointer text-sm font-medium text-black"
                    >
                      {field.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {selectedFields.length > 0 && (
        <div className="space-y-6">
          {selectedFields.map(fieldName => {
            const field = textFields.find(f => f.name === fieldName);
            if (!field) return null;

            return (
              <Card key={fieldName} className="bg-white">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                  <h3 className="text-lg font-semibold">Analysis for {field.name}</h3>
                </div>
                <div className="p-6 text-black">
                  <Tabs defaultValue="sentiment" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="sentiment" className="text-black">Sentiment Analysis</TabsTrigger>
                      <TabsTrigger value="mining" className="text-black">Text Mining</TabsTrigger>
                      <TabsTrigger value="summary" className="text-black">Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sentiment" className="mt-4">
                      <SentimentAnalysis field={field} />
                    </TabsContent>

                    <TabsContent value="mining" className="mt-4">
                      <TextMining field={field} />
                    </TabsContent>

                    <TabsContent value="summary" className="mt-4">
                      <TextSummarization field={field} />
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 