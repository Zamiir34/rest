import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiPlus, FiDownload, FiGrid, FiUsers, FiCheckCircle, FiX,
  FiHash, FiTrash2, FiRefreshCw, FiAlertCircle, FiLayers
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

const STATUS_CONFIG = {
  available: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400', bar: 'from-emerald-400 to-teal-500' },
  reserved:  { bg: 'bg-yellow-100 dark:bg-yellow-900/30',  text: 'text-yellow-700 dark:text-yellow-300',  dot: 'bg-yellow-400',  bar: 'from-yellow-400 to-amber-500' },
  occupied:  { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-300',        dot: 'bg-red-400',     bar: 'from-red-400 to-rose-600'    },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, gradient }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
    <div className={`absolute -right-3 -top-3 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`} />
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
    <div className={`mt-3 w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow`}>
      <Icon size={15} className="text-white" />
    </div>
  </div>
);

const Tables = () => {
  const { user } = useSelector((state) => state.auth);
  const [tables, setTables]             = useState([]);
  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedQR, setSelectedQR]     = useState(null);
  const [formError, setFormError]       = useState('');
  const [toast, setToast]               = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting, errors } } = useForm();

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables?limit=100');
      setTables(data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    if (user?.role === 'super_admin') {
      try {
        const { data } = await api.get('/restaurants?limit=100');
        setRestaurants(data.data || []);
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      }
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRestaurants();
  }, [user]);

  // Compute next available table number from existing tables
  const getSuggestedNumber = (currentTables) => {
    const tbl = currentTables ?? tables;
    if (!tbl.length) return 'T01';
    const numbers = tbl
      .map((t) => {
        const match = t.tableNumber?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(Boolean);
    const max = numbers.length ? Math.max(...numbers) : tbl.length;
    return `T${String(max + 1).padStart(2, '0')}`;
  };

  const openModal = () => {
    setFormError('');
    reset({ tableNumber: getSuggestedNumber(), capacity: 4, restaurant: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    reset();
  };

  const onSubmit = async (formData) => {
    setFormError('');
    try {
      await api.post('/tables', {
        ...formData,
        capacity: Number(formData.capacity),
      });
      closeModal();
      const nextNum = getSuggestedNumber();
      showToast(`Table "${formData.tableNumber}" created successfully!`);
      await fetchTables();
      // after tables reload, the suggested number will auto-update
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create table. Please check input values.';
      setFormError(msg);
      // Update suggestion to next available in case the number they entered was duplicate
      setValue('tableNumber', getSuggestedNumber());
    }
  };

  const handleDelete = async (id, tableNumber) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableNumber}?`)) return;
    try {
      setActionLoading(`delete_${id}`);
      await api.delete(`/tables/${id}`);
      showToast(`Table ${tableNumber} deleted`);
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete table', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateQR = async (id, tableNumber) => {
    try {
      setActionLoading(`qr_${id}`);
      await api.post(`/tables/${id}/regenerate-qr`);
      showToast(`QR Code regenerated for Table ${tableNumber}`);
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to regenerate QR', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const downloadQR = async (id, tableNumber) => {
    try {
      const { data } = await api.get(`/tables/${id}/download-qr`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `table-${tableNumber}.png`;
      a.click();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download QR code', 'error');
    }
  };

  if (loading) return <PageLoader />;

  const stCount = (s) => tables.filter((t) => t.status === s).length;
  // suggestedNumber used only as placeholder hint; actual default is set via openModal → reset()
  const suggestedNumber = getSuggestedNumber();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-slideUp">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          >
            {toast.type === 'error' ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Table Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tables.length} tables configured</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <FiPlus size={16} /> Add Table
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tables" value={tables.length}        icon={FiGrid}         gradient="from-violet-500 to-purple-600" />
        <StatCard label="Available"   value={stCount('available')} icon={FiCheckCircle}  gradient="from-emerald-400 to-teal-600"  />
        <StatCard label="Occupied"    value={stCount('occupied')}  icon={FiUsers}        gradient="from-red-400 to-rose-600"      />
        <StatCard label="Reserved"    value={stCount('reserved')}  icon={FiGrid}         gradient="from-yellow-400 to-amber-500"  />
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
          return (
            <div key={table._id} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${cfg.bar}`} />
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.bar} flex items-center justify-center text-white font-black text-lg shadow`}>
                      {table.tableNumber}
                    </div>
                    <div>
                      {table.restaurant?.name && (
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                          {table.restaurant.name}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <FiUsers size={11} /> Capacity: <span className="font-semibold text-gray-600 dark:text-gray-300">{table.capacity}</span>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={table.status} />
                </div>

                {/* QR Code */}
                {table.qrCodeUrl && (
                  <div
                    className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    onClick={() => setSelectedQR(table)}
                  >
                    <QRCodeSVG value={table.qrCodeUrl} size={110} />
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center truncate">{table.qrCodeUrl}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => downloadQR(table._id, table.tableNumber)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                  >
                    <FiDownload size={13} /> QR
                  </button>

                  <button
                    onClick={() => handleRegenerateQR(table._id, table.tableNumber)}
                    disabled={actionLoading === `qr_${table._id}`}
                    title="Regenerate QR Code"
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-violet-600 dark:hover:text-violet-400 transition disabled:opacity-50"
                  >
                    <FiRefreshCw size={13} className={actionLoading === `qr_${table._id}` ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={() => handleDelete(table._id, table.tableNumber)}
                    disabled={actionLoading === `delete_${table._id}`}
                    title="Delete Table"
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 transition disabled:opacity-50"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Table</h2>
                <p className="text-xs text-gray-400 mt-0.5">Creates a QR code automatically</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <FiAlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Restaurant Selector for super_admin */}
            {user?.role === 'super_admin' && restaurants.length > 0 && (
              <div className="relative">
                <FiLayers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <select
                  {...register('restaurant')}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                >
                  <option value="">Select Restaurant (Optional)</option>
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Table Number</label>
              <div className="relative">
                <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register('tableNumber', { required: 'Table number is required' })}
                  placeholder={`e.g. ${suggestedNumber}`}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Seating Capacity</label>
              <div className="relative">
                <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register('capacity', { required: 'Capacity is required', min: { value: 1, message: 'Capacity must be at least 1' } })}
                  type="number"
                  min="1"
                  placeholder="Seating Capacity (e.g. 4)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-violet-500/20"
              >
                {isSubmitting ? 'Creating…' : 'Create & Generate QR'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Preview Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 p-8 rounded-2xl text-center shadow-2xl animate-slideUp max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold">Table QR Code</p>
            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
              <QRCodeSVG value={selectedQR.qrCodeUrl} size={220} />
            </div>
            <p className="font-bold text-2xl text-gray-900 dark:text-white">{selectedQR.tableNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Scan to order from this table</p>
            <button
              onClick={() => setSelectedQR(null)}
              className="mt-4 w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>
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

export default Tables;
