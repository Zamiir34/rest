import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUploadCloud, FiImage, FiX, FiCheck, FiSearch } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/constants';
import { getFoodImageUrl, handleImageError } from '../../utils/imageUtils';

const Foods = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Image upload & preview state
  const [imageTab, setImageTab] = useState('file'); // 'file' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchFoods = async () => {
    const params = new URLSearchParams({ search, limit: 100 });
    if (selectedCategory) params.append('category', selectedCategory);
    const { data } = await api.get(`/foods?${params}`);
    setFoods(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFoods();
    api.get('/categories').then(({ data }) => setCategories(data.data));
  }, [search, selectedCategory]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setCustomImageUrl(url);
    setPreviewUrl(url);
  };

  const openAddModal = () => {
    setEditItem(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setCustomImageUrl('');
    setImageTab('file');
    reset({
      name: '',
      description: '',
      price: '',
      category: categories[0]?._id || '',
      discount: 0,
      isPopular: false,
      isAvailable: true,
    });
    setShowModal(true);
  };

  const openEditModal = (food) => {
    setEditItem(food);
    setSelectedFile(null);
    const currentImg = food.images?.[0] || '';
    setPreviewUrl(currentImg);
    setCustomImageUrl(currentImg);
    setImageTab(currentImg.startsWith('http') && !currentImg.includes('/uploads/') ? 'url' : 'file');
    reset({
      name: food.name,
      description: food.description || '',
      price: food.price,
      category: food.category?._id || food.category,
      discount: food.discount || 0,
      isPopular: food.isPopular || false,
      isAvailable: food.isAvailable !== false,
    });
    setShowModal(true);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== 'images' && v !== undefined && v !== null) {
          payload.append(k, v);
        }
      });

      if (selectedFile) {
        payload.append('images', selectedFile);
      } else if (customImageUrl.trim()) {
        payload.append('imageUrl', customImageUrl.trim());
      }

      if (editItem) {
        await api.put(`/foods/${editItem._id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/foods', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setShowModal(false);
      setEditItem(null);
      reset();
      fetchFoods();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save food');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this food item?')) {
      await api.delete(`/foods/${id}`);
      fetchFoods();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="ds-page">
      {/* Page Header */}
      <PageHeader
        title="Food Menu Management"
        subtitle="Manage restaurant dishes, pricing, categories, and upload appetizing food photography"
        action={
          <button onClick={openAddModal} className="ds-btn-primary">
            <FiPlus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !selectedCategory
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat._id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search dishes..." />
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {foods.map((food) => (
          <div
            key={food._id}
            className="ds-card-hover overflow-hidden flex flex-col justify-between !p-0 rounded-2xl"
          >
            <div>
              {/* Dish Photo */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={getFoodImageUrl(food)}
                  alt={food.name}
                  loading="lazy"
                  onError={(e) => handleImageError(e, food)}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  {food.isPopular && <Badge variant="primary">Popular</Badge>}
                  {!food.isAvailable && <Badge variant="danger">Unavailable</Badge>}
                  {food.discount > 0 && <Badge variant="success">-{food.discount}%</Badge>}
                </div>
              </div>

              {/* Food Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    {food.name}
                  </h3>
                  <span className="font-black text-primary-600 dark:text-primary-400 shrink-0">
                    {formatCurrency(food.price)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {food.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <span className="text-[11px] font-semibold text-slate-400">
                {food.category?.name || 'Dish'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(food)}
                  title="Edit dish & photo"
                  className="p-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(food._id)}
                  title="Delete dish"
                  className="p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Food Modal with Image Upload & Live Preview */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editItem ? 'Edit Dish & Image' : 'Add New Dish'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Dish Image Upload Section with Live Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Food Photo / Image
                </label>

                {/* Tabs: Upload File vs Image URL */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setImageTab('file')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      imageTab === 'file'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      imageTab === 'url'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Paste Image URL
                  </button>
                </div>

                {/* Live Image Preview */}
                {previewUrl && (
                  <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewUrl('')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl('');
                        setSelectedFile(null);
                        setCustomImageUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Remove image"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* File Upload Input */}
                {imageTab === 'file' ? (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                    <FiUploadCloud className="w-7 h-7 text-primary-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedFile ? selectedFile.name : 'Click to select food photo'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <FiImage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={handleUrlChange}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dish Name *
                </label>
                <input
                  {...register('name', { required: true })}
                  placeholder="e.g. Grilled Chicken Salad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Fresh ingredients, savory spices, and side salad..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Price ($) *
                  </label>
                  <input
                    {...register('price', { required: true })}
                    type="number"
                    step="0.01"
                    placeholder="12.99"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount (%)
                  </label>
                  <input
                    {...register('discount')}
                    type="number"
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  {...register('category', { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    {...register('isPopular')}
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Popular Item</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    {...register('isAvailable')}
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span>Available in Menu</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-primary-500 dark:hover:bg-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving Dish...' : editItem ? 'Update Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Foods;
