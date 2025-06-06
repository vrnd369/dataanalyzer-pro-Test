import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Filter, RefreshCw, Users, Tag, Percent, MapPin } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import type { DataField } from '@/types/data';
import { RetailAnalyzer } from '@/utils/analysis/industry/retail';

// Extend DataField type to include category and date
interface ExtendedDataField extends DataField {
  category?: string;
  date?: string | Date;
  risk?: 'high' | 'medium' | 'low';
  price?: number;
  customerId?: string;
  location?: string;
  promotionId?: string;
}

interface RetailAnalysisProps {
  data: {
    fields: ExtendedDataField[];
  };
}

interface StockoutRiskItem {
  product: string;
  risk: 'high' | 'medium' | 'low';
  daysUntilStockout: number;
  currentStock: number;
  dailySales: number;
  leadTime: number;
}

interface InventoryMetrics {
  turnoverRate: number;
  stockoutRisk: StockoutRiskItem[];
  optimalRestockLevels: Array<{
    product: string;
    current: number;
    minimum: number;
    optimal: number;
    maximum: number;
  }>;
  averageStockDays: number;
}

interface SalesTrends {
  product: string;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  historicalSales: number[];
  forecast: number[];
  averageSales: number;
  salesVariance: number;
  seasonality?: string;
}

interface CustomerSegment {
  segment: string;
  count: number;
  averageSpend: number;
  frequency: number;
  products: string[];
}

interface PricingInsight {
  product: string;
  currentPrice: number;
  optimalPrice: number;
  priceElasticity: number;
  competitorPrice: number;
}

interface PromotionAnalysis {
  promotionId: string;
  name: string;
  uplift: number;
  roi: number;
  redemptions: number;
  cost: number;
}

