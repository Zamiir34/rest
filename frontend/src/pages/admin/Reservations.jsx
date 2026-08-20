import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetch = async () => {
    const { data } = await api.get('/reservations');
    setReservations(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/reservations', formData);
    setShowModal(false);
    reset();
    fetch();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/reservations/${id}`, { status });
    fetch();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
          <FiPlus /> New Reservation
        </button>
      </div>

      <div className="grid gap-4">
        {reservations.map((r) => (
          <div key={r._id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="font-semibold">{r.customerName}</h3>
              <p className="text-sm text-gray-500">{r.phone} · {r.guests} guests</p>
              <p className="text-sm mt-1">{new Date(r.date).toLocaleDateString()} at {r.time}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={r.status === 'confirmed' ? 'success' : 'warning'}>{r.status}</Badge>
              <select value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}
                className="px-3 py-1 rounded-lg border dark:border-gray-600 dark:bg-gray-800 text-sm">
                {['pending', 'confirmed', 'seated', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">New Reservation</h2>
            <input {...register('customerName', { required: true })} placeholder="Customer Name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('phone', { required: true })} placeholder="Phone" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('guests', { required: true })} type="number" placeholder="Guests" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('date', { required: true })} type="date" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('time', { required: true })} type="time" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
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

export default Reservations;
