import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/constants';

const Foods = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const fetchFoods = async () => {
    const { data } = await api.get(`/foods?search=${search}&limit=50`);
    setFoods(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFoods();
    api.get('/categories').then(({ data }) => setCategories(data.data));
  }, [search]);

  const onSubmit = async (formData) => {
    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => v && payload.append(k, v));
    if (formData.images?.[0]) payload.append('images', formData.images[0]);

    if (editItem) {
      await api.put(`/foods/${editItem._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await api.post('/foods', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    setShowModal(false);
    setEditItem(null);
    reset();
    fetchFoods();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this food item?')) {
      await api.delete(`/foods/${id}`);
      fetchFoods();
    }
  };

  const openEdit = (food) => {
    setEditItem(food);
    reset(food);
    setShowModal(true);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Food Management</h1>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={setSearch} className="w-64" />
          <button onClick={() => { setEditItem(null); reset({}); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
            <FiPlus /> Add Food
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foods.map((food) => (
          <div key={food._id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border dark:border-gray-800">
            <img src={food.images?.[0] || 'https://placehold.co/400x200'} alt={food.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{food.name}</h3>
                <div className="flex gap-1">
                  {food.isPopular && <Badge variant="primary">Popular</Badge>}
                  {!food.isAvailable && <Badge variant="danger">Unavailable</Badge>}
                </div>
              </div>
              <p className="text-primary-600 font-bold mt-1">{formatCurrency(food.price)}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{food.description}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(food)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 /></button>
                <button onClick={() => handleDelete(food._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editItem ? 'Edit Food' : 'Add Food'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input {...register('name', { required: true })} placeholder="Name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
              <textarea {...register('description')} placeholder="Description" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" rows={3} />
              <input {...register('price', { required: true })} type="number" step="0.01" placeholder="Price" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
              <select {...register('category', { required: true })} className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input {...register('discount')} type="number" placeholder="Discount %" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
              <input {...register('images')} type="file" accept="image/*" className="w-full" />
              <label className="flex items-center gap-2"><input {...register('isPopular')} type="checkbox" /> Popular</label>
              <label className="flex items-center gap-2"><input {...register('isAvailable')} type="checkbox" defaultChecked /> Available</label>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Foods;
