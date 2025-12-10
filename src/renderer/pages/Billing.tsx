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
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [quantityInputs, setQuantityInputs] = useState<{ [key: number]: string }>({});
  const [taxRate, setTaxRate] = useState<number>(0);

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
      // Initialize quantity input value
      setQuantityInputs({ ...quantityInputs, [product.id]: '1' });
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
    // Update quantity input value
    setQuantityInputs({ ...quantityInputs, [productId]: quantity.toString() });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
    // Remove quantity input value
    const newInputs = { ...quantityInputs };
    delete newInputs[productId];
    setQuantityInputs(newInputs);
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear all items from the cart?')) {
      setCart([]);
      setQuantityInputs({});
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * (taxRate / 100);
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
      setTaxRate(0);
      setQuantityInputs({});
      loadProducts(); // Refresh stock
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.size_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || p.product_type === filterType;
    
    return matchesSearch && matchesType && p.stock_quantity > 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 text-white">
          <h2 className="text-xl font-bold mb-1">Product Selection</h2>
          <p className="text-blue-100 text-sm">Select products to add to cart</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Search products by name, SKU, or size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="tire">Tires Only</option>
                <option value="alloy_wheel">Wheels Only</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  onClick={() => setViewMode('tile')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'tile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Tile View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : viewMode === 'tile' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-left border border-gray-200 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {product.name}
                    </div>
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
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0 ${
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
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-sm font-semibold text-blue-600">
                      Rs. {product.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: <span className="font-medium">{product.stock_quantity}</span>
                    </div>
                  </div>
                  <div className="text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size/Details
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <tr 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer active:bg-blue-100"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                              product.product_type === 'tire' 
                                ? 'bg-blue-100 text-blue-800' 
                                : product.product_type === 'alloy_wheel'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.product_type === 'tire' ? 'Tire' : 
                               product.product_type === 'alloy_wheel' ? 'Wheel' : 'General'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-sm text-gray-900">
                          {product.size_display && (
                            <div className="text-blue-600 font-medium">{product.size_display}</div>
                          )}
                          {product.product_type === 'alloy_wheel' && product.wheel_stud_count && product.wheel_stud_type && (
                            <div className="text-xs text-purple-700 mt-1">
                              🔩 {product.wheel_stud_count} Stud • {product.wheel_stud_type}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          Rs. {product.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{product.stock_quantity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 bg-opacity-70 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart & Checkout */}
      <div className="space-y-4 flex flex-col h-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Shopping Cart</h3>
              <p className="text-green-100 text-sm">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                title="Clear all items"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="mt-4 text-gray-500 text-lg">Cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-thin" style={{ maxHeight: '200px' }}>
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-white rounded border border-gray-200 hover:border-green-300 transition-all"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-xs text-gray-900 truncate">{item.product_name}</div>
                      <div className="text-xs text-gray-600">
                        Rs.{item.unit_price.toFixed(2)} × {item.quantity} = Rs.{item.total_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => updateCartItem(item.product_id, item.quantity - 1)}
                        className="px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 font-medium text-gray-700 text-xs transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantityInputs[item.product_id] !== undefined ? quantityInputs[item.product_id] : item.quantity.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          setQuantityInputs({ ...quantityInputs, [item.product_id]: value });
                        }}
                        onBlur={(e) => {
                          const inputValue = e.target.value.trim();
                          const newQuantity = parseInt(inputValue) || 1;
                          const product = products.find((p) => p.id === item.product_id);
                          if (product) {
                            if (newQuantity < 1) {
                              updateCartItem(item.product_id, 1);
                            } else if (newQuantity > product.stock_quantity) {
                              alert(`Only ${product.stock_quantity} items available in stock`);
                              updateCartItem(item.product_id, product.stock_quantity);
                            } else {
                              updateCartItem(item.product_id, newQuantity);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="text-xs font-bold text-gray-900 w-12 text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                        className="px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 font-medium text-gray-700 text-xs transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="ml-1 px-1.5 py-0.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 space-y-1.5 mb-4 flex-shrink-0">
                <div className="flex justify-between text-xs text-gray-700">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tax:</span>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="px-2 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={18}>18%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>
                  <span className="font-semibold">Rs. {tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-1.5 mt-1.5">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-green-600">Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-auto space-y-4 flex-shrink-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Payment</option>
              </select>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
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

