import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CustomerSegmentationProps {
  data: {
    fields: DataField[];
  };
}

interface CustomerSegment {
  id: string;
  name: string;
  value: number;
  color: string;
  avgPurchaseValue: number;
  purchaseFrequency: number;
  demographics: {
    ageRange: string;
    location: string;
  };
}

export function CustomerSegmentation({ data }: CustomerSegmentationProps) {
  // Sample customer segments - in a real app, this would come from props or API
  const segments: CustomerSegment[] = [
    { id: '1', name: 'Loyal Customers', value: 35, color: '#0088FE', avgPurchaseValue: 120, purchaseFrequency: 4.2, demographics: { ageRange: '35-50', location: 'Urban' } },
    { id: '2', name: 'New Customers', value: 25, color: '#00C49F', avgPurchaseValue: 65, purchaseFrequency: 1.8, demographics: { ageRange: '18-34', location: 'Urban' } },
    { id: '3', name: 'At-Risk Customers', value: 20, color: '#FFBB28', avgPurchaseValue: 85, purchaseFrequency: 0.5, demographics: { ageRange: '50-65', location: 'Suburban' } },
    { id: '4', name: 'High-Spenders', value: 15, color: '#FF8042', avgPurchaseValue: 210, purchaseFrequency: 3.5, demographics: { ageRange: '30-45', location: 'Urban' } },
    { id: '5', name: 'Infrequent Buyers', value: 5, color: '#8884D8', avgPurchaseValue: 45, purchaseFrequency: 0.3, demographics: { ageRange: '25-40', location: 'Rural' } },
  ];

  // Prepare data for charts
  const purchaseData = segments.map(segment => ({
    name: segment.name,
    avgPurchaseValue: segment.avgPurchaseValue,
    purchaseFrequency: segment.purchaseFrequency,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-6">Customer Segmentation Analysis</h3>
      
      {/* Segmentation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-black">
        {/* Pie Chart */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-4 text-center">Customer Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {segments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Purchase Behavior */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-4 text-center">Purchase Behavior</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={purchaseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgPurchaseValue" fill="#0088FE" name="Avg Purchase ($)" />
                <Bar yAxisId="right" dataKey="purchaseFrequency" fill="#FF8042" name="Purchases/Month" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Key Metrics */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-black mb-4 text-center">Segment Metrics</h4>
          <div className="space-y-4">
            {segments.map(segment => (
              <div key={`metrics-${segment.id}`} className="border-b pb-3 last:border-b-0">
                <h5 className="font-medium" style={{ color: segment.color }}>{segment.name}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <span className="text-gray-500">Avg Spend:</span> ${segment.avgPurchaseValue}
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span> {segment.purchaseFrequency}/mo
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span> {segment.demographics.ageRange}
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span> {segment.demographics.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-4 mb-4">
        <h4 className="text-sm font-medium text-black mb-3">Targeting Recommendations</h4>
        <ul className="space-y-2 text-sm text-black">
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0088FE] mt-1.5 mr-2 "></span>
            <div>
              <span className="font-medium text-black">Loyal Customers:</span> Reward with exclusive offers to maintain retention
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00C49F] mt-1.5 mr-2"></span>
            <div>
              <span className="font-medium text-black">New Customers:</span> Onboarding campaigns to increase purchase frequency
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FFBB28] mt-1.5 mr-2"></span>
            <div>
              <span className="font-medium text-black">At-Risk Customers:</span> Win-back campaigns with personalized offers
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FF8042] mt-1.5 mr-2"></span>
            <div>
              <span className="font-medium text-black">High-Spenders:</span> VIP treatment and early access to new products
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 rounded-full bg-[#8884D8] mt-1.5 mr-2"></span>
            <div>
              <span className="font-medium text-black">Infrequent Buyers:</span> Re-engagement campaigns with strong incentives
            </div>
          </li>
        </ul>
      </Card>

      <p className="text-sm text-gray-500">Analyzing {data.fields.length} data fields for segmentation.</p>
    </Card>
  );
} 