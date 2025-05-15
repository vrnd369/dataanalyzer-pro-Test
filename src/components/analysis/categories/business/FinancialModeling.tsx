import { Card } from '@/components/ui/card';
import type { DataField } from '@/types/data';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinancialModelingProps {
  data: {
    fields: DataField[];
  };
}

interface FinancialInputs {
  revenue: number;
  revenueGrowthRate: number;
  cogsPercentage: number;
  operatingExpenses: number;
  taxRate: number;
  capitalExpenditures: number;
  workingCapital: number;
  projectionYears: number;
}

export function FinancialModeling({ data }: FinancialModelingProps) {
  const [inputs, setInputs] = useState<FinancialInputs>({
    revenue: 1000000,
    revenueGrowthRate: 10,
    cogsPercentage: 60,
    operatingExpenses: 200000,
    taxRate: 25,
    capitalExpenditures: 50000,
    workingCapital: 100000,
    projectionYears: 5,
  });

  const [projections, setProjections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow'>('income');

  const calculateProjections = () => {
    const {
      revenue,
      revenueGrowthRate,
      cogsPercentage,
      operatingExpenses,
      taxRate,
      capitalExpenditures,
      workingCapital,
      projectionYears,
    } = inputs;

    const projectionData = [];
    let currentRevenue = revenue;
    let currentWorkingCapital = workingCapital;

    for (let year = 1; year <= projectionYears; year++) {
      // Income Statement
      const grossProfit = currentRevenue * (1 - cogsPercentage / 100);
      const ebitda = grossProfit - operatingExpenses;
      const depreciation = capitalExpenditures * 0.2; // Simplified depreciation
      const ebit = ebitda - depreciation;
      const tax = ebit * (taxRate / 100);
      const netIncome = ebit - tax;

      // Balance Sheet
      const totalAssets = currentWorkingCapital + capitalExpenditures * year;
      const totalLiabilities = totalAssets * 0.4; // Simplified
      const equity = totalAssets - totalLiabilities;

      // Cash Flow
      const operatingCashFlow = netIncome + depreciation;
      const investingCashFlow = -capitalExpenditures;
      const financingCashFlow = 0; // Simplified
      const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

      projectionData.push({
        year,
        revenue: currentRevenue,
        grossProfit,
        ebitda,
        ebit,
        netIncome,
        totalAssets,
        totalLiabilities,
        equity,
        operatingCashFlow,
        investingCashFlow,
        netCashFlow,
      });

      // Update for next year
      currentRevenue *= (1 + revenueGrowthRate / 100);
      currentWorkingCapital *= 1.05; // 5% growth
    }

    setProjections(projectionData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Financial Modeling</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-black">
        <div>
          <Label htmlFor="revenue" className="text-black">Initial Revenue</Label>
          <Input
            id="revenue"
            name="revenue"
            type="number"
            value={inputs.revenue}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="revenueGrowthRate" className="text-black">Revenue Growth Rate (%)</Label>
          <Input
            id="revenueGrowthRate"
            name="revenueGrowthRate"
            type="number"
            value={inputs.revenueGrowthRate}
            onChange={handleInputChange}
            step="0.1"
          />
        </div>
        <div>
          <Label htmlFor="cogsPercentage" className="text-black">COGS Percentage (%)</Label>
          <Input
            id="cogsPercentage"
            name="cogsPercentage"
            type="number"
            value={inputs.cogsPercentage}
            onChange={handleInputChange}
            min="0"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="operatingExpenses" className="text-black">Operating Expenses</Label>
          <Input
            id="operatingExpenses"
            name="operatingExpenses"
            type="number"
            value={inputs.operatingExpenses}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="taxRate" className="text-black">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            name="taxRate"
            type="number"
            value={inputs.taxRate}
            onChange={handleInputChange}
            min="0"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="capitalExpenditures" className="text-black">Capital Expenditures</Label>
          <Input
            id="capitalExpenditures"
            name="capitalExpenditures"
            type="number"
            value={inputs.capitalExpenditures}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="workingCapital" className="text-black">Working Capital</Label>
          <Input
            id="workingCapital"
            name="workingCapital"
            type="number"
            value={inputs.workingCapital}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="projectionYears" className="text-black">Projection Years</Label>
          <Input
            id="projectionYears"
            name="projectionYears"
            type="number"
            value={inputs.projectionYears}
            onChange={handleInputChange}
            min="1"
            max="10"
          />
        </div>
      </div>

      <Button onClick={calculateProjections} className="mb-6 text-black">
        Generate Projections
      </Button>

      {projections.length > 0 && (
        <div className="space-y-6">
          <div className="flex space-x-4 border-b">
            <button
              className={`pb-2 px-4 ${activeTab === 'income' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('income')}
            >
              Income Statement
            </button>
            <button
              className={`pb-2 px-4 ${activeTab === 'balance' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('balance')}
            >
              Balance Sheet
            </button>
            <button
              className={`pb-2 px-4 ${activeTab === 'cashflow' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('cashflow')}
            >
              Cash Flow
            </button>
          </div>

          {activeTab === 'income' && (
            <div>
              <h4 className="text-md font-medium text-black mb-2">Income Statement Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EBITDA</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{proj.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.grossProfit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.ebitda)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.netIncome)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                    <Line type="monotone" dataKey="netIncome" stroke="#82ca9d" name="Net Income" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'balance' && (
            <div>
              <h4 className="text-md font-medium text-black mb-2">Balance Sheet Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Liabilities</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{proj.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.totalAssets)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.totalLiabilities)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.equity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Bar dataKey="totalAssets" fill="#8884d8" name="Total Assets" />
                    <Bar dataKey="totalLiabilities" fill="#ffc658" name="Total Liabilities" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div>
              <h4 className="text-md font-medium text-black mb-2">Cash Flow Projection</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Cash Flow</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investing Cash Flow</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.map((proj) => (
                      <tr key={proj.year}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{proj.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.operatingCashFlow)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.investingCashFlow)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-black">{formatCurrency(proj.netCashFlow)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-80 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="operatingCashFlow" stroke="#8884d8" name="Operating Cash Flow" />
                    <Line type="monotone" dataKey="netCashFlow" stroke="#82ca9d" name="Net Cash Flow" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">Analyzing {data.fields.length} data fields.</p>
    </Card>
  );
} 