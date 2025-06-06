import { DataField } from '@/types/data';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeywordExtraction } from './KeywordExtraction';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TextMining } from './TextMining';
import { TopicModeling } from './TopicModeling';
import { TextSummarization } from './TextSummarization';

interface TextOutputAnalysisProps {
  field: DataField;
}

export function TextOutputAnalysis({ field }: TextOutputAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">Analysis for {field.name}</h3>
      </div>
      
      <Card className="p-4">
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="mining">Text Mining</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="mt-4">
            <KeywordExtraction field={field} />
          </TabsContent>

          <TabsContent value="sentiment" className="mt-4">
            <SentimentAnalysis field={field} />
          </TabsContent>

          <TabsContent value="mining" className="mt-4">
            <TextMining field={field} />
          </TabsContent>

          <TabsContent value="topics" className="mt-4">
            <TopicModeling field={field} />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <TextSummarization field={field} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 