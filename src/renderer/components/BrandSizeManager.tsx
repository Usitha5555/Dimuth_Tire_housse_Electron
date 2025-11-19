import { useState, useEffect } from 'react';

interface Brand {
  id: number;
  name: string;
}

interface TireSize {
  id: number;
  width: number;
  aspect_ratio: number;
  diameter: number;
  load_index?: string;
  speed_rating?: string;
  size_display: string;
}

interface WheelSize {
  id: number;
  diameter: number;
  width: number;
  pcd?: string;
  offset?: string;
  center_bore?: string;
  stud_count?: number;
  stud_type?: string;
  size_display: string;
}

interface BrandSizeManagerProps {
  onClose: () => void;
}

const BrandSizeManager = ({ onClose }: BrandSizeManagerProps) => {
  const [activeTab, setActiveTab] = useState<'brands' | 'tires' | 'wheels'>('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tireSizes, setTireSizes] = useState<TireSize[]>([]);
  const [wheelSizes, setWheelSizes] = useState<WheelSize[]>([]);
  const [loading, setLoading] = useState(true);

  // Brand form
  const [newBrand, setNewBrand] = useState('');

  // Tire size form
  const [newTireSize, setNewTireSize] = useState({
    width: '',
    aspect_ratio: '',
    diameter: '',
    load_index: '',
    speed_rating: '',
  });

  // Wheel size form
  const [newWheelSize, setNewWheelSize] = useState({
    diameter: '',
    width: '',
    pcd: '',
    offset: '',
    center_bore: '',
    stud_count: '',
    stud_type: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.trim()) {
      alert('Please enter a brand name');
      return;
    }
    try {
      await window.electronAPI.brands.create(newBrand.trim());
      setNewBrand('');
      loadAll();
      alert('Brand added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add brand');
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await window.electronAPI.brands.delete(id);
        loadAll();
      } catch (error) {
        alert('Failed to delete brand');
      }
    }
  };

  const handleAddTireSize = async () => {
    if (!newTireSize.width || !newTireSize.aspect_ratio || !newTireSize.diameter) {
      alert('Please fill in width, aspect ratio, and diameter');
      return;
    }
    try {
      await window.electronAPI.tireSizes.create({
        width: parseInt(newTireSize.width),
        aspect_ratio: parseInt(newTireSize.aspect_ratio),
        diameter: parseInt(newTireSize.diameter),
        load_index: newTireSize.load_index || null,
        speed_rating: newTireSize.speed_rating || null,
      });
      setNewTireSize({ width: '', aspect_ratio: '', diameter: '', load_index: '', speed_rating: '' });
      loadAll();
      alert('Tire size added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add tire size');
    }
  };

  const handleDeleteTireSize = async (id: number) => {
    if (confirm('Are you sure you want to delete this tire size?')) {
      try {
        await window.electronAPI.tireSizes.delete(id);
        loadAll();
      } catch (error) {
        alert('Failed to delete tire size');
      }
    }
  };

  const handleAddWheelSize = async () => {
    if (!newWheelSize.diameter || !newWheelSize.width) {
      alert('Please fill in diameter and width');
      return;
    }
    if (!newWheelSize.stud_count || !newWheelSize.stud_type) {
      alert('Number of Studs and Stud Type are required for wheel sizes');
      return;
    }
    try {
      await window.electronAPI.wheelSizes.create({
        diameter: parseInt(newWheelSize.diameter),
        width: parseFloat(newWheelSize.width),
        pcd: newWheelSize.pcd || null,
        offset: newWheelSize.offset || null,
        center_bore: newWheelSize.center_bore || null,
        stud_count: newWheelSize.stud_count ? parseInt(newWheelSize.stud_count) : null,
        stud_type: newWheelSize.stud_type || null,
      });
      setNewWheelSize({ diameter: '', width: '', pcd: '', offset: '', center_bore: '', stud_count: '', stud_type: '' });
      loadAll();
      alert('Wheel size added successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to add wheel size');
    }
  };

  const handleDeleteWheelSize = async (id: number) => {
    if (confirm('Are you sure you want to delete this wheel size?')) {
      try {
        await window.electronAPI.wheelSizes.delete(id);
        loadAll();
      } catch (error) {
        alert('Failed to delete wheel size');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Brands & Sizes</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'brands'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500'
            }`}
          >
            Brands
          </button>
          <button
            onClick={() => setActiveTab('tires')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'tires'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500'
            }`}
          >
            Tire Sizes
          </button>
          <button
            onClick={() => setActiveTab('wheels')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'wheels'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500'
            }`}
          >
            Wheel Sizes
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Brands Tab */}
            {activeTab === 'brands' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter brand name..."
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleAddBrand}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Brand
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <span className="text-sm">{brand.name}</span>
                      <button
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tire Sizes Tab */}
            {activeTab === 'tires' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <input
                    type="number"
                    placeholder="Width (mm)"
                    value={newTireSize.width}
                    onChange={(e) =>
                      setNewTireSize({ ...newTireSize, width: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Aspect Ratio"
                    value={newTireSize.aspect_ratio}
                    onChange={(e) =>
                      setNewTireSize({ ...newTireSize, aspect_ratio: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Diameter"
                    value={newTireSize.diameter}
                    onChange={(e) =>
                      setNewTireSize({ ...newTireSize, diameter: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Load Index (optional)"
                    value={newTireSize.load_index}
                    onChange={(e) =>
                      setNewTireSize({ ...newTireSize, load_index: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Speed Rating (optional)"
                    value={newTireSize.speed_rating}
                    onChange={(e) =>
                      setNewTireSize({ ...newTireSize, speed_rating: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={handleAddTireSize}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Tire Size
                </button>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {tireSizes.map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <span className="text-sm font-medium">{size.size_display}</span>
                      <button
                        onClick={() => handleDeleteTireSize(size.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wheel Sizes Tab */}
            {activeTab === 'wheels' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input
                    type="number"
                    placeholder="Diameter *"
                    value={newWheelSize.diameter}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, diameter: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Width *"
                    value={newWheelSize.width}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, width: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Number of Studs *"
                    value={newWheelSize.stud_count}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, stud_count: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                    min="3"
                    max="8"
                    required
                  />
                  <select
                    value={newWheelSize.stud_type}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, stud_type: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded bg-white"
                    required
                  >
                    <option value="">Stud Type *</option>
                    <option value="Short Stud">Short Stud</option>
                    <option value="Long Stud">Long Stud</option>
                    <option value="Multi Stud">Multi Stud</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="PCD (optional)"
                    value={newWheelSize.pcd}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, pcd: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Offset (optional)"
                    value={newWheelSize.offset}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, offset: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Center Bore (optional)"
                    value={newWheelSize.center_bore}
                    onChange={(e) =>
                      setNewWheelSize({ ...newWheelSize, center_bore: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <button
                  onClick={handleAddWheelSize}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Add Wheel Size
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {wheelSizes.map((size) => (
                    <div
                      key={size.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium block">{size.size_display}</span>
                        {(size.stud_count || size.stud_type) && (
                          <span className="text-xs text-gray-500">
                            {size.stud_count && `${size.stud_count} Stud`}
                            {size.stud_count && size.stud_type && ' • '}
                            {size.stud_type}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteWheelSize(size.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrandSizeManager;

