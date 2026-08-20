import { useEffect, useState } from 'react';
import { FiPlus, FiAlertTriangle } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetch = async () => {
    const { data } = await api.get('/inventory?limit=50');
    setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/inventory', formData);
    setShowModal(false);
    reset();
    fetch();
  };

  const restock = async (id) => {
    const qty = prompt('Restock quantity:');
    if (qty) {
      await api.patch(`/inventory/${id}/restock`, { quantity: parseInt(qty, 10) });
      fetch();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
          <FiPlus /> Add Item
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Item', 'Quantity', 'Min Stock', 'Unit', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item._id}>
                <td className="px-6 py-4 font-medium">{item.name}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">{item.minStock}</td>
                <td className="px-6 py-4">{item.unit}</td>
                <td className="px-6 py-4">
                  {item.quantity <= item.minStock ? (
                    <Badge variant="danger"><FiAlertTriangle className="inline mr-1" />Low Stock</Badge>
                  ) : (
                    <Badge variant="success">OK</Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => restock(item._id)} className="text-primary-600 text-sm hover:underline">Restock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Add Inventory Item</h2>
            <input {...register('name', { required: true })} placeholder="Item name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('quantity', { required: true })} type="number" placeholder="Quantity" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('minStock')} type="number" placeholder="Min stock alert" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('unit')} placeholder="Unit (kg, liters)" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('expiryDate')} type="date" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
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

export default Inventory;
