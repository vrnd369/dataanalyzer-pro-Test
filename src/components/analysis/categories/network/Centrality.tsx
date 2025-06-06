import { Card } from '../../../../components/ui/card';
import { useState, useEffect, useMemo } from 'react';
import { MultiDirectedGraph } from 'graphology';
import * as centrality from 'graphology-metrics/centrality';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';

// Types
export type CentralityAlgorithm = 'degree' | 'betweenness' | 'closeness';
export type GraphData = {
  nodes: Array<{ id: string; label?: string }>;
  edges: Array<{ source: string; target: string }>;
};

type NodeAttributes = {
  size?: number;
  label?: string;
  color?: string;
  [key: string]: any;
};

type EdgeAttributes = {
  [key: string]: any;
};

interface GraphMethods {
  addNode: (node: string, attributes?: NodeAttributes) => void;
  addEdge: (source: string, target: string, attributes?: EdgeAttributes) => void;
  setNodeAttribute: (node: string, attribute: string, value: any) => void;
  getNodeAttribute: (node: string, attribute: string) => any;
  mapNodes: <T>(callback: (node: string) => T) => T[];
}

type GraphType = MultiDirectedGraph<NodeAttributes, EdgeAttributes> & GraphMethods;

interface CentralityProps {
  graphData?: GraphData;
  isLoading?: boolean;
  onAlgorithmChange?: (algorithm: CentralityAlgorithm) => void;
}

