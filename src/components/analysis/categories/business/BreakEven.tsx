import { Card } from '../../../ui/card';
import type { DataField } from '../../../../types/data';
import { Label } from '../../../ui/label';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface BreakEvenProps {
  data: {
    fields: DataField[];
  };
  onClose?: () => void;
}

interface BreakEvenData {
  fixedCosts: number;
  variableCostsPerUnit: number;
  pricePerUnit: number;
  expectedUnits?: number;
}

export function BreakEven({ data, onClose }: BreakEvenProps) {
  const [inputs, setInputs] = useState<BreakEvenData>({
    fixedCosts: 10000,
    variableCostsPerUnit: 5,
    pricePerUnit: 15,
    expectedUnits: 1500,
  });

  const [breakEvenPoint, setBreakEvenPoint] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [profitAtExpected, setProfitAtExpected] = useState<number>(0);
  const [marginOfSafety, setMarginOfSafety] = useState<number>(0);
  const [contributionMargin, setContributionMargin] = useState<number>(0);
  const [contributionMarginRatio, setContributionMarginRatio] = useState<number>(0);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const calculateBreakEven = () => {
    const { fixedCosts, variableCostsPerUnit, pricePerUnit, expectedUnits = 0 } = inputs;
    
    if (pricePerUnit <= variableCostsPerUnit) {
      setBreakEvenPoint(Infinity);
      setChartData([]);
      setIsCalculated(true);
      return;
    }

    // Calculate break-even point
    const bep = fixedCosts / (pricePerUnit - variableCostsPerUnit);
    setBreakEvenPoint(bep);

    // Calculate contribution metrics
    const cm = pricePerUnit - variableCostsPerUnit;
    setContributionMargin(cm);
    setContributionMarginRatio(cm / pricePerUnit);

    // Calculate profit at expected units
    if (expectedUnits > 0) {
      const profit = (pricePerUnit * expectedUnits) - (fixedCosts + (variableCostsPerUnit * expectedUnits));
      setProfitAtExpected(profit);
      setMarginOfSafety((expectedUnits - bep) / expectedUnits * 100);
    }

    // Generate data for chart
    const data = [];
    const maxUnits = Math.max(bep * 2, expectedUnits * 1.2, 100); // Show enough range
    
    // Calculate step size (show about 20-30 points)
    const step = Math.ceil(maxUnits / 25);
    
    for (let units = 0; units <= maxUnits; units += step) {
      const totalCost = fixedCosts + (variableCostsPerUnit * units);
      const totalRevenue = pricePerUnit * units;
      
      data.push({
        units,
        totalCost,
        totalRevenue,
        profit: totalRevenue - totalCost,
      });
    }

    setChartData(data);
    setIsCalculated(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
    // Reset calculations when inputs change
    setIsCalculated(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Break-Even Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-black">
        <div>
          <Label htmlFor="fixedCosts" className="text-black">Fixed Costs</Label>
          <Input
            id="fixedCosts"
            name="fixedCosts"
            type="number"
            min="0"
            value={inputs.fixedCosts}
            onChange={handleInputChange}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Total fixed business costs</p>
        </div>
        <div>
          <Label htmlFor="variableCostsPerUnit" className="text-black">Variable Cost/Unit</Label>
          <Input
            id="variableCostsPerUnit"
            name="variableCostsPerUnit"
            type="number"
            min="0"
            step="0.01"
            value={inputs.variableCostsPerUnit}
            onChange={handleInputChange}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Cost to produce each unit</p>
        </div>
        <div>
          <Label htmlFor="pricePerUnit" className="text-black">Price/Unit</Label>
          <Input
            id="pricePerUnit"
            name="pricePerUnit"
            type="number"
            min="0"
            step="0.01"
            value={inputs.pricePerUnit}
            onChange={handleInputChange}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Selling price per unit</p>
        </div>
        <div>
          <Label htmlFor="expectedUnits" className="text-black">Expected Sales (Units)</Label>
          <Input
            id="expectedUnits"
            name="expectedUnits"
            type="number"
            min="0"
            value={inputs.expectedUnits}
            onChange={handleInputChange}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Your sales forecast</p>
        </div>
      </div>

      <Button 
        onClick={() => {
          calculateBreakEven();
          onClose?.();
        }} 
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white"
      >
        Calculate & Close
      </Button>

      {isCalculated && (
        <>
          {breakEvenPoint === Infinity ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-red-800 mb-2">Analysis Not Possible</h4>
              <p className="text-red-700">
                Your price per unit must be greater than variable cost per unit to reach break-even.
                Currently, you're losing {formatCurrency(inputs.variableCostsPerUnit - inputs.pricePerUnit)} on each unit sold.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 mb-6 text-black">
                <div className="flex-1 min-w-[300px] bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-black mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-black">Break-Even Point</p>
                      <p className="font-semibold text-black">
                        {formatNumber(Math.ceil(breakEvenPoint))} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue at BEP</p>
                      <p className="font-semibold">
                        {formatCurrency(breakEvenPoint * inputs.pricePerUnit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contribution Margin</p>
                      <p className="font-semibold">{formatCurrency(contributionMargin)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CM Ratio</p>
                      <p className="font-semibold">{(contributionMarginRatio * 100).toFixed(1)}%</p>
                    </div>
                    {inputs.expectedUnits && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Projected Profit</p>
                          <p className={`font-semibold ${profitAtExpected >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitAtExpected)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Margin of Safety</p>
                          <p className={`font-semibold ${marginOfSafety >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {marginOfSafety.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-96 mb-6">
                <h4 className="text-md font-medium text-black mb-3">Break-Even Analysis Chart</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="units" 
                      label={{ value: 'Units Produced/Sold', position: 'insideBottomRight', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ 
                        value: 'Amount ($)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Units: ${formatNumber(label)}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="#ef4444" 
                      name="Total Costs" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalRevenue" 
                      stroke="#10b981" 
                      name="Total Revenue" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      name="Profit" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceLine 
                      x={breakEvenPoint} 
                      stroke="#888" 
                      label={{
                        position: 'top',
                        value: `BEP: ${formatNumber(Math.ceil(breakEvenPoint))} units`,
                        fill: '#555',
                        fontSize: 12
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {inputs.expectedUnits && (
                <div className="bg-gray-50 p-4 rounded-lg text-black">
                  <h4 className="text-md font-medium text-black mb-3">Scenario Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded ${profitAtExpected >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="text-sm font-medium">
                        At {formatNumber(inputs.expectedUnits)} units:
                      </p>
                      <p className={profitAtExpected >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                        {profitAtExpected >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(profitAtExpected))}
                      </p>
                      <p className="text-xs mt-1">
                        {profitAtExpected >= 0 
                          ? `You need to sell ${formatNumber(Math.ceil(breakEvenPoint))} units to break even.`
                          : `You're losing money at current sales volume. Need to sell ${formatNumber(Math.ceil(breakEvenPoint - inputs.expectedUnits))} more units to break even.`}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-blue-50">
                      <p className="text-sm font-medium">Margin of Safety:</p>
                      <p className={marginOfSafety >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                        {marginOfSafety.toFixed(1)}%
                      </p>
                      <p className="text-xs mt-1">
                        {marginOfSafety >= 0
                          ? `Sales can fall by ${marginOfSafety.toFixed(1)}% before you start losing money.`
                          : `You need to increase sales by ${Math.abs(marginOfSafety).toFixed(1)}% to reach break-even.`}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-purple-50">
                      <p className="text-sm font-medium">Contribution Margin:</p>
                      <p className="text-purple-700 font-bold">
                        {formatCurrency(contributionMargin)} per unit ({(contributionMarginRatio * 100).toFixed(1)}%)
                      </p>
                      <p className="text-xs mt-1">
                        Each unit sold contributes this amount toward covering fixed costs and profit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <p className="text-sm text-gray-500 mt-6">
        Analyzing {data.fields.length} data fields. Break-even analysis helps determine when your business will become profitable.
      </p>
    </Card>
  );
} 