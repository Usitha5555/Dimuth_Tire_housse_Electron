import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  stock_quantity: number;
}

interface StockAdjustmentProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustment = ({ product, onClose, onSuccess }: StockAdjustmentProps) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const currentStock = product.stock_quantity;
      let newStock = currentStock;

      if (adjustmentType === 'add') {
        newStock = currentStock + parseFloat(quantity);
      } else if (adjustmentType === 'subtract') {
        newStock = Math.max(0, currentStock - parseFloat(quantity));
      } else {
        newStock = parseFloat(quantity);
      }

      await window.electronAPI.products.update(product.id, {
        ...product,
        stock_quantity: newStock,
      });

      // Create stock movement record (if IPC handler exists)
      // This would be handled in the backend, but for now we'll just update stock

      alert('Stock adjusted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const getNewStockPreview = () => {
    if (!quantity || parseFloat(quantity) <= 0) return product.stock_quantity;
    
    const qty = parseFloat(quantity);
    if (adjustmentType === 'add') {
      return product.stock_quantity + qty;
    } else if (adjustmentType === 'subtract') {
      return Math.max(0, product.stock_quantity - qty);
    } else {
      return qty;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Product:</p>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            Current Stock: <span className="font-semibold">{product.stock_quantity}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`px-4 py-2 rounded-lg border ${
                  adjustmentType === 'add'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`px-4 py-2 rounded-lg border ${
                  adjustmentType === 'subtract'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}
              >
                Subtract
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`px-4 py-2 rounded-lg border ${
                  adjustmentType === 'set'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}
              >
                Set To
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity {adjustmentType === 'add' ? 'to Add' : adjustmentType === 'subtract' ? 'to Subtract' : ''}
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter quantity"
            />
          </div>

          {quantity && parseFloat(quantity) > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                New Stock: <span className="font-semibold text-blue-900">{getNewStockPreview()}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Reason for adjustment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Adjusting...' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustment;

