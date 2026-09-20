import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiTag, FiSearch, FiX, FiHash } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

/* Gradient palette cycles for category cards */
const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-red-500',
  'from-sky-400 to-blue-600',
  'from-pink-400 to-rose-600',
  'from-yellow-400 to-amber-500',
  'from-cyan-400 to-indigo-500',
  'from-lime-400 to-green-600',
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState('');
  const [deleting, setDeleting]     = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchCategories = async () => {
    const { data } = await api.get('/categories?active=false');
    setCategories(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/categories', formData);
    setShowModal(false);
    reset();
    fetchCategories();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    await api.delete(`/categories/${id}`);
    setDeleting(null);
    fetchCategories();
  };

  if (loading) return <PageLoader />;

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{categories.length} menu categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FiTag size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((cat, idx) => {
            const grad = GRADIENTS[idx % GRADIENTS.length];
            return (
              <div
                key={cat._id}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                <div className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3 shadow`}>
                    <FiTag size={16} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description || cat.slug || '—'}</p>
                </div>
                <button
                  onClick={() => handleDelete(cat._id)}
                  disabled={deleting === cat._id}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-gray-900 rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-4 animate-slideUp"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Category</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create a new menu category</p>
              </div>
              <button type="button" onClick={() => { setShowModal(false); reset(); }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <FiX size={15} />
              </button>
            </div>

            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                {...register('name', { required: true })}
                placeholder="Category name"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
              />
            </div>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Description (optional)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition resize-none"
            />

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition">
                {isSubmitting ? 'Saving…' : 'Save Category'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); reset(); }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        .animate-fadeIn  { animation: fadeIn  .35s ease both }
        .animate-slideUp { animation: slideUp .3s  ease both }
      `}</style>
    </div>
  );
};

export default Categories;
