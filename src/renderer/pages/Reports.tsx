import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailySalesReport {
  summary: {
    total_invoices: number;
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
  };
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

interface DateRangeReport {
  summary: {
    total_invoices: number;
    total_revenue: number;
    total_subtotal: number;
    total_tax: number;
    total_discount: number;
    avg_invoice_value: number;
  };
  dailyBreakdown: Array<{
    date: string;
    invoices: number;
    revenue: number;
  }>;
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  paymentMethods: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

interface ProductPerformanceReport {
  bestSellers: Array<{
    product_name: string;
    total_sold: number;
    total_revenue: number;
    avg_price: number;
  }>;
  slowMovers: Array<{
    product_name: string;
    stock_quantity: number;
    last_sold: string | null;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'range' | 'products' | 'customers'>('daily');
  
  // Daily Report State
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  
  // Date Range Report State
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [rangeReport, setRangeReport] = useState<DateRangeReport | null>(null);
  
  // Product Performance State
  const [productReport, setProductReport] = useState<ProductPerformanceReport | null>(null);
  
  // Customer Report State
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyReport();
    } else if (activeTab === 'range') {
      loadRangeReport();
    } else if (activeTab === 'products') {
      loadProductReport();
    }
  }, [activeTab, selectedDate, startDate, endDate]);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.reports.dailySales(selectedDate);
      setDailyReport(data);
    } catch (error) {
      console.error('Error loading daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRangeReport = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.reports?.dateRangeSales) {
        console.error('Reports API not available');
        return;
      }
      const data = await window.electronAPI.reports.dateRangeSales(startDate, endDate);
      if (data && data.summary) {
        setRangeReport(data);
      } else {
        console.error('Invalid data structure:', data);
        setRangeReport(null);
      }
    } catch (error) {
      console.error('Error loading range report:', error);
      setRangeReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProductReport = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.reports?.productPerformance) {
        console.error('Reports API not available');
        return;
      }
      const data = await window.electronAPI.reports.productPerformance();
      if (data && (data.bestSellers || data.slowMovers)) {
        setProductReport(data);
      } else {
        console.error('Invalid data structure:', data);
        setProductReport(null);
      }
    } catch (error) {
      console.error('Error loading product report:', error);
      setProductReport(null);
    } finally {
      setLoading(false);
    }
  };


  const tabs = [
    { id: 'daily', name: 'Daily Report', icon: '📅' },
    { id: 'range', name: 'Date Range', icon: '📊' },
    { id: 'products', name: 'Products', icon: '📦' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 text-white">
        <h2 className="text-2xl font-bold">Sales Reports & Analytics</h2>
        <p className="text-blue-100 text-sm">Comprehensive insights into your business performance</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 p-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading report...</p>
            </div>
          ) : (
            <>
              {/* Daily Report */}
              {activeTab === 'daily' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Daily Sales Report</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {dailyReport ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard title="Invoices" value={dailyReport.summary.total_invoices || 0} color="blue" />
                        <StatCard title="Revenue" value={`Rs. ${(dailyReport.summary.total_revenue || 0).toFixed(2)}`} color="green" />
                        <StatCard title="Subtotal" value={`Rs. ${(dailyReport.summary.total_subtotal || 0).toFixed(2)}`} color="purple" />
                        <StatCard title="Tax" value={`Rs. ${(dailyReport.summary.total_tax || 0).toFixed(2)}`} color="orange" />
                        <StatCard title="Discount" value={`Rs. ${(dailyReport.summary.total_discount || 0).toFixed(2)}`} color="red" />
                      </div>

                      {dailyReport.topProducts && dailyReport.topProducts.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold mb-3">Top Products</h4>
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {dailyReport.topProducts.map((product, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.product_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{product.total_quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">Rs. {product.total_revenue.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {dailyReport.summary.total_invoices === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          No sales data for selected date
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No data available</div>
                  )}
                </div>
              )}

              {/* Date Range Report */}
              {activeTab === 'range' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const today = new Date();
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          setStartDate(weekAgo.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Last 7 Days
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const today = new Date();
                          const monthAgo = new Date();
                          monthAgo.setMonth(monthAgo.getMonth() - 1);
                          setStartDate(monthAgo.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Last 30 Days
                      </button>
                    </div>
                  </div>

                  {rangeReport ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <StatCard title="Invoices" value={rangeReport.summary.total_invoices || 0} color="blue" />
                        <StatCard title="Revenue" value={`Rs. ${(rangeReport.summary.total_revenue || 0).toFixed(2)}`} color="green" />
                        <StatCard title="Subtotal" value={`Rs. ${(rangeReport.summary.total_subtotal || 0).toFixed(2)}`} color="purple" />
                        <StatCard title="Tax" value={`Rs. ${(rangeReport.summary.total_tax || 0).toFixed(2)}`} color="orange" />
                        <StatCard title="Discount" value={`Rs. ${(rangeReport.summary.total_discount || 0).toFixed(2)}`} color="red" />
                        <StatCard title="Avg Invoice" value={`Rs. ${(rangeReport.summary.avg_invoice_value || 0).toFixed(2)}`} color="indigo" />
                      </div>

                      {rangeReport.dailyBreakdown && rangeReport.dailyBreakdown.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-md font-semibold mb-4">Daily Breakdown</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart 
                              data={rangeReport.dailyBreakdown}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return `${date.getDate()}/${date.getMonth() + 1}`;
                                }}
                              />
                              <YAxis 
                                tick={{ fontSize: 12, fill: '#6b7280' }} 
                                tickFormatter={(value) => `Rs.${value.toFixed(0)}`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#fff', 
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Revenue']}
                                labelFormatter={(label) => `Date: ${label}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3B82F6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rangeReport.topProducts && rangeReport.topProducts.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3">Top Products</h4>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {rangeReport.topProducts.slice(0, 5).map((product, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm text-gray-900">{product.product_name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500 text-right">{product.total_quantity}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">Rs. {product.total_revenue.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {rangeReport.paymentMethods && rangeReport.paymentMethods.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3">Payment Methods</h4>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={rangeReport.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ payment_method, total }) => `${payment_method}: Rs.${total.toFixed(2)}`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="total"
                                  >
                                    {rangeReport.paymentMethods.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(2)}`} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      {loading ? 'Loading...' : 'No data available for selected range'}
                    </div>
                  )}
                </div>
              )}

              {/* Product Performance Report */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Product Performance Report</h3>
                  
                  {productReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-semibold mb-3">Best Sellers</h4>
                        {productReport.bestSellers && productReport.bestSellers.length > 0 ? (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Sold</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {productReport.bestSellers.map((product, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">{product.product_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 text-right">{product.total_sold}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">Rs. {product.total_revenue.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                            No sales data available
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-md font-semibold mb-3">Slow Movers</h4>
                        {productReport.slowMovers && productReport.slowMovers.length > 0 ? (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Sold</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {productReport.slowMovers.map((product, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">{product.product_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 text-right">{product.stock_quantity}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {product.last_sold ? new Date(product.last_sold).toLocaleDateString() : 'Never'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                            No slow movers found
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      {loading ? 'Loading product data...' : 'No product data available'}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

const StatCard = ({ title, value, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-xs font-medium mb-1 opacity-75">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default Reports;