export function Centrality({ graphData, isLoading = false, onAlgorithmChange }: CentralityProps) {
  const [centralityMetrics, setCentralityMetrics] = useState<Record<string, Record<string, number>> | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<CentralityAlgorithm>('degree');
  const [error, setError] = useState<string | null>(null);
  const [graphInstance, setGraphInstance] = useState<GraphType | null>(null);

  // Create graph instance when data changes
  useEffect(() => {
    if (!graphData) {
      setGraphInstance(null);
      return;
    }

    try {
      const graph = new MultiDirectedGraph<NodeAttributes, EdgeAttributes>() as GraphType;
      
      // Add nodes
      graphData.nodes.forEach(node => {
        graph.addNode(node.id, { ...node, size: 5, label: node.label || node.id });
      });
      
      // Add edges
      graphData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target, { ...edge });
      });
      
      setGraphInstance(graph);
      setError(null);
    } catch (err) {
      setError('Failed to process graph data. Please check your data format.');
      console.error('Graph processing error:', err);
    }
  }, [graphData]);

  // Calculate centrality metrics when algorithm or graph changes
  useEffect(() => {
    if (!graphInstance) {
      setCentralityMetrics(null);
      return;
    }

    try {
      let metrics: Record<string, Record<string, number>> = {};
      
      switch (selectedAlgorithm) {
        case 'degree':
          metrics.degree = centrality.degree(graphInstance);
          break;
        case 'betweenness':
          metrics.betweenness = centrality.betweenness(graphInstance);
          break;
        case 'closeness':
          metrics.closeness = centrality.closeness(graphInstance);
          break;
      }

      // Normalize values for visualization
      const maxValue = Math.max(...Object.values(metrics[selectedAlgorithm]));
      Object.keys(metrics[selectedAlgorithm]).forEach(node => {
        const value = metrics[selectedAlgorithm][node];
        graphInstance.setNodeAttribute(node, 'size', 5 + 15 * (value / maxValue));
        graphInstance.setNodeAttribute(node, 'color', getColorForValue(value / maxValue));
      });

      setCentralityMetrics(metrics);
      onAlgorithmChange?.(selectedAlgorithm);
    } catch (err) {
      setError(`Failed to calculate ${selectedAlgorithm} centrality.`);
      console.error('Centrality calculation error:', err);
    }
  }, [graphInstance, selectedAlgorithm, onAlgorithmChange]);

  const getColorForValue = (value: number): string => {
    // Heatmap from blue (low) to red (high)
    const hue = (1 - value) * 240; // 240 is blue, 0 is red
    return `hsl(${hue}, 100%, 50%)`;
  };

  interface TopNode {
    id: string;
    value: number;
    label: string;
  }

  const topNodes = useMemo(() => {
    if (!centralityMetrics || !graphInstance || !selectedAlgorithm) return [];
    
    const nodeValues = centralityMetrics[selectedAlgorithm];
    return graphInstance.mapNodes((node: string) => ({
      id: node,
      value: nodeValues[node],
      label: graphInstance.getNodeAttribute(node, 'label') || node
    })).sort((a: TopNode, b: TopNode) => b.value - a.value).slice(0, 5);
  }, [centralityMetrics, graphInstance, selectedAlgorithm]);

  const handleAlgorithmChange = (algorithm: CentralityAlgorithm) => {
    setSelectedAlgorithm(algorithm);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">Centrality Analysis</h3>
        {graphData && (
          <div className="flex space-x-2">
            <AlgorithmButton 
              active={selectedAlgorithm === 'degree'}
              onClick={() => handleAlgorithmChange('degree')}
            >
              Degree
            </AlgorithmButton>
            <AlgorithmButton 
              active={selectedAlgorithm === 'betweenness'}
              onClick={() => handleAlgorithmChange('betweenness')}
            >
              Betweenness
            </AlgorithmButton>
            <AlgorithmButton 
              active={selectedAlgorithm === 'closeness'}
              onClick={() => handleAlgorithmChange('closeness')}
            >
              Closeness
            </AlgorithmButton>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-600">Calculating centrality metrics...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 mb-4">{error}</div>
      ) : !graphData ? (
        <p className="text-gray-600">No graph data provided. Please upload a file to analyze.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 border rounded-lg overflow-hidden">
              {graphInstance && (
                <SigmaContainer graph={graphInstance}>
                  <ControlsContainer position="bottom-right">
                    <ZoomControl />
                    <FullScreenControl />
                  </ControlsContainer>
                </SigmaContainer>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Network Statistics</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard 
                  title="Nodes" 
                  value={graphData.nodes.length} 
                />
                <StatCard 
                  title="Edges" 
                  value={graphData.edges.length} 
                />
                <StatCard 
                  title="Density" 
                  value={(graphData.edges.length / (graphData.nodes.length * (graphData.nodes.length - 1))).toFixed(4)}
                />
              </div>
              
              <h4 className="font-medium text-gray-800 mb-3">Top Central Nodes ({selectedAlgorithm})</h4>
              <div className="space-y-2">
                {topNodes.map((node: TopNode, index: number) => (
                  <NodeCard 
                    key={node.id}
                    rank={index + 1}
                    node={node}
                    maxValue={topNodes[0]?.value || 1}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">About {selectedAlgorithm} Centrality</h4>
            <p className="text-sm text-gray-600">
              {selectedAlgorithm === 'degree' && (
                "Degree centrality measures how many connections a node has. Nodes with high degree are often 'hubs' in the network."
              )}
              {selectedAlgorithm === 'betweenness' && (
                "Betweenness centrality identifies nodes that act as bridges between different parts of the network."
              )}
              {selectedAlgorithm === 'closeness' && (
                "Closeness centrality measures how close a node is to all other nodes, identifying well-connected nodes."
              )}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

// Helper components
const AlgorithmButton = ({ 
  active, 
  children, 
  onClick 
}: { 
  active: boolean; 
  children: React.ReactNode; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm rounded-md ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-gray-50 p-3 rounded text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const NodeCard = ({ 
  rank, 
  node, 
  maxValue 
}: { 
  rank: number; 
  node: { id: string; label: string; value: number }; 
  maxValue: number 
}) => (
  <div className="flex items-center p-3 bg-white rounded border">
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium mr-3">
      {rank}
    </div>
    <div className="flex-1">
      <p className="font-medium">{node.label}</p>
      <p className="text-sm text-gray-500">{node.id}</p>
    </div>
    <div className="w-24">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500" 
          style={{ width: `${(node.value / maxValue) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-600 text-right mt-1">
        {node.value.toFixed(4)}
      </p>
    </div>
  </div>
); 