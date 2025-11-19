import { useEffect, useState } from 'react';

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

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.reports.dailySales(selectedDate);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Daily Sales Report</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading report...</div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-blue-900">
                  {report.summary.total_invoices || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  Rs. {(report.summary.total_revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Tax</p>
                <p className="text-2xl font-bold text-purple-900">
                  Rs. {(report.summary.total_tax || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Discount</p>
                <p className="text-2xl font-bold text-orange-900">
                  Rs. {(report.summary.total_discount || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Top Products */}
            {report.topProducts && report.topProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Quantity Sold
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.topProducts.map((product, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {product.total_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            Rs. {product.total_revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.summary.total_invoices === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales data for selected date
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No report data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

