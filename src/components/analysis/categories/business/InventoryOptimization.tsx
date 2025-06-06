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
  leadTime: number; // in days
  cost: number;
}

export function InventoryOptimization({ data }: InventoryOptimizationProps) {
  // Transform the input data into inventory items from CSV format
  const inventoryItems: InventoryItem[] = [];
  
  try {
    // Skip header row and process each data row
    for (let i = 1; i < data.fields.length; i++) {
      const row = data.fields[i].value;
      if (row.length >= 6) {
        inventoryItems.push({
          id: String(row[0]),
          name: String(row[1]),
          currentStock: Number(row[2]) || 0,
          optimalStock: Number(row[3]) || 0,
          leadTime: Number(row[4]) || 0,
          cost: Number(row[5]) || 0
        });
      }
    }
  } catch (error) {
    console.error('Error processing inventory data:', error);
  }

  // If no valid inventory items were found, show a message
  if (inventoryItems.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Inventory Optimization</h3>
        <p className="text-gray-500">No valid inventory data found. Please ensure your data contains the required fields in the correct format.</p>
      </Card>
    );
  }

  // Calculate inventory metrics
  const safeInventoryItems = inventoryItems.filter(item => 
    !isNaN(item.currentStock) && !isNaN(item.optimalStock) && item.optimalStock > 0
  );
  
  const totalItems = safeInventoryItems.length;
  const underStockedItems = safeInventoryItems.filter(item => item.currentStock < item.optimalStock).length;
  const overStockedItems = safeInventoryItems.filter(item => item.currentStock > item.optimalStock).length;
  const wellStockedItems = totalItems - underStockedItems - overStockedItems;

  // Calculate inventory health score (0-100)
  const healthScore = totalItems === 0 ? 0 : Math.round(
    (safeInventoryItems.reduce((sum, item) => {
      const ratio = item.optimalStock > 0 
        ? Math.min(item.currentStock / item.optimalStock, 1.5) 
        : 1;
      return sum + (ratio > 1 ? 2 - ratio : ratio);
    }, 0) / totalItems) * 50
  );

  // Prepare data for charts (limit to top 10 items for readability)
  const stockComparisonData = safeInventoryItems
    .slice(0, 10)
    .map(item => ({
      name: item.name.length > 12 ? `${item.name.substring(0, 10)}...` : item.name,
      Current: item.currentStock,
      Optimal: item.optimalStock,
    }));

  const totalInventoryValue = safeInventoryItems.reduce(
    (sum, item) => sum + (item.currentStock * item.cost), 0
  );
  const totalOptimalValue = safeInventoryItems.reduce(
    (sum, item) => sum + (item.optimalStock * item.cost), 0
  );
  const avgLeadTime = totalItems === 0 ? 0 : 
    Math.round(safeInventoryItems.reduce(
      (sum, item) => sum + item.leadTime, 0
    ) / totalItems);

  const highestStockItem = safeInventoryItems.length > 0 
    ? safeInventoryItems.reduce((max, item) => 
        item.currentStock > max.currentStock ? item : max, safeInventoryItems[0])
    : null;
  const lowestStockItem = safeInventoryItems.length > 0 
    ? safeInventoryItems.reduce((min, item) => 
        item.currentStock < min.currentStock ? item : min, safeInventoryItems[0])
    : null;
  const zeroOrNegativeStock = safeInventoryItems.filter(item => item.currentStock <= 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

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

      {/* Detailed Inventory Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-purple-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Total Inventory Value</h4>
          <p className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</p>
        </Card>
        <Card className="p-4 bg-indigo-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Total Optimal Value</h4>
          <p className="text-2xl font-bold">{formatCurrency(totalOptimalValue)}</p>
        </Card>
        <Card className="p-4 bg-pink-50 text-black">
          <h4 className="text-sm font-medium text-gray-500">Average Lead Time</h4>
          <p className="text-2xl font-bold">{avgLeadTime} days</p>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-green-100 text-black">
          <h4 className="text-sm font-medium text-gray-500">Highest Stock Item</h4>
          <p className="text-lg font-bold">{highestStockItem?.name || 'N/A'}</p>
          <p className="text-sm">Stock: {highestStockItem?.currentStock ?? 'N/A'}</p>
        </Card>
        <Card className="p-4 bg-red-100 text-black">
          <h4 className="text-sm font-medium text-gray-500">Lowest Stock Item</h4>
          <p className="text-lg font-bold">{lowestStockItem?.name || 'N/A'}</p>
          <p className="text-sm">Stock: {lowestStockItem?.currentStock ?? 'N/A'}</p>
        </Card>
      </div>
      {zeroOrNegativeStock.length > 0 && (
        <div className="mb-6">
          <Card className="p-4 bg-yellow-100 text-black">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Items with Zero or Negative Stock</h4>
            <ul className="list-disc list-inside">
              {zeroOrNegativeStock.map(item => (
                <li key={`zero-${item.id}`}>{item.name} (Stock: {item.currentStock})</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

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
        <h4 className="text-sm font-medium text-black mb-2">Current vs Optimal Stock Levels (Top 10)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={stockComparisonData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value, value === 'Current' ? 'Current Stock' : 'Optimal Stock']}
              labelFormatter={(label) => `Item: ${label}`}
            />
            <Bar 
              dataKey="Current" 
              name="Current Stock"
              fill="#8884d8" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="Optimal" 
              name="Optimal Stock"
              fill="#82ca9d" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Action Items */}
      <div>
        <h4 className="text-sm font-medium text-black mb-2">Recommended Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50">
            <h5 className="font-medium text-black mb-2">Items to Reorder ({safeInventoryItems
              .filter(item => item.currentStock < item.optimalStock * 0.8).length})</h5>
            <ul className="space-y-1 text-sm text-black">
              {safeInventoryItems
                .filter(item => item.currentStock < item.optimalStock * 0.8)
                .sort((a, b) => (a.currentStock / a.optimalStock) - (b.currentStock / b.optimalStock))
                .map(item => (
                  <li key={`order-${item.id}`} className="flex justify-between text-black">
                    <span className="text-black">{item.name}</span>
                    <span className="font-medium text-black">
                      {Math.ceil(item.optimalStock - item.currentStock)} units
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
          <Card className="p-4 bg-orange-50">
            <h5 className="font-medium text-black mb-2">Overstocked Items ({safeInventoryItems
              .filter(item => item.currentStock > item.optimalStock * 1.2).length})</h5>
            <ul className="space-y-1 text-sm text-black">
              {safeInventoryItems
                .filter(item => item.currentStock > item.optimalStock * 1.2)
                .sort((a, b) => (b.currentStock / b.optimalStock) - (a.currentStock / a.optimalStock))
                .map(item => (
                  <li key={`reduce-${item.id}`} className="flex justify-between text-black">
                    <span className="text-black">{item.name}</span>
                    <span className="font-medium text-black">
                      {Math.ceil(item.currentStock - item.optimalStock)} units
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Analyzed {safeInventoryItems.length} inventory items from {data.fields.length} data fields.
      </p>
    </Card>
  );
} 