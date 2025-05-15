import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InventoryOptimizationProps {
  data: {
    fields: DataField[];
  };
}

interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  optimalStock: number;
  demand: number;
  leadTime: number; // in days
  cost: number;
}

export function InventoryOptimization({ data }: InventoryOptimizationProps) {
  // Sample inventory data - in a real app, this would come from props or API
  const inventoryItems: InventoryItem[] = [
    { id: '1', name: 'Widget A', currentStock: 150, optimalStock: 200, demand: 50, leadTime: 7, cost: 10 },
    { id: '2', name: 'Gadget B', currentStock: 75, optimalStock: 100, demand: 25, leadTime: 5, cost: 15 },
    { id: '3', name: 'Tool C', currentStock: 40, optimalStock: 60, demand: 10, leadTime: 3, cost: 20 },
    { id: '4', name: 'Part D', currentStock: 200, optimalStock: 150, demand: 30, leadTime: 10, cost: 5 },
  ];

  // Calculate inventory metrics
  const totalItems = inventoryItems.length;
  const underStockedItems = inventoryItems.filter(item => item.currentStock < item.optimalStock).length;
  const overStockedItems = inventoryItems.filter(item => item.currentStock > item.optimalStock).length;
  const wellStockedItems = totalItems - underStockedItems - overStockedItems;

  // Calculate inventory health score (0-100)
  const healthScore = Math.round(
    (inventoryItems.reduce((sum, item) => {
      const ratio = Math.min(item.currentStock / item.optimalStock, 1.5); // Cap at 150% to avoid skew
      return sum + (ratio > 1 ? 2 - ratio : ratio); // Penalize overstocking less than understocking
    }, 0) / totalItems) * 100
  );

  // Prepare data for charts
  const stockComparisonData = inventoryItems.map(item => ({
    name: item.name,
    Current: item.currentStock,
    Optimal: item.optimalStock,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Inventory Optimization</h3>
      
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
          <p className="text-2xl font-bold">{totalItems}</p>
        </Card>
        <Card className="p-4 bg-green-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Well Stocked</h4>
          <p className="text-2xl font-bold text-black">{wellStockedItems}</p>
        </Card>
        <Card className="p-4 bg-yellow-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Under Stocked</h4>
          <p className="text-2xl font-bold text-black">{underStockedItems}</p>
        </Card>
        <Card className="p-4 bg-red-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Over Stocked</h4>
          <p className="text-2xl font-bold text-black">{overStockedItems}</p>
        </Card>
      </div>

      {/* Health Score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-black">Inventory Health Score</h4>
          <span className={`text-lg font-bold ${
            healthScore > 80 ? 'text-green-600' : 
            healthScore > 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {healthScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              healthScore > 80 ? 'bg-green-600' : 
              healthScore > 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${healthScore}%` }}
          ></div>
        </div>
      </div>

      {/* Stock Comparison Chart */}
      <div className="h-64 mb-6">
        <h4 className="text-sm font-medium text-black mb-2">Current vs Optimal Stock Levels</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Current" fill="#8884d8" />
            <Bar dataKey="Optimal" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Action Items */}
      <div>
        <h4 className="text-sm font-medium text-black mb-2">Recommended Actions</h4>
        <ul className="space-y-2">
          {inventoryItems
            .filter(item => item.currentStock < item.optimalStock * 0.8)
            .map(item => (
              <li key={`order-${item.id}`} className="text-sm text-black">
                <span className="font-medium text-black">Order:</span> {Math.ceil(item.optimalStock - item.currentStock)} units of {item.name}
              </li>
            ))}
          {inventoryItems
            .filter(item => item.currentStock > item.optimalStock * 1.2)
            .map(item => (
              <li key={`reduce-${item.id}`} className="text-sm text-black">
                <span className="font-medium text-black">Reduce:</span> {Math.ceil(item.currentStock - item.optimalStock)} units of {item.name}
              </li>
            ))}
        </ul>
      </div>

      <p className="text-sm text-gray-500 mt-4">Analyzing {data.fields.length} data fields.</p>
    </Card>
  );
} 