import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import LowStockAlerts from '../components/LowStockAlerts';

interface DashboardStats {
  totalProducts: number;
  lowStockCount: number;
  todaySales: number;
  todayInvoices: number;
  totalSales: number;
  totalInvoices: number;
  thisWeekSales: number;
  thisMonthSales: number;
}

interface SalesData {
  date: string;
  sales: number;
  invoices: number;
}

interface ProductCategoryData {
  name: string;
  value: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    todaySales: 0,
    todayInvoices: 0,
    totalSales: 0,
    totalInvoices: 0,
    thisWeekSales: 0,
    thisMonthSales: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productTypeData, setProductTypeData] = useState<ProductCategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [products, lowStock, invoices] = await Promise.all([
        window.electronAPI.products.getAll(),
        window.electronAPI.products.getLowStock(),
        window.electronAPI.invoices.getAll(),
      ]);

      // Get today's date - set to start of day in local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Filter invoices created today using date comparison
      const todayInvoices = invoices.filter((inv: any) => {
        if (!inv.created_at) return false;
        
        try {
          // Parse the invoice date - SQLite returns as string
          const invDate = new Date(inv.created_at);
          
          // Check if date is valid
          if (isNaN(invDate.getTime())) return false;
          
          // Normalize invoice date to start of day for comparison
          const invDateNormalized = new Date(invDate);
          invDateNormalized.setHours(0, 0, 0, 0);
          
          // Compare dates (ignoring time)
          return invDateNormalized.getTime() === today.getTime();
        } catch (e) {
          console.error('Error parsing invoice date:', inv.created_at, e);
          return false;
        }
      });
      
      const todaySales = todayInvoices.reduce(
        (sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
        0
      );
      
      // Debug logging
      const todayDateStr = today.toISOString().split('T')[0];
      console.log('=== Dashboard Date Debug ===');
      console.log('Today date:', todayDateStr);
      console.log('Today normalized timestamp:', today.getTime());
      console.log('Total invoices:', invoices.length);
      invoices.forEach((inv: any) => {
        if (inv.created_at) {
          try {
            const invDate = new Date(inv.created_at);
            const invDateNormalized = new Date(invDate);
            invDateNormalized.setHours(0, 0, 0, 0);
            console.log('Invoice:', {
              id: inv.id,
              invoice_number: inv.invoice_number,
              created_at: inv.created_at,
              parsedDate: invDate.toISOString(),
              normalizedTimestamp: invDateNormalized.getTime(),
              total_amount: inv.total_amount,
              isToday: invDateNormalized.getTime() === today.getTime()
            });
          } catch (e) {
            console.error('Error processing invoice:', inv.id, e);
          }
        }
      });
      console.log('Today invoices found:', todayInvoices.length);
      console.log('Today sales:', todaySales);

      // Calculate weekly sales (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekInvoices = invoices.filter((inv: any) => {
        if (!inv.created_at) return false;
        const invDate = new Date(inv.created_at);
        return invDate >= weekAgo && !isNaN(invDate.getTime());
      });
      const thisWeekSales = thisWeekInvoices.reduce(
        (sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
        0
      );

      // Calculate monthly sales
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const thisMonthInvoices = invoices.filter((inv: any) => {
        if (!inv.created_at) return false;
        const invDate = new Date(inv.created_at);
        return invDate >= monthAgo && !isNaN(invDate.getTime());
      });
      const thisMonthSales = thisMonthInvoices.reduce(
        (sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
        0
      );

      // Total sales
      const totalSales = invoices.reduce(
        (sum: number, inv: any) => sum + (parseFloat(inv.total_amount) || 0),
        0
      );

      // Prepare sales data for last 7 days chart
      const salesByDate: { [key: string]: { sales: number; invoices: number } } = {};
      
      // Initialize last 7 days with zero values
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        salesByDate[dateStr] = { sales: 0, invoices: 0 };
      }

      // Populate with actual invoice data
      invoices.forEach((inv: any) => {
        if (!inv.created_at) return;
        
        try {
          // Parse invoice date
          const invDate = new Date(inv.created_at);
          if (isNaN(invDate.getTime())) return;
          
          // Normalize to start of day
          invDate.setHours(0, 0, 0, 0);
          const invDateStr = invDate.toISOString().split('T')[0];
          
          // Add to sales data if it's within the last 7 days
          if (salesByDate[invDateStr]) {
            salesByDate[invDateStr].sales += parseFloat(inv.total_amount) || 0;
            salesByDate[invDateStr].invoices += 1;
          }
        } catch (e) {
          console.error('Error processing invoice for chart:', inv.id, e);
        }
      });

      // Convert to chart data format, sorted by date
      const chartData: SalesData[] = Object.entries(salesByDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: Number((data.sales || 0).toFixed(2)),
          invoices: data.invoices || 0,
        }));
      
      console.log('Chart data prepared:', chartData);

      // Product type distribution
      const typeCounts: { [key: string]: number } = {};
      products.forEach((product: any) => {
        const type = product.product_type || 'general';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const productTypeChartData: ProductCategoryData[] = Object.entries(typeCounts)
        .map(([name, value]) => ({
          name: name === 'tire' ? 'Tires' : name === 'alloy_wheel' ? 'Alloy Wheels' : 'General',
          value: Number(value),
        }))
        .filter(item => item.value > 0);

      setStats({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        todaySales,
        todayInvoices: todayInvoices.length,
        totalSales,
        totalInvoices: invoices.length,
        thisWeekSales,
        thisMonthSales,
      });
      // Always set chart data, even if empty - charts will show zero values
      setSalesData(chartData.length > 0 ? chartData : Object.entries(salesByDate).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: 0,
        invoices: 0,
      })));
      setProductTypeData(productTypeChartData.length > 0 ? productTypeChartData : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 text-white">
        <h1 className="text-2xl font-bold">Dimuth Tirehouse</h1>
        <p className="text-blue-100 text-sm">Management Dashboard</p>
      </div>

      {/* Low Stock Alerts - Moved to Top */}
      {stats.lowStockCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900">Low Stock Alert</h3>
              <p className="text-sm text-red-700">{stats.lowStockCount} product(s) need attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Stats Grid - 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <CompactStatCard
          title="Products"
          value={stats.totalProducts}
          icon="📦"
          color="blue"
        />
        <CompactStatCard
          title="Low Stock"
          value={stats.lowStockCount}
          icon="⚠️"
          color="red"
        />
        <CompactStatCard
          title="Today Sales"
          value={`Rs. ${stats.todaySales.toFixed(0)}`}
          icon="💰"
          color="green"
        />
        <CompactStatCard
          title="Today Invoices"
          value={stats.todayInvoices}
          icon="🧾"
          color="purple"
        />
        <CompactStatCard
          title="Total Sales"
          value={`Rs. ${(stats.totalSales / 1000).toFixed(0)}K`}
          icon="💵"
          color="emerald"
        />
        <CompactStatCard
          title="Week Sales"
          value={`Rs. ${(stats.thisWeekSales / 1000).toFixed(0)}K`}
          icon="📅"
          color="indigo"
        />
        <CompactStatCard
          title="Month Sales"
          value={`Rs. ${(stats.thisMonthSales / 1000).toFixed(0)}K`}
          icon="📊"
          color="amber"
        />
      </div>

      {/* Charts Row - More Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">📈</span> Sales Trend (7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                domain={[0, 'auto']}
                tickFormatter={(value) => {
                  if (value >= 1000) return `Rs.${(value / 1000).toFixed(0)}K`;
                  return `Rs.${value}`;
                }}
              />
              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Sales']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Type Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🥧</span> Product Types
          </h3>
          {productTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={productTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value} products`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No products yet
            </div>
          )}
        </div>
      </div>

      {/* Invoices Chart - Compact */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
          <span className="mr-2">📊</span> Daily Invoices (7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={salesData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              domain={[0, 'auto']}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value}`, 'Invoices']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '8px'
              }}
            />
            <Bar dataKey="invoices" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low Stock Details & Quick Actions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LowStockAlerts />
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🎯</span> Quick Actions
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200">
              <p className="font-medium text-blue-900 text-sm">Add New Product</p>
              <p className="text-xs text-blue-700 mt-1">Create tire or wheel product</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer border border-green-200">
              <p className="font-medium text-green-900 text-sm">Create Invoice</p>
              <p className="text-xs text-green-700 mt-1">Start billing transaction</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200">
              <p className="font-medium text-purple-900 text-sm">View Reports</p>
              <p className="text-xs text-purple-700 mt-1">Daily sales analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CompactStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'emerald' | 'indigo' | 'amber';
}

const CompactStatCard = ({ title, value, icon, color }: CompactStatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs font-medium truncate">{title}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        </div>
        <div className={`${colorClasses[color]} text-white p-2 rounded-lg text-lg flex-shrink-0 ml-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
