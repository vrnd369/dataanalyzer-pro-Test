import { useState, useMemo } from 'react';
import { DataField } from '@/types/data';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraphTheory } from './GraphTheory';
import { Centrality } from './Centrality';
import { CommunityDetection } from './CommunityDetection';
import { FunnelAnalysis } from './FunnelAnalysis';
import { CohortAnalysis } from './CohortAnalysis';
import { PathAnalysis } from './PathAnalysis';

interface NetworkAnalysisContainerProps {
  data: {
    fields: DataField[];
  };
}

export function NetworkAnalysisContainer({ data }: NetworkAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('graph-theory');
  
  // Process network data
  const networkData = useMemo(() => {
    // Extract fields that can be used for network analysis
    const numericFields = data.fields.filter(field => field.type === 'number');
    const categoricalFields = data.fields.filter(field => field.type === 'string');
    
    return {
      numericFields,
      categoricalFields,
      // Add more processed data as needed
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Network Analysis Header */}
      <div className="bg-blue-600 text-white px-4 py-2 text-lg font-semibold rounded-md flex items-center gap-2">
        Network Analysis
        <span className="text-sm font-normal">
          ({networkData.numericFields.length} numeric fields, {networkData.categoricalFields.length} categorical fields)
        </span>
      </div>
      
      <Card className="p-4">
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="graph-theory" className="text-black">Graph Theory</TabsTrigger>
              <TabsTrigger value="centrality" className="text-black">Centrality</TabsTrigger>
              <TabsTrigger value="community" className="text-black">Community</TabsTrigger>
              <TabsTrigger value="funnel" className="text-black">Funnel</TabsTrigger>
              <TabsTrigger value="cohort" className="text-black">Cohort</TabsTrigger>
              <TabsTrigger value="path" className="text-black">Path</TabsTrigger>
            </TabsList>
            
            <TabsContent value="graph-theory" className="mt-4">
              <GraphTheory />
            </TabsContent>
            
            <TabsContent value="centrality" className="mt-4">
              <Centrality />
            </TabsContent>
            
            <TabsContent value="community" className="mt-4">
              <CommunityDetection />
            </TabsContent>
            
            <TabsContent value="funnel" className="mt-4">
              <FunnelAnalysis />
            </TabsContent>
            
            <TabsContent value="cohort" className="mt-4">
              <CohortAnalysis />
            </TabsContent>
            
            <TabsContent value="path" className="mt-4">
              <PathAnalysis />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// The data prop is used to prepare network analysis data for the child components
// Child components will be updated to use this data in future implementations 