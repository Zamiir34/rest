import { useEffect, useState } from 'react';
import { FiPlus, FiCalendar, FiPhone, FiUsers, FiClock, FiX, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';

const STATUS_CONFIG = {
  pending:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-400' },
  confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  seated:    { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-400' },
  completed: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-400' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-400' },
};

const STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchReservations = async () => {
    const { data } = await api.get('/reservations');
    setReservations(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/reservations', formData);
    setShowModal(false);
    reset();
    fetchReservations();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/reservations/${id}`, { status });
    fetchReservations();
  };

  if (loading) return <PageLoader />;

  const statusCount = (s) => reservations.filter((r) => r.status === s).length;
  const filtered = statusFilter === 'all' ? reservations : reservations.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reservations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reservations.length} total bookings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <FiPlus size={16} /> New Reservation
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total"     value={reservations.length}       icon={FiCalendar} gradient="from-violet-500 to-purple-600" />
        <StatCard label="Pending"   value={statusCount('pending')}    icon={FiClock}    gradient="from-yellow-400 to-amber-500"  />
        <StatCard label="Confirmed" value={statusCount('confirmed')}  icon={FiCheck}    gradient="from-emerald-400 to-teal-600"  />
        <StatCard label="Seated"    value={statusCount('seated')}     icon={FiUsers}    gradient="from-sky-400 to-blue-600"      />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              statusFilter === s
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FiCalendar size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No reservations found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow">
                    {r.customerName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{r.customerName}</h3>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FiPhone size={11} /> {r.phone}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FiUsers size={11} /> {r.guests} guests
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FiCalendar size={11} /> {new Date(r.date).toLocaleDateString()} at {r.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status controls */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <div className="relative">
                    <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r._id, e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Reservation</h2>
                <p className="text-xs text-gray-400 mt-0.5">Book a table for a customer</p>
              </div>
              <button type="button" onClick={() => { setShowModal(false); reset(); }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <FiX size={15} />
              </button>
            </div>

            {[
              { icon: FiUsers,    reg: 'customerName', type: 'text',   ph: 'Customer Name', req: true },
              { icon: FiPhone,    reg: 'phone',        type: 'text',   ph: 'Phone',         req: true },
              { icon: FiUsers,    reg: 'guests',       type: 'number', ph: 'Number of Guests', req: true },
              { icon: FiCalendar, reg: 'date',         type: 'date',   ph: '',              req: true },
              { icon: FiClock,    reg: 'time',         type: 'time',   ph: '',              req: true },
            ].map(({ icon: Icon, reg, type, ph, req }) => (
              <div key={reg} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register(reg, { required: req })}
                  type={type}
                  placeholder={ph}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition">
                {isSubmitting ? 'Saving…' : 'Save Reservation'}
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

export default Reservations;
