import { useEffect, useState } from 'react';
import { generateReceiptPDF, printReceipt } from '../utils/receipt';
import { Product, ProductType } from '../types';

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const Billing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [sizeFilter, setSizeFilter] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await window.electronAPI.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert('Product out of stock');
      return;
    }

    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        alert('Not enough stock available');
        return;
      }
      updateCartItem(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stock_quantity) {
      alert('Not enough stock available');
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              total_price: item.unit_price * quantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.1; // 10% tax (adjust as needed)
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const { subtotal, tax, total } = calculateTotals();

    try {
      const invoiceData = {
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        subtotal,
        tax_amount: tax,
        discount_amount: 0,
        total_amount: total,
        payment_method: paymentMethod,
        items: cart,
      };

      const createdInvoice = await window.electronAPI.invoices.create(invoiceData);
      
      // Get full invoice details for receipt
      const fullInvoice = await window.electronAPI.invoices.getById(createdInvoice.id);
      
      // Ask user if they want to print/download receipt
      const shouldPrint = confirm(
        'Invoice created successfully!\n\nWould you like to print the receipt?\n\nClick OK to print, Cancel to download PDF.'
      );
      
      if (shouldPrint) {
        // Print receipt
        setTimeout(() => {
          printReceipt(fullInvoice);
        }, 500);
      } else {
        // Download PDF
        setTimeout(() => {
          generateReceiptPDF(fullInvoice);
        }, 500);
      }
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      loadProducts(); // Refresh stock
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.size_display?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || p.product_type === filterType;
    
    const matchesSize = !sizeFilter || 
      p.size_display?.toLowerCase().includes(sizeFilter.toLowerCase());
    
    return matchesSearch && matchesType && matchesSize && p.stock_quantity > 0;
  });

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search products by name or size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="tire">Tires Only</option>
            <option value="alloy_wheel">Wheels Only</option>
            <option value="general">General</option>
          </select>
          <input
            type="text"
            placeholder="Filter by size (e.g., 205/55R16, 16x7)..."
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md text-left border border-gray-200 hover:border-primary-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.size_display && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        {product.size_display}
                      </div>
                    )}
                    {product.product_type === 'alloy_wheel' && product.wheel_stud_count && product.wheel_stud_type && (
                      <div className="text-xs font-semibold text-purple-700 mt-1">
                        🔩 {product.wheel_stud_count} Stud • {product.wheel_stud_type}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      Rs. {product.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Stock: {product.stock_quantity}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    product.product_type === 'tire' 
                      ? 'bg-blue-100 text-blue-800' 
                      : product.product_type === 'alloy_wheel'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.product_type === 'tire' ? 'Tire' : 
                     product.product_type === 'alloy_wheel' ? 'Wheel' : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cart</h3>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    <div className="text-xs text-gray-500">
                      Rs. {item.unit_price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartItem(item.product_id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%):</span>
              <span>Rs. {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;

