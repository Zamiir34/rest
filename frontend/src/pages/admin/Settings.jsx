import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      reset(data.data);
      setLoading(false);
    });
  }, [reset]);

  const onSubmit = async (formData) => {
    await api.put('/settings', formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      {saved && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm">Settings saved successfully!</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800 space-y-4">
        <input {...register('restaurantName')} placeholder="Restaurant Name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <input {...register('address')} placeholder="Address" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <input {...register('phone')} placeholder="Phone" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <input {...register('email')} placeholder="Email" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <input {...register('taxRate')} type="number" step="0.1" placeholder="Tax Rate (%)" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <input {...register('currency')} placeholder="Currency" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
        <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold">Save Settings</button>
      </form>
    </div>
  );
};

export default Settings;
