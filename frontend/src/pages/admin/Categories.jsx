import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetch = async () => {
    const { data } = await api.get('/categories?active=false');
    setCategories(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/categories', formData);
    setShowModal(false);
    reset();
    fetch();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete category?')) {
      await api.delete(`/categories/${id}`);
      fetch();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
          <FiPlus /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-sm text-gray-500">{cat.description || cat.slug}</p>
            </div>
            <button onClick={() => handleDelete(cat._id)} className="text-red-500"><FiTrash2 /></button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Add Category</h2>
            <input {...register('name', { required: true })} placeholder="Category name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <textarea {...register('description')} placeholder="Description" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl">Save</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Categories;
