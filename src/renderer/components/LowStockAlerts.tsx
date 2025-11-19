import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface LowStockProduct {
  id: number;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
}

const LowStockAlerts = () => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockProducts();
    // Refresh every 30 seconds
    const interval = setInterval(loadLowStockProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLowStockProducts = async () => {
    try {
      const products = await window.electronAPI.products.getLowStock();
      setLowStockProducts(products);
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            All Good
          </span>
        </div>
        <p className="text-gray-500 text-sm">No products are running low on stock.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="space-y-3">
        {lowStockProducts.slice(0, 5).map((product) => {
          const stockPercentage = (product.stock_quantity / product.low_stock_threshold) * 100;
          const isCritical = product.stock_quantity === 0;

          return (
            <div
              key={product.id}
              className={`p-3 rounded-lg border ${
                isCritical
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    {isCritical && (
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                    <span>
                      Stock: <span className="font-semibold">{product.stock_quantity}</span>
                    </span>
                    <span>
                      Threshold: <span className="font-semibold">{product.low_stock_threshold}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isCritical
                            ? 'bg-red-500'
                            : stockPercentage < 50
                            ? 'bg-yellow-500'
                            : 'bg-yellow-400'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lowStockProducts.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            View all {lowStockProducts.length} low stock items →
          </Link>
        </div>
      )}

      {lowStockProducts.length <= 5 && (
        <div className="mt-4 text-center">
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Manage Products →
          </Link>
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;