export function RetailAnalysis({ data }: RetailAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    productCategory: '',
    timePeriod: '30',
    riskThreshold: 'medium',
    customCategory: '',
    customerSegment: '',
    priceSensitivity: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'customers' | 'pricing' | 'promotions' | 'geographic'>('inventory');

  const filteredData = React.useMemo(() => {
    setIsLoading(true);
    try {
      if (!data?.fields) {
        console.warn('No fields data provided');
        return { fields: [] };
      }

      // First apply category filter if needed
      let fieldsToFilter = data.fields;
      if (filters.productCategory) {
        fieldsToFilter = data.fields.filter(field => 
          field.category && field.category.toLowerCase().includes(filters.productCategory.toLowerCase())
        );
      }

      // Then apply date filtering
      const dateField = fieldsToFilter.find(f => f.type === 'date');
      if (!dateField) {
        setError('No date field found in the data. Please ensure your data includes a date field for analysis.');
        return { fields: [] };
      }

      const timePeriodDays = parseInt(filters.timePeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timePeriodDays);

      const validIndices: number[] = [];
      (dateField.value || []).forEach((dateValue, idx) => {
        try {
          const dateObj = new Date(dateValue);
          if (!isNaN(dateObj.getTime()) && dateObj >= cutoffDate) {
            validIndices.push(idx);
          }
        } catch (e) {
          console.warn('Invalid date value:', dateValue);
        }
      });

      // Filter all fields' value arrays by validIndices
      const filteredFields = fieldsToFilter.map(field => ({
        ...field,
        value: (field.value || []).filter((_, idx) => validIndices.includes(idx))
      }));

      return { fields: filteredFields };
    } catch (err) {
      console.error('Error filtering data:', err);
      setError('Error filtering data');
      return { fields: [] };
    } finally {
      setIsLoading(false);
    }
  }, [data?.fields, filters]);

  // Analyze the filtered data
  const inventory = React.useMemo(() => {
    try {
      console.log('Analyzing inventory with fields:', filteredData.fields);
      const result = RetailAnalyzer.analyzeInventory(filteredData.fields) as InventoryMetrics;
      console.log('Initial stockout risk items:', result.stockoutRisk);
      
      // Apply risk threshold filter to stockout risk items
      if (filters.riskThreshold) {
        console.log('Applying risk threshold filter:', filters.riskThreshold);
        const filteredRiskItems = result.stockoutRisk.filter(item => {
          const shouldInclude = 
            filters.riskThreshold === 'high' ? item.risk === 'high' :
            filters.riskThreshold === 'medium' ? ['high', 'medium'].includes(item.risk) :
            true;
          console.log(`Item ${item.product} with risk ${item.risk} - should include: ${shouldInclude}`);
          return shouldInclude;
        });
        console.log('Filtered risk items:', filteredRiskItems);
        result.stockoutRisk = filteredRiskItems;
      }
      
      return result;
    } catch (err) {
      console.error('Error analyzing inventory:', err);
      setError('Error analyzing inventory');
      return {
        turnoverRate: 0,
        stockoutRisk: [],
        optimalRestockLevels: [],
        averageStockDays: 0
      };
    }
  }, [filteredData.fields, filters.riskThreshold]);

  const salesTrends = React.useMemo(() => {
    try {
      console.log('Analyzing sales trends with fields:', filteredData.fields);
      const trends = RetailAnalyzer.analyzeSalesTrends(filteredData.fields);
      console.log('Sales trends result:', trends);
      return trends as unknown as SalesTrends[];
    } catch (err) {
      console.error('Error analyzing sales trends:', err);
      setError('Error analyzing sales trends');
      return [];
    }
  }, [filteredData.fields]);

  // Get unique product categories for filter dropdown
  const productCategories = React.useMemo(() => {
    try {
      if (!data?.fields) return [];
      
      const categories = new Set<string>();
      data.fields.forEach(field => {
        if (field?.category) {
          categories.add(field.category);
        }
      });
      console.log('Available categories:', Array.from(categories));
      return Array.from(categories);
    } catch (err) {
      console.error('Error getting product categories:', err);
      setError('Error getting product categories');
      return [];
    }
  }, [data?.fields]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('Filter changed:', name, value);
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'productCategory' && value !== 'custom' && { customCategory: '' })
    }));
  };

  const resetFilters = () => {
    setFilters({
      productCategory: '',
      timePeriod: '30',
      riskThreshold: 'medium',
      customCategory: '',
      customerSegment: '',
      priceSensitivity: 'all',
    });
  };

  // Add debug logging for the current filters state
  React.useEffect(() => {
    console.log('Current filters state:', filters);
  }, [filters]);

  // Add debug logging for the inventory state
  React.useEffect(() => {
    console.log('Current inventory state:', inventory);
  }, [inventory]);

  // New analytics features
  const customerSegments = React.useMemo(() => {
    try {
      return RetailAnalyzer.analyzeCustomerSegments(filteredData.fields) as CustomerSegment[];
    } catch (err) {
      console.error('Error analyzing customer segments:', err);
      return [];
    }
  }, [filteredData.fields]);

  const pricingInsights = React.useMemo(() => {
    try {
      let insights = RetailAnalyzer.analyzePricing(filteredData.fields) as PricingInsight[];
      
      if (filters.priceSensitivity !== 'all') {
        insights = insights.filter(insight => {
          const sensitivity = Math.abs(insight.priceElasticity) > 1 ? 'high' : 'low';
          return sensitivity === filters.priceSensitivity;
        });
      }
      
      return insights;
    } catch (err) {
      console.error('Error analyzing pricing:', err);
      return [];
    }
  }, [filteredData.fields, filters.priceSensitivity]);

  const promotionAnalysis = React.useMemo(() => {
    try {
      return RetailAnalyzer.analyzePromotions(filteredData.fields) as PromotionAnalysis[];
    } catch (err) {
      console.error('Error analyzing promotions:', err);
      return [];
    }
  }, [filteredData.fields]);

  const geographicPerformance = React.useMemo(() => {
    try {
      console.log('Analyzing geographic performance with fields:', filteredData.fields);
      if (!filteredData.fields || filteredData.fields.length === 0) {
        console.warn('No fields data available for geographic analysis');
        return [];
      }
      const result = RetailAnalyzer.analyzeGeographicPerformance(filteredData.fields);
      console.log('Geographic performance result:', result);
      return result;
    } catch (err) {
      console.error('Error analyzing geographic performance:', err);
      setError('Error analyzing geographic performance');
      return [];
    }
  }, [filteredData.fields]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-medium">Error Loading Analysis</h3>
        </div>
        <p className="text-sm mt-2">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-3 text-sm text-teal-600 hover:text-teal-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">Retail Analysis Dashboard</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-teal-600"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Product Category
              </label>
              <div className="flex gap-2">
                <select
                  id="productCategory"
                  name="productCategory"
                  value={filters.productCategory}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  <option value="custom">Custom Category</option>
                  {productCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {filters.productCategory === 'custom' && (
                  <input
                    type="text"
                    name="customCategory"
                    value={filters.customCategory}
                    onChange={handleFilterChange}
                    placeholder="Enter category"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Time Period (days)
              </label>
              <select
                id="timePeriod"
                name="timePeriod"
                value={filters.timePeriod}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="riskThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                Risk Threshold
              </label>
              <select
                id="riskThreshold"
                name="riskThreshold"
                value={filters.riskThreshold}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="low">Low Risk Only</option>
                <option value="medium">Medium+ Risk</option>
                <option value="high">High Risk Only</option>
              </select>
            </div>

            <div>
              <label htmlFor="customerSegment" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Segment
              </label>
              <select
                id="customerSegment"
                name="customerSegment"
                value={filters.customerSegment}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Segments</option>
                {customerSegments.map(segment => (
                  <option key={segment.segment} value={segment.segment}>{segment.segment}</option>
                ))}
              </select>
            </div>

            {activeTab === 'pricing' && (
              <div>
                <label htmlFor="priceSensitivity" className="block text-sm font-medium text-gray-700 mb-1">
                  Price Sensitivity
                </label>
                <select
                  id="priceSensitivity"
                  name="priceSensitivity"
                  value={filters.priceSensitivity}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All</option>
                  <option value="high">High Sensitivity</option>
                  <option value="low">Low Sensitivity</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'inventory' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'sales' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sales Trends
            </div>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'customers' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'pricing' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Pricing
            </div>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'promotions' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Promotions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('geographic')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'geographic' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Geographic
            </div>
          </button>
        </div>
      </div>

      {/* Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Inventory Management</h3>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredData.fields.length} of {data.fields.length} items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Turnover Rate</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {((inventory && inventory.turnoverRate) || 0).toFixed(2)}x
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">per period</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Stockout Risk Items</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {(inventory && inventory.stockoutRisk && inventory.stockoutRisk.length) || 0}
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">
                  {(((inventory && inventory.stockoutRisk && inventory.stockoutRisk.length) || 0) / (filteredData.fields.length || 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2 text-black">Avg. Stock Days</h4>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-black">
                  {((inventory && inventory.averageStockDays) || 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 mb-1 text-black">days remaining</span>
              </div>
            </div>
          </div>

          {/* Stockout Risk */}
          {inventory.stockoutRisk.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900 text-black">Stockout Risk Analysis</h4>
                <div className="text-xs text-gray-500">
                  Showing {filters.riskThreshold} risk items
                </div>
              </div>
              <div className="grid gap-4">
                {inventory.stockoutRisk.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      item.risk === 'high'
                        ? 'border-red-200 bg-red-50'
                        : item.risk === 'medium'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-black">{item.product}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.risk === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.risk === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.risk.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Current Stock:</span> {item.currentStock}
                      </div>
                      <div>
                        <span className="font-medium">Daily Sales:</span> {item.dailySales.toFixed(1)}
                      </div>
                      <div>
                        <span className="font-medium">Days Until Stockout:</span> {item.daysUntilStockout}
                      </div>
                      <div>
                        <span className="font-medium">Lead Time:</span> {item.leadTime} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Restock Levels */}
          {inventory.optimalRestockLevels.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 text-black">Recommended Stock Levels</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Minimum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Optimal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventory.optimalRestockLevels.map((level, index) => {
                      const status = 
                        level.current < level.minimum ? 'Understocked' :
                        level.current > level.maximum ? 'Overstocked' : 'Optimal';
                      
                      const statusColor = 
                        status === 'Understocked' ? 'text-red-600' :
                        status === 'Overstocked' ? 'text-yellow-600' : 'text-green-600';
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {level.product}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.current}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.minimum}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {level.optimal}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${statusColor}`}>
                            {status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales Trends */}
      {activeTab === 'sales' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Sales Trends</h3>
            </div>
            <div className="text-sm text-gray-500">
              Last {filters.timePeriod} days analysis
            </div>
          </div>

          {salesTrends.length > 0 ? (
            <div className="grid gap-6">
              {salesTrends.map((trend, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 text-black">{trend?.product || 'Unknown Product'}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        trend?.trend === 'up' ? 'text-green-600' :
                        trend?.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {((trend?.growthRate || 0) > 0 ? '+' : '') + (trend?.growthRate || 0).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        vs previous {parseInt(filters.timePeriod)/2} days
                      </span>
                    </div>
                  </div>

                  {/* Sales Forecast Chart */}
                  <div className="h-48 mb-4">
                    <Line
                      data={{
                        labels: [
                          ...(trend?.historicalSales || []).map((_, i) => `Day ${i + 1}`),
                          ...(trend?.forecast || []).map((_, i) => `F ${i + 1}`)
                        ],
                        datasets: [
                          {
                            label: 'Historical Sales',
                            data: trend?.historicalSales || [],
                            borderColor: 'rgb(156, 163, 175)',
                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                            borderDash: [5, 5],
                            tension: 0.1
                          },
                          {
                            label: 'Forecast',
                            data: [
                              ...Array((trend?.historicalSales || []).length).fill(null),
                              ...(trend?.forecast || [])
                            ],
                            borderColor: 'rgb(13, 148, 136)',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            fill: true,
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: false
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Avg. Daily Sales:</span> {(trend?.averageSales || 0).toFixed(1)}
                    </div>
                    <div>
                      <span className="font-medium">Sales Variance:</span> {(trend?.salesVariance || 0).toFixed(1)}
                    </div>
                    {trend?.seasonality && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          Seasonal pattern: {trend?.seasonality}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sales trend data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Customer Analytics */}
      {activeTab === 'customers' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Customer Analytics</h3>
            </div>
            <div className="text-sm text-gray-500">
              {customerSegments.length} segments identified
            </div>
          </div>

          {customerSegments.length > 0 ? (
            <div className="grid gap-8">
              {/* Customer Segments Overview */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Segments</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Segments Distribution</h5>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: customerSegments.map(seg => seg.segment),
                          datasets: [{
                            data: customerSegments.map(seg => seg.count),
                            backgroundColor: [
                              'rgba(13, 148, 136, 0.7)',
                              'rgba(249, 168, 37, 0.7)',
                              'rgba(220, 38, 38, 0.7)',
                              'rgba(139, 92, 246, 0.7)',
                              'rgba(20, 184, 166, 0.7)'
                            ],
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Segment Metrics</h5>
                    <div className="space-y-4">
                      {customerSegments.map((segment, index) => (
                        <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{segment.segment}</span>
                            <span className="text-sm text-gray-500">{segment.count} customers</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Avg. Spend:</span> ${segment.averageSpend.toFixed(2)}
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span> {segment.frequency.toFixed(1)}/month
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Top Products by Segment</h5>
                    <div className="space-y-4">
                      {customerSegments.map((segment, index) => (
                        <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="font-medium mb-1">{segment.segment}</div>
                          <div className="flex flex-wrap gap-1">
                            {segment.products.slice(0, 5).map((product, pIndex) => (
                              <span key={pIndex} className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {product}
                              </span>
                            ))}
                            {segment.products.length > 5 && (
                              <span className="text-xs text-gray-500">+{segment.products.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Lifetime Value */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Value Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Spending Distribution</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: customerSegments.map(seg => seg.segment),
                          datasets: [{
                            label: 'Average Spend',
                            data: customerSegments.map(seg => seg.averageSpend),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Purchase Frequency</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: customerSegments.map(seg => seg.segment),
                          datasets: [{
                            label: 'Visits per Month',
                            data: customerSegments.map(seg => seg.frequency),
                            backgroundColor: 'rgba(249, 168, 37, 0.7)',
                            borderColor: 'rgba(249, 168, 37, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer segment data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Pricing Insights */}
      {activeTab === 'pricing' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Pricing Insights</h3>
            </div>
            <div className="text-sm text-gray-500">
              {pricingInsights.length} products analyzed
            </div>
          </div>

          {pricingInsights.length > 0 ? (
            <div className="grid gap-8">
              {/* Pricing Elasticity */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price Elasticity Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Optimal Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Elasticity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Competitor Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommendation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pricingInsights.map((insight, index) => {
                        const priceDifference = insight.optimalPrice - insight.currentPrice;
                        const competitorDifference = insight.currentPrice - insight.competitorPrice;
                        
                        let recommendation = '';
                        let recommendationColor = '';
                        
                        if (Math.abs(insight.priceElasticity) > 1) {
                          // Elastic demand
                          if (priceDifference > 0) {
                            recommendation = 'Increase price';
                            recommendationColor = 'text-green-600';
                          } else {
                            recommendation = 'Decrease price';
                            recommendationColor = 'text-red-600';
                          }
                        } else {
                          // Inelastic demand
                          if (competitorDifference > 0) {
                            recommendation = 'Match competitor price';
                            recommendationColor = 'text-yellow-600';
                          } else {
                            recommendation = 'Maintain current price';
                            recommendationColor = 'text-gray-600';
                          }
                        }
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {insight.product}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.currentPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.optimalPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {insight.priceElasticity.toFixed(2)}
                              <span className="ml-1 text-xs">
                                ({Math.abs(insight.priceElasticity) > 1 ? 'Elastic' : 'Inelastic'})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${insight.competitorPrice.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${recommendationColor}`}>
                              {recommendation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Optimization Opportunities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Price Optimization Opportunities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Potential Revenue Impact</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: pricingInsights.map(insight => insight.product),
                          datasets: [{
                            label: 'Current Revenue',
                            data: pricingInsights.map(insight => insight.currentPrice * 100),
                            backgroundColor: 'rgba(156, 163, 175, 0.7)',
                            borderColor: 'rgba(156, 163, 175, 1)',
                            borderWidth: 1
                          }, {
                            label: 'Optimal Revenue',
                            data: pricingInsights.map(insight => insight.optimalPrice * 100),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Revenue Index (100 = baseline)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Price Sensitivity Distribution</h5>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: ['High Sensitivity', 'Low Sensitivity'],
                          datasets: [{
                            data: [
                              pricingInsights.filter(i => Math.abs(i.priceElasticity) > 1).length,
                              pricingInsights.filter(i => Math.abs(i.priceElasticity) <= 1).length
                            ],
                            backgroundColor: [
                              'rgba(220, 38, 38, 0.7)',
                              'rgba(13, 148, 136, 0.7)'
                            ],
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No pricing insights available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Promotion Analysis */}
      {activeTab === 'promotions' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Promotion Analysis</h3>
            </div>
            <div className="text-sm text-gray-500">
              {promotionAnalysis.length} promotions analyzed
            </div>
          </div>

          {promotionAnalysis.length > 0 ? (
            <div className="grid gap-8">
              {/* Promotion Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Promotion Performance</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promotion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Uplift
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ROI
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Redemptions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Effectiveness
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {promotionAnalysis.map((promo, index) => {
                        let effectiveness = '';
                        let effectivenessColor = '';
                        
                        if (promo.roi > 300) {
                          effectiveness = 'Excellent';
                          effectivenessColor = 'text-green-600';
                        } else if (promo.roi > 150) {
                          effectiveness = 'Good';
                          effectivenessColor = 'text-teal-600';
                        } else if (promo.roi > 100) {
                          effectiveness = 'Average';
                          effectivenessColor = 'text-yellow-600';
                        } else {
                          effectiveness = 'Poor';
                          effectivenessColor = 'text-red-600';
                        }
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {promo.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              +{promo.uplift.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {promo.roi.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {promo.redemptions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${promo.cost.toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${effectivenessColor}`}>
                              {effectiveness}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promotion Insights */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Promotion Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">ROI vs Uplift</h5>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: promotionAnalysis.map(promo => promo.name),
                          datasets: [
                            {
                              label: 'ROI (%)',
                              data: promotionAnalysis.map(promo => promo.roi),
                              borderColor: 'rgb(13, 148, 136)',
                              backgroundColor: 'rgba(13, 148, 136, 0.1)',
                              yAxisID: 'y',
                              tension: 0.3
                            },
                            {
                              label: 'Sales Uplift (%)',
                              data: promotionAnalysis.map(promo => promo.uplift),
                              borderColor: 'rgb(249, 168, 37)',
                              backgroundColor: 'rgba(249, 168, 37, 0.1)',
                              yAxisID: 'y1',
                              tension: 0.3
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'ROI (%)'
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Uplift (%)'
                              },
                              grid: {
                                drawOnChartArea: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Cost vs Redemptions</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: promotionAnalysis.map(promo => promo.name),
                          datasets: [
                            {
                              label: 'Cost ($)',
                              data: promotionAnalysis.map(promo => promo.cost),
                              backgroundColor: 'rgba(220, 38, 38, 0.7)',
                              borderColor: 'rgba(220, 38, 38, 1)',
                              borderWidth: 1,
                              yAxisID: 'y'
                            },
                            {
                              label: 'Redemptions',
                              data: promotionAnalysis.map(promo => promo.redemptions),
                              backgroundColor: 'rgba(13, 148, 136, 0.7)',
                              borderColor: 'rgba(13, 148, 136, 1)',
                              borderWidth: 1,
                              yAxisID: 'y1'
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Cost ($)'
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Redemptions'
                              },
                              grid: {
                                drawOnChartArea: false
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No promotion data available for the selected filters
            </div>
          )}
        </div>
      )}

      {/* Geographic Performance */}
      {activeTab === 'geographic' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-black">Geographic Performance</h3>
            </div>
            <div className="text-sm text-gray-500">
              {geographicPerformance.length} locations analyzed
            </div>
          </div>

          {geographicPerformance.length > 0 ? (
            <div className="grid gap-8">
              {/* Location Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Location Performance</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Growth
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Top Product
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {geographicPerformance.map((location, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {location.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${location.sales.toFixed(2)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            location.growth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {location.growth > 0 ? '+' : ''}{location.growth.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {location.topProduct}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Sales Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Sales by Location</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: geographicPerformance.map(loc => loc.location),
                          datasets: [{
                            label: 'Total Sales',
                            data: geographicPerformance.map(loc => loc.sales),
                            backgroundColor: 'rgba(13, 148, 136, 0.7)',
                            borderColor: 'rgba(13, 148, 136, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Sales ($)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Growth by Location</h5>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: geographicPerformance.map(loc => loc.location),
                          datasets: [{
                            label: 'Growth Rate',
                            data: geographicPerformance.map(loc => loc.growth),
                            backgroundColor: geographicPerformance.map(loc => 
                              loc.growth > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                            ),
                            borderColor: geographicPerformance.map(loc => 
                              loc.growth > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                            ),
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              title: {
                                display: true,
                                text: 'Growth Rate (%)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No geographic performance data available for the selected filters
            </div>
          )}
        </div>
      )}
    </div>
  );
} 