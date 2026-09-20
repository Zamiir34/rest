import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiCheck, FiGlobe, FiPhone, FiMail, FiPercent, FiDollarSign, FiBriefcase, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

const FieldRow = ({ icon: Icon, label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex items-center gap-2 w-44 shrink-0">
      <Icon size={15} className="text-violet-500" />
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

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
    <div className="space-y-6 max-w-2xl animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure your restaurant details</p>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-sm font-medium animate-slideDown">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <FiCheck size={14} className="text-white" />
          </div>
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 dark:border-gray-800">
          Restaurant Info
        </p>

        <FieldRow icon={FiBriefcase} label="Restaurant Name">
          <input {...register('restaurantName')} placeholder="e.g. Savory Bites" className={inputCls} />
        </FieldRow>
        <FieldRow icon={FiMapPin} label="Address">
          <input {...register('address')} placeholder="Full address" className={inputCls} />
        </FieldRow>
        <FieldRow icon={FiPhone} label="Phone">
          <input {...register('phone')} placeholder="+1 (555) 000-0000" className={inputCls} />
        </FieldRow>
        <FieldRow icon={FiMail} label="Email">
          <input {...register('email')} type="email" placeholder="contact@restaurant.com" className={inputCls} />
        </FieldRow>

        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 dark:border-gray-800 pt-2">
          Financial
        </p>
        <FieldRow icon={FiPercent} label="Tax Rate (%)">
          <input {...register('taxRate')} type="number" step="0.1" placeholder="8.5" className={inputCls} />
        </FieldRow>
        <FieldRow icon={FiDollarSign} label="Currency">
          <input {...register('currency')} placeholder="USD" className={inputCls} />
        </FieldRow>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all duration-200"
          >
            <FiSave size={16} />
            {isSubmitting ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fadeIn    { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn   { animation: fadeIn    .35s ease both }
        .animate-slideDown { animation: slideDown .3s  ease both }
      `}</style>
    </div>
  );
};

export default Settings;
