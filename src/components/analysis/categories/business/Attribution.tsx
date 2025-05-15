import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AttributionProps {
  data: {
    fields: DataField[];
  };
}

// Helper function to calculate attribution metrics
const calculateAttributionMetrics = (fields: DataField[]) => {
  return fields.map(field => ({
    name: field.name,
    contribution: Math.random() * 100, // Replace with actual calculation
    correlation: Math.random(), // Replace with actual calculation
    importance: Math.random() * 10, // Replace with actual calculation
  }));
};

export function Attribution({ data }: AttributionProps) {
  const fieldCount = data.fields.length;
  const metrics = calculateAttributionMetrics(data.fields);
  
  // Sort by importance for display
  const sortedMetrics = [...metrics].sort((a, b) => b.importance - a.importance);
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Attribution Analysis</h3>
      
      {fieldCount > 0 ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Key Drivers</h4>
              <p className="text-1xl font-bold text-black mt-2">
                {sortedMetrics.slice(0, 3).map(m => m.name).join(', ')}
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Avg. Contribution</h4>
              <p className="text-1xl font-bold text-black mt-2">
                {Math.round(metrics.reduce((sum, m) => sum + m.contribution, 0) / metrics.length)}%
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-medium text-gray-500">Top Correlation</h4>
              <p className="text-1xl font-bold text-black mt-2">
                {Math.max(...metrics.map(m => m.correlation)).toFixed(2)}
              </p>
            </Card>
          </div>
          
          {/* Bar Chart Visualization */}
          <div className="h-64">
            <h4 className="text-md font-medium text-black mb-2">Feature Contribution</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedMetrics.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="contribution" fill="#8884d8" name="Contribution (%)" />
                <Bar dataKey="importance" fill="#82ca9d" name="Importance Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detailed Table */}
          <div>
            <h4 className="text-md font-medium text-black mb-2">Detailed Attribution Metrics</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Correlation</TableHead>
                  <TableHead className="text-right">Importance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetrics.map((metric) => (
                  <TableRow key={metric.name}>
                    <TableCell className="font-medium text-black">{metric.name}</TableCell>
                    <TableCell className="text-right text-black">{metric.contribution.toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-black">{metric.correlation.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-black">{metric.importance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No data fields available for attribution analysis.</p>
      )}
      
      <p className="text-sm text-gray-500 mt-4">Analyzing {fieldCount} data fields.</p>
    </Card>
  );
} 