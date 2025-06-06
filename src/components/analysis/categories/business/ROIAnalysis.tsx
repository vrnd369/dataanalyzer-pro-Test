import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import type { DataField } from '@/types/data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Info, X } from 'lucide-react';
import {
  Tooltip as ReactTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ROIAnalysisProps {
  onClose?: () => void;
  data: {
    fields: DataField[];
  };
}

interface ROIInputs {
  initialInvestment: number;
  annualCashFlow: number;
  investmentDuration: number;
  discountRate: number;
  cashFlowGrowthRate?: number;
  exitValue?: number;
}

export function ROIAnalysis({ onClose, data: _data }: ROIAnalysisProps) {
  const [inputs, setInputs] = useState<ROIInputs>({
    initialInvestment: 100000,
    annualCashFlow: 25000,
    investmentDuration: 5,
    discountRate: 5,
    cashFlowGrowthRate: 0,
    exitValue: 0,
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [results, setResults] = useState<{
    simpleROI: number;
    annualizedROI: number;
    npv: number;
    irr?: number;
    paybackPeriod: number;
    cashFlows: Array<{
      year: number;
      cashFlow: number;
      presentValue: number;
      cumulativeCashFlow: number;
    }>;
  } | null>(null);

  // Calculate automatically when inputs change if autoCalculate is enabled
  useEffect(() => {
    if (autoCalculate) {
      calculateROI();
    }
  }, [inputs, autoCalculate]);

  const calculateIRR = (cashFlows: number[]): number => {
    // Newton-Raphson method for IRR calculation
    let irr = 0.1; // Initial guess
    const tolerance = 0.00001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;
      
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + irr, t);
        derivative -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
      }
      
      const newIrr = irr - npv / derivative;
      
      if (Math.abs(newIrr - irr) < tolerance) {
        return newIrr * 100; // Convert to percentage
      }
      
      irr = newIrr;
    }
    
    return irr * 100;
  };

  const calculateROI = () => {
    const {
      initialInvestment,
      annualCashFlow,
      investmentDuration,
      discountRate,
      cashFlowGrowthRate = 0,
      exitValue = 0,
    } = inputs;
    
    if (initialInvestment <= 0 || investmentDuration <= 0) {
      setResults(null);
      return;
    }

    // Cash flows array with growth and exit value
    const cashFlows = [];
    let cumulativeCashFlow = -initialInvestment;
    let npv = -initialInvestment;
    let paybackPeriod = investmentDuration + 1; // Default: not reached
    
    // Prepare for IRR calculation
    const irrCashFlows = [-initialInvestment];

    for (let year = 1; year <= investmentDuration; year++) {
      const growthFactor = Math.pow(1 + (cashFlowGrowthRate / 100), year - 1);
      const yearlyCashFlow = annualCashFlow * growthFactor;
      const finalCashFlow = year === investmentDuration ? yearlyCashFlow + exitValue : yearlyCashFlow;
      
      const presentValue = finalCashFlow / Math.pow(1 + discountRate / 100, year);
      
      cumulativeCashFlow += finalCashFlow;
      
      // Check for payback period
      if (cumulativeCashFlow >= 0 && paybackPeriod > investmentDuration) {
        if (year === 1) {
          paybackPeriod = 1;
        } else {
          const previousYearCashFlow = cashFlows[year - 2].cashFlow;
          const fraction = Math.abs(cashFlows[year - 2].cumulativeCashFlow) / previousYearCashFlow;
          paybackPeriod = year - 1 + fraction;
        }
      }
      
      cashFlows.push({
        year,
        cashFlow: finalCashFlow,
        presentValue,
        cumulativeCashFlow,
      });
      
      npv += presentValue;
      irrCashFlows.push(finalCashFlow);
    }

    // Simple ROI calculation
    const totalReturn = cashFlows.reduce((sum, cf) => sum + cf.cashFlow, 0);
    const simpleROI = ((totalReturn - initialInvestment) / initialInvestment) * 100;

    // Annualized ROI calculation
    const annualizedROI = (Math.pow(1 + simpleROI / 100, 1 / investmentDuration) - 1) * 100;

    // IRR calculation
    const irr = calculateIRR(irrCashFlows);

    setResults({
      simpleROI,
      annualizedROI,
      npv,
      irr,
      paybackPeriod: paybackPeriod > investmentDuration ? investmentDuration : paybackPeriod,
      cashFlows,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: ROIInputs) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  return (
    <Card className="p-6 relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close ROI analysis"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">ROI Analysis Calculator</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedMode(!advancedMode)}
            className="text-black"
          >
            {advancedMode ? 'Basic Mode' : 'Advanced Mode'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoCalculate(!autoCalculate)}
            className={`text-black ${autoCalculate ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            Auto Calculate: {autoCalculate ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-black">
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
            <TooltipProvider>
              <ReactTooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The initial amount invested</p>
                </TooltipContent>
              </ReactTooltip>
            </TooltipProvider>
          </div>
          <Input
            id="initialInvestment"
            name="initialInvestment"
            type="number"
            value={inputs.initialInvestment}
            onChange={handleInputChange}
            min="0"
            step="1000"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="annualCashFlow">Annual Cash Flow ($)</Label>
            <TooltipProvider>
              <ReactTooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expected yearly return from investment</p>
                </TooltipContent>
              </ReactTooltip>
            </TooltipProvider>
          </div>
          <Input
            id="annualCashFlow"
            name="annualCashFlow"
            type="number"
            value={inputs.annualCashFlow}
            onChange={handleInputChange}
            min="0"
            step="1000"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="investmentDuration">Duration (years)</Label>
            <TooltipProvider>
              <ReactTooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of years for the investment</p>
                </TooltipContent>
              </ReactTooltip>
            </TooltipProvider>
          </div>
          <Input
            id="investmentDuration"
            name="investmentDuration"
            type="number"
            value={inputs.investmentDuration}
            onChange={handleInputChange}
            min="1"
            max="50"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label htmlFor="discountRate">Discount Rate (%)</Label>
            <TooltipProvider>
              <ReactTooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your required rate of return or cost of capital</p>
                </TooltipContent>
              </ReactTooltip>
            </TooltipProvider>
          </div>
          <Input
            id="discountRate"
            name="discountRate"
            type="number"
            value={inputs.discountRate}
            onChange={handleInputChange}
            step="0.1"
            min="0"
            max="50"
          />
        </div>
      </div>

      {advancedMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-black">
          <div>
            <div className="flex items-center gap-1">
              <Label htmlFor="cashFlowGrowthRate">Cash Flow Growth Rate (%)</Label>
              <TooltipProvider>
                <ReactTooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected annual growth of cash flows</p>
                  </TooltipContent>
                </ReactTooltip>
              </TooltipProvider>
            </div>
            <Input
              id="cashFlowGrowthRate"
              name="cashFlowGrowthRate"
              type="number"
              value={inputs.cashFlowGrowthRate}
              onChange={handleInputChange}
              step="0.1"
              min="-20"
              max="50"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Label htmlFor="exitValue">Exit Value ($)</Label>
              <TooltipProvider>
                <ReactTooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expected value at end of investment period</p>
                  </TooltipContent>
                </ReactTooltip>
              </TooltipProvider>
            </div>
            <Input
              id="exitValue"
              name="exitValue"
              type="number"
              value={inputs.exitValue}
              onChange={handleInputChange}
              min="0"
              step="1000"
            />
          </div>
        </div>
      )}

      {/* Manual calculation button (shown when auto-calculate is off) */}
      {!autoCalculate && (
        <div className="flex justify-center mb-6">
          <Button 
            onClick={calculateROI} 
            className="px-8 py-2 text-black bg-blue-500 hover:bg-blue-600"
          >
            Calculate ROI
          </Button>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-black">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-gray-700">Simple ROI</h4>
                <TooltipProvider>
                  <ReactTooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total return over entire period</p>
                    </TooltipContent>
                  </ReactTooltip>
                </TooltipProvider>
              </div>
              <p className={`text-2xl font-bold ${
                results.simpleROI >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.simpleROI.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {results.simpleROI >= 0 ? 'Profit' : 'Loss'} of ${Math.abs(
                  (results.simpleROI / 100) * inputs.initialInvestment
                ).toLocaleString()}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-gray-700">Annualized ROI</h4>
                <TooltipProvider>
                  <ReactTooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Compound annual growth rate</p>
                    </TooltipContent>
                  </ReactTooltip>
                </TooltipProvider>
              </div>
              <p className={`text-2xl font-bold ${
                results.annualizedROI >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.annualizedROI.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Equivalent to {results.annualizedROI >= 0 ? 'earning' : 'losing'} {Math.abs(results.annualizedROI).toFixed(1)}% yearly
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-gray-700">Net Present Value</h4>
                <TooltipProvider>
                  <ReactTooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current value of future cash flows</p>
                    </TooltipContent>
                  </ReactTooltip>
                </TooltipProvider>
              </div>
              <p className={`text-2xl font-bold ${
                results.npv >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${results.npv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {results.npv >= 0 ? 'Value created' : 'Value destroyed'} in today's dollars
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-gray-700">Payback Period</h4>
                <TooltipProvider>
                  <ReactTooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Time to recover initial investment</p>
                    </TooltipContent>
                  </ReactTooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {results.paybackPeriod.toFixed(1)} years
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {results.paybackPeriod <= inputs.investmentDuration ? 
                  'Investment will be recovered' : 
                  'Investment not recovered in period'}
              </p>
            </div>
          </div>

          {advancedMode && results.irr !== undefined && (
            <div className="bg-gray-50 p-4 rounded-lg border max-w-md">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-gray-700">Internal Rate of Return (IRR)</h4>
                <TooltipProvider>
                  <ReactTooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Effective compounded return rate</p>
                    </TooltipContent>
                  </ReactTooltip>
                </TooltipProvider>
              </div>
              <p className={`text-2xl font-bold ${
                results.irr >= inputs.discountRate ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.irr.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {results.irr >= inputs.discountRate ? 
                  'Meets required return' : 
                  'Below required return'}
                {inputs.discountRate > 0 && ` (${inputs.discountRate}%)`}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Cash Flow Analysis</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={results.cashFlows}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Year', position: 'insideBottom', offset: -10 }} 
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amount ($)', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, '']}
                    labelFormatter={(value) => `Year ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="cashFlow" name="Cash Flow">
                    {results.cashFlows.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[0]} />
                    ))}
                  </Bar>
                  <Bar dataKey="presentValue" name="Present Value">
                    {results.cashFlows.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[1]} />
                    ))}
                  </Bar>
                  {advancedMode && (
                    <Bar dataKey="cumulativeCashFlow" name="Cumulative Cash Flow">
                      {results.cashFlows.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[2]} />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto">
            <h4 className="text-md font-medium text-black mb-2">Year-by-Year Breakdown</h4>
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-black">Year</th>
                  <th className="px-4 py-2 text-right text-black">Cash Flow</th>
                  <th className="px-4 py-2 text-right text-black">Present Value</th>
                  {advancedMode && (
                    <>
                      <th className="px-4 py-2 text-right text-black">Cumulative</th>
                      <th className="px-4 py-2 text-right text-black  ">PV Cumulative</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.cashFlows.map((cf) => (
                  <tr key={cf.year} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-black">{cf.year}</td>
                    <td className="px-4 py-2 text-right text-black">
                      ${cf.cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2 text-right text-black">
                      ${cf.presentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    {advancedMode && (
                      <>
                        <td className="px-4 py-2 text-right text-black">
                          ${cf.cumulativeCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-2 text-right text-black">
                          ${(cf.cumulativeCashFlow + inputs.initialInvestment).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Interpretation Guide</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Simple ROI</strong>: Total return over the investment period</li>
          <li>• <strong>Annualized ROI</strong>: Yearly equivalent return accounting for compounding</li>
          <li>• <strong>NPV</strong>: Positive means value created at your discount rate</li>
          <li>• <strong>Payback Period</strong>: Shorter is better, shows liquidity risk</li>
          {advancedMode && (
            <li>• <strong>IRR</strong>: Should exceed your discount rate for good investments</li>
          )}
        </ul>
      </div>
    </Card>
  );
} 