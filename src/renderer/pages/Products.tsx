import { useEffect, useState } from 'react';
import StockAdjustment from '../components/StockAdjustment';
import BrandSizeManager from '../components/BrandSizeManager';
import { Product, ProductType } from '../types';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const [showBrandSizeManager, setShowBrandSizeManager] = useState(false);

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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await window.electronAPI.products.delete(id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.size_display?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || p.product_type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products by name, SKU, or size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Products</option>
            <option value="tire">Tires</option>
            <option value="alloy_wheel">Alloy Wheels</option>
            <option value="general">General</option>
          </select>
          <button
            onClick={() => setShowBrandSizeManager(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Manage Brands & Sizes
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type/Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="text-sm text-gray-500">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.product_type === 'tire' 
                        ? 'bg-blue-100 text-blue-800' 
                        : product.product_type === 'alloy_wheel'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.product_type === 'tire' ? 'Tire' : 
                       product.product_type === 'alloy_wheel' ? 'Wheel' : 'General'}
                    </span>
                    {product.size_display && (
                      <div className="text-xs text-gray-600 mt-1">
                        {product.size_display}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sku || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rs. {product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${
                      product.stock_quantity <= product.low_stock_threshold
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setAdjustingProduct(product);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}

      {adjustingProduct && (
        <StockAdjustment
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            loadProducts();
            setAdjustingProduct(null);
          }}
        />
      )}

      {showBrandSizeManager && (
        <BrandSizeManager onClose={() => setShowBrandSizeManager(false)} />
      )}
    </div>
  );
};

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal = ({ product, onClose, onSave }: ProductModalProps) => {
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [tireSizes, setTireSizes] = useState<Array<{ id: number; size_display: string; width: number; aspect_ratio: number; diameter: number; load_index?: string; speed_rating?: string }>>([]);
  const [wheelSizes, setWheelSizes] = useState<Array<{ id: number; size_display: string; diameter: number; width: number }>>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddTireSize, setShowAddTireSize] = useState(false);
  const [showAddWheelSize, setShowAddWheelSize] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    sku: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    low_stock_threshold: '10',
    category: '',
    product_type: 'general' as ProductType,
    // Tire fields
    tire_size_id: '',
    tire_width: '',
    tire_aspect_ratio: '',
    tire_diameter: '',
    tire_load_index: '',
    tire_speed_rating: '',
    // Wheel fields
    wheel_size_id: '',
    wheel_diameter: '',
    wheel_width: '',
    wheel_pcd: '',
    wheel_offset: '',
    wheel_center_bore: '',
    wheel_stud_count: '',
    wheel_stud_type: '',
    size_display: '',
  });

  useEffect(() => {
    loadBrandsAndSizes();
  }, []);

  useEffect(() => {
    if (product) {
      // Extract brand from product name if it starts with a brand name
      const brandMatch = brands.find(b => product.name.toUpperCase().startsWith(b.name.toUpperCase()));
      
      setFormData({
        name: product.name,
        brand: brandMatch?.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price.toString(),
        cost_price: product.cost_price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        low_stock_threshold: product.low_stock_threshold.toString(),
        category: product.category || '',
        product_type: product.product_type || 'general',
        tire_size_id: '',
        tire_width: product.tire_width?.toString() || '',
        tire_aspect_ratio: product.tire_aspect_ratio?.toString() || '',
        tire_diameter: product.tire_diameter?.toString() || '',
        tire_load_index: product.tire_load_index || '',
        tire_speed_rating: product.tire_speed_rating || '',
        wheel_size_id: '',
        wheel_diameter: product.wheel_diameter?.toString() || '',
        wheel_width: product.wheel_width?.toString() || '',
        wheel_pcd: product.wheel_pcd || '',
        wheel_offset: product.wheel_offset || '',
        wheel_center_bore: product.wheel_center_bore || '',
        wheel_stud_count: product.wheel_stud_count?.toString() || '',
        wheel_stud_type: product.wheel_stud_type || '',
        size_display: product.size_display || '',
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        brand: '',
        description: '',
        sku: '',
        price: '',
        cost_price: '',
        stock_quantity: '',
        low_stock_threshold: '10',
        category: '',
        product_type: 'general',
        tire_size_id: '',
        tire_width: '',
        tire_aspect_ratio: '',
        tire_diameter: '',
        tire_load_index: '',
        tire_speed_rating: '',
        wheel_size_id: '',
        wheel_diameter: '',
        wheel_width: '',
        wheel_pcd: '',
        wheel_offset: '',
        wheel_center_bore: '',
        wheel_stud_count: '',
        wheel_stud_type: '',
        size_display: '',
      });
    }
  }, [product, brands]);

  const loadBrandsAndSizes = async () => {
    try {
      const [brandsData, tireSizesData, wheelSizesData] = await Promise.all([
        window.electronAPI.brands.getAll(),
        window.electronAPI.tireSizes.getAll(),
        window.electronAPI.wheelSizes.getAll(),
      ]);
      setBrands(brandsData);
      setTireSizes(tireSizesData);
      setWheelSizes(wheelSizesData);
    } catch (error) {
      console.error('Error loading brands and sizes:', error);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      alert('Please enter a brand name');
      return;
    }
    try {
      await window.electronAPI.brands.create(newBrandName.trim());
      setNewBrandName('');
      setShowAddBrand(false);
      await loadBrandsAndSizes();
      // Auto-select the newly added brand
      const newBrand = brands.find(b => b.name === newBrandName.trim()) || 
        (await window.electronAPI.brands.getAll()).find((b: any) => b.name === newBrandName.trim());
      if (newBrand) {
        setFormData(prev => ({ ...prev, brand: newBrand.name }));
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add brand');
    }
  };

  const handleAddTireSizeInline = async () => {
    if (!formData.tire_width || !formData.tire_aspect_ratio || !formData.tire_diameter) {
      alert('Please fill in width, aspect ratio, and diameter');
      return;
    }
    try {
      const newSize = await window.electronAPI.tireSizes.create({
        width: parseInt(formData.tire_width),
        aspect_ratio: parseInt(formData.tire_aspect_ratio),
        diameter: parseInt(formData.tire_diameter),
        load_index: formData.tire_load_index || null,
        speed_rating: formData.tire_speed_rating || null,
      });
      await loadBrandsAndSizes();
      // Auto-select the newly added size
      setFormData(prev => ({ ...prev, tire_size_id: newSize.id.toString() }));
      setShowAddTireSize(false);
      alert('Tire size added and selected!');
    } catch (error: any) {
      alert(error.message || 'Failed to add tire size');
    }
  };

  const handleAddWheelSizeInline = async () => {
    if (!formData.wheel_diameter || !formData.wheel_width) {
      alert('Please fill in diameter and width');
      return;
    }
    try {
      const newSize = await window.electronAPI.wheelSizes.create({
        diameter: parseInt(formData.wheel_diameter),
        width: parseFloat(formData.wheel_width),
        pcd: formData.wheel_pcd || null,
        offset: formData.wheel_offset || null,
        center_bore: formData.wheel_center_bore || null,
        stud_count: formData.wheel_stud_count ? parseInt(formData.wheel_stud_count) : null,
        stud_type: formData.wheel_stud_type || null,
      });
      await loadBrandsAndSizes();
      // Auto-select the newly added size
      setFormData(prev => ({ ...prev, wheel_size_id: newSize.id.toString() }));
      setShowAddWheelSize(false);
      alert('Wheel size added and selected!');
    } catch (error: any) {
      alert(error.message || 'Failed to add wheel size');
    }
  };

  const handleTireSizeSelect = (sizeId: string) => {
    const size = tireSizes.find(s => s.id.toString() === sizeId);
    if (size) {
      setFormData({
        ...formData,
        tire_size_id: sizeId,
        tire_width: size.width.toString(),
        tire_aspect_ratio: size.aspect_ratio.toString(),
        tire_diameter: size.diameter.toString(),
        tire_load_index: size.load_index || '',
        tire_speed_rating: size.speed_rating || '',
        size_display: size.size_display,
      });
    }
  };

  const handleWheelSizeSelect = (sizeId: string) => {
    const size = wheelSizes.find(s => s.id.toString() === sizeId);
    if (size) {
      setFormData({
        ...formData,
        wheel_size_id: sizeId,
        wheel_diameter: size.diameter.toString(),
        wheel_width: size.width.toString(),
        wheel_pcd: size.pcd || '',
        wheel_offset: size.offset || '',
        wheel_center_bore: size.center_bore || '',
        wheel_stud_count: size.stud_count?.toString() || '',
        wheel_stud_type: size.stud_type || '',
        size_display: size.size_display,
      });
    }
  };

  // Auto-generate size_display based on product type
  useEffect(() => {
    if (formData.product_type === 'tire') {
      if (formData.tire_width && formData.tire_aspect_ratio && formData.tire_diameter) {
        const size = `${formData.tire_width}/${formData.tire_aspect_ratio}R${formData.tire_diameter}`;
        if (formData.tire_load_index && formData.tire_speed_rating) {
          setFormData(prev => ({ ...prev, size_display: `${size} ${formData.tire_load_index}${formData.tire_speed_rating}` }));
        } else {
          setFormData(prev => ({ ...prev, size_display: size }));
        }
      }
    } else if (formData.product_type === 'alloy_wheel') {
      if (formData.wheel_diameter && formData.wheel_width) {
        let display = `${formData.wheel_diameter}x${formData.wheel_width}`;
        if (formData.wheel_pcd) display += ` PCD:${formData.wheel_pcd}`;
        if (formData.wheel_stud_count) display += ` ${formData.wheel_stud_count} Stud`;
        if (formData.wheel_stud_type) display += ` (${formData.wheel_stud_type})`;
        setFormData(prev => ({ ...prev, size_display: display }));
      }
    }
  }, [
    formData.product_type,
    formData.tire_width,
    formData.tire_aspect_ratio,
    formData.tire_diameter,
    formData.tire_load_index,
    formData.tire_speed_rating,
    formData.wheel_diameter,
    formData.wheel_width,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData: any = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku || null,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        category: formData.category || null,
        product_type: formData.product_type,
        size_display: formData.size_display || null,
      };

      // Add tire-specific fields
      if (formData.product_type === 'tire') {
        productData.tire_width = formData.tire_width ? parseInt(formData.tire_width) : null;
        productData.tire_aspect_ratio = formData.tire_aspect_ratio ? parseInt(formData.tire_aspect_ratio) : null;
        productData.tire_diameter = formData.tire_diameter ? parseInt(formData.tire_diameter) : null;
        productData.tire_load_index = formData.tire_load_index || null;
        productData.tire_speed_rating = formData.tire_speed_rating || null;
      }

      // Add wheel-specific fields
      if (formData.product_type === 'alloy_wheel') {
        productData.wheel_diameter = formData.wheel_diameter ? parseInt(formData.wheel_diameter) : null;
        productData.wheel_width = formData.wheel_width ? parseFloat(formData.wheel_width) : null;
        productData.wheel_pcd = formData.wheel_pcd || null;
        productData.wheel_offset = formData.wheel_offset || null;
        productData.wheel_center_bore = formData.wheel_center_bore || null;
        productData.wheel_stud_count = formData.wheel_stud_count ? parseInt(formData.wheel_stud_count) : null;
        productData.wheel_stud_type = formData.wheel_stud_type || null;
      }

      if (product) {
        await window.electronAPI.products.update(product.id, productData);
      } else {
        await window.electronAPI.products.create(productData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type *
            </label>
            <select
              required
              value={formData.product_type}
              onChange={(e) =>
                setFormData({ ...formData, product_type: e.target.value as ProductType, tire_size_id: '', wheel_size_id: '', size_display: '' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="general">General Product</option>
              <option value="tire">Tire</option>
              <option value="alloy_wheel">Alloy Wheel</option>
            </select>
          </div>

          {/* Brand and Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.brand}
                  onChange={(e) => {
                    const brand = e.target.value;
                    setFormData({ ...formData, brand });
                    if (brand && !formData.name) {
                      setFormData(prev => ({ ...prev, brand, name: brand }));
                    } else if (brand && formData.name && !formData.name.toUpperCase().startsWith(brand.toUpperCase())) {
                      setFormData(prev => ({ ...prev, brand, name: `${brand} ${prev.name}` }));
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddBrand(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-bold"
                  title="Add new brand"
                >
                  +
                </button>
              </div>
              {showAddBrand && (
                <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter brand name"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBrand(false);
                        setNewBrandName('');
                      }}
                      className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Tire Model, Wheel Model"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
          {/* Tire Size Fields */}
          {formData.product_type === 'tire' && (
            <div className="border-t-2 border-blue-300 pt-4 space-y-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🔵 Tire Size Information</h3>
              
              {/* Predefined Sizes Section */}
              <div className="bg-white p-3 rounded border">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Select from Predefined Sizes
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.tire_size_id}
                    onChange={(e) => handleTireSizeSelect(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">-- Select Tire Size --</option>
                    {tireSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.size_display}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddTireSize(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-bold"
                    title="Add new tire size"
                  >
                    + Add Size
                  </button>
                </div>
                {showAddTireSize && (
                  <div className="mt-3 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                    <p className="text-sm font-bold text-gray-800 mb-3">➕ Add New Tire Size to Database</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Width (mm) *"
                        value={formData.tire_width}
                        onChange={(e) =>
                          setFormData({ ...formData, tire_width: e.target.value, tire_size_id: '' })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Aspect Ratio *"
                        value={formData.tire_aspect_ratio}
                        onChange={(e) =>
                          setFormData({ ...formData, tire_aspect_ratio: e.target.value, tire_size_id: '' })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Diameter (inch) *"
                        value={formData.tire_diameter}
                        onChange={(e) =>
                          setFormData({ ...formData, tire_diameter: e.target.value, tire_size_id: '' })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Load Index (optional)"
                        value={formData.tire_load_index}
                        onChange={(e) =>
                          setFormData({ ...formData, tire_load_index: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Speed Rating (optional)"
                        value={formData.tire_speed_rating}
                        onChange={(e) =>
                          setFormData({ ...formData, tire_speed_rating: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddTireSizeInline}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        ✓ Save Size & Use It
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddTireSize(false)}
                        className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Manual Entry Section */}
              <div className="bg-white p-3 rounded border mt-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✏️ OR Enter Size Manually (without saving to database):
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Width (mm) *
                    </label>
                    <input
                      type="number"
                      value={formData.tire_width}
                      onChange={(e) =>
                        setFormData({ ...formData, tire_width: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="205"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aspect Ratio *
                    </label>
                    <input
                      type="number"
                      value={formData.tire_aspect_ratio}
                      onChange={(e) =>
                        setFormData({ ...formData, tire_aspect_ratio: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="55"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Diameter (inch) *
                    </label>
                    <input
                      type="number"
                      value={formData.tire_diameter}
                      onChange={(e) =>
                        setFormData({ ...formData, tire_diameter: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="16"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Load Index
                    </label>
                    <input
                      type="text"
                      value={formData.tire_load_index}
                      onChange={(e) =>
                        setFormData({ ...formData, tire_load_index: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="91"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Speed Rating
                    </label>
                    <input
                      type="text"
                      value={formData.tire_speed_rating}
                      onChange={(e) =>
                        setFormData({ ...formData, tire_speed_rating: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="V, H, W"
                    />
                  </div>
                </div>
                {formData.size_display && (
                  <div className="bg-blue-50 p-3 rounded mt-3">
                    <p className="text-sm text-gray-600">
                      Size Display: <span className="font-semibold">{formData.size_display}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alloy Wheel Size Fields */}
          {formData.product_type === 'alloy_wheel' && (
            <div className="border-t-2 border-purple-300 pt-4 space-y-4 bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🟣 Alloy Wheel Size Information</h3>
              
              {/* Predefined Sizes Section */}
              <div className="bg-white p-3 rounded border">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Select from Predefined Sizes
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.wheel_size_id}
                    onChange={(e) => handleWheelSizeSelect(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="">-- Select Wheel Size --</option>
                    {wheelSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.size_display}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddWheelSize(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-bold"
                    title="Add new wheel size"
                  >
                    + Add Size
                  </button>
                </div>
                {showAddWheelSize && (
                  <div className="mt-3 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                    <p className="text-sm font-bold text-gray-800 mb-3">➕ Add New Wheel Size to Database</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Diameter (inch) *"
                        value={formData.wheel_diameter}
                        onChange={(e) =>
                          setFormData({ ...formData, wheel_diameter: e.target.value, wheel_size_id: '' })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Width (inch) *"
                        value={formData.wheel_width}
                        onChange={(e) =>
                          setFormData({ ...formData, wheel_width: e.target.value, wheel_size_id: '' })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="PCD (optional)"
                        value={formData.wheel_pcd}
                        onChange={(e) =>
                          setFormData({ ...formData, wheel_pcd: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Offset (optional)"
                        value={formData.wheel_offset}
                        onChange={(e) =>
                          setFormData({ ...formData, wheel_offset: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Center Bore (optional)"
                        value={formData.wheel_center_bore}
                        onChange={(e) =>
                          setFormData({ ...formData, wheel_center_bore: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Studs</label>
                        <input
                          type="number"
                          placeholder="4, 5, 6..."
                          value={formData.wheel_stud_count}
                          onChange={(e) =>
                            setFormData({ ...formData, wheel_stud_count: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                          min="3"
                          max="8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Stud Type</label>
                        <select
                          value={formData.wheel_stud_type}
                          onChange={(e) =>
                            setFormData({ ...formData, wheel_stud_type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                        >
                          <option value="">-- Select Type --</option>
                          <option value="Short Stud">Short Stud</option>
                          <option value="Long Stud">Long Stud</option>
                          <option value="Multi Stud">Multi Stud</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddWheelSizeInline}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        ✓ Save Size & Use It
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddWheelSize(false)}
                        className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Manual Entry Section */}
              <div className="bg-white p-3 rounded border mt-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✏️ OR Enter Size Manually (without saving to database):
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Diameter (inch) *
                    </label>
                    <input
                      type="number"
                      value={formData.wheel_diameter}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_diameter: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Width (inch) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.wheel_width}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_width: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="7.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      PCD (Pattern)
                    </label>
                    <input
                      type="text"
                      value={formData.wheel_pcd}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_pcd: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="5x114.3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Offset (ET)
                    </label>
                    <input
                      type="text"
                      value={formData.wheel_offset}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_offset: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="ET35"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Center Bore (mm)
                    </label>
                    <input
                      type="text"
                      value={formData.wheel_center_bore}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_center_bore: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="67.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Studs *
                    </label>
                    <input
                      type="number"
                      value={formData.wheel_stud_count}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_stud_count: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="4, 5, 6..."
                      min="3"
                      max="8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stud Type *
                    </label>
                    <select
                      value={formData.wheel_stud_type}
                      onChange={(e) =>
                        setFormData({ ...formData, wheel_stud_type: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="Short Stud">Short Stud</option>
                      <option value="Long Stud">Long Stud</option>
                      <option value="Multi Stud">Multi Stud</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {formData.size_display && (
                  <div className="bg-purple-50 p-3 rounded mt-3">
                    <p className="text-sm text-gray-600">
                      Size Display: <span className="font-semibold">{formData.size_display}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cost Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    low_stock_threshold: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Products;

