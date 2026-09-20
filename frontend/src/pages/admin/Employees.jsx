import { useEffect, useState } from 'react';
import { FiPlus, FiUsers, FiSearch, FiX, FiMail, FiLock, FiBriefcase, FiDollarSign, FiShield, FiChevronDown } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { ROLE_LABELS } from '../../utils/constants';

/* ── gradient palette per role ─────────────────────────────────── */
const ROLE_GRADIENTS = {
  manager:  'from-violet-500 to-purple-600',
  cashier:  'from-emerald-400 to-teal-600',
  chef:     'from-orange-400 to-red-500',
  waiter:   'from-sky-400 to-blue-600',
  default:  'from-gray-400 to-gray-600',
};

const ROLE_BADGES = {
  manager: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  cashier: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  chef:    { bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-300'  },
  waiter:  { bg: 'bg-sky-100 dark:bg-sky-900/30',        text: 'text-sky-700 dark:text-sky-300'        },
  default: { bg: 'bg-gray-100 dark:bg-gray-800',         text: 'text-gray-600 dark:text-gray-400'      },
};

const ROLES = ['manager', 'cashier', 'chef', 'waiter'];

const RoleBadge = ({ role }) => {
  const cfg = ROLE_BADGES[role] || ROLE_BADGES.default;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <FiShield size={10} />
      {ROLE_LABELS[role] || role}
    </span>
  );
};

/* ── KPI Card ───────────────────────────────────────────────────── */
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

/* ── Employee Card ──────────────────────────────────────────────── */
const EmployeeCard = ({ emp }) => {
  const role = emp.user?.role || 'default';
  const grad = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.default;
  const initials = emp.user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Gradient header strip */}
      <div className={`h-2 bg-gradient-to-r ${grad}`} />

      <div className="p-6 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{emp.user?.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{emp.user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <RoleBadge role={role} />
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">#{emp.employeeId}</span>
        </div>

        {/* Position & Salary */}
        <div className="grid grid-cols-2 gap-3">
          {emp.position && (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Position</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate mt-0.5">{emp.position}</p>
            </div>
          )}
          {emp.salary != null && (
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Salary</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">${Number(emp.salary).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────────────────── */
const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchEmployees = async () => {
    const { data } = await api.get('/employees');
    setEmployees(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/employees', formData);
    setShowModal(false);
    reset();
    fetchEmployees();
  };

  if (loading) return <PageLoader />;

  /* ── Derived stats ── */
  const roleCount = (r) => employees.filter((e) => e.user?.role === r).length;
  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchSearch =
      emp.user?.name?.toLowerCase().includes(q) ||
      emp.user?.email?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || emp.user?.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{employees.length} total staff members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <FiPlus size={16} />
          Add Employee
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Staff"    value={employees.length}      icon={FiUsers}     gradient="from-violet-500 to-purple-600" />
        <StatCard label="Managers"       value={roleCount('manager')}  icon={FiShield}    gradient="from-violet-500 to-purple-600" />
        <StatCard label="Chefs"          value={roleCount('chef')}     icon={FiBriefcase} gradient="from-orange-400 to-red-500"    />
        <StatCard label="Cashiers"       value={roleCount('cashier')}  icon={FiDollarSign}gradient="from-emerald-400 to-teal-600"  />
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
          />
        </div>
        <div className="relative">
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
      </div>

      {/* ── Employee Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <FiUsers size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No employees match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => <EmployeeCard key={emp._id} emp={emp} />)}
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="relative bg-white dark:bg-gray-900 rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-4 animate-slideUp"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Employee</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in staff details below</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Fields */}
            {[
              { icon: FiUsers,    reg: 'name',     type: 'text',     ph: 'Full Name' },
              { icon: FiMail,     reg: 'email',    type: 'email',    ph: 'Email Address' },
              { icon: FiLock,     reg: 'password', type: 'password', ph: 'Password' },
              { icon: FiBriefcase,reg: 'position', type: 'text',     ph: 'Position (optional)' },
              { icon: FiDollarSign,reg:'salary',   type: 'number',   ph: 'Salary (optional)' },
            ].map(({ icon: Icon, reg, type, ph }) => (
              <div key={reg} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  {...register(reg, { required: ['name','email','password'].includes(reg) })}
                  type={type}
                  placeholder={ph}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                />
              </div>
            ))}

            {/* Role select */}
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
              <select
                {...register('role', { required: true })}
                className="appearance-none w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition"
              >
                {isSubmitting ? 'Saving…' : 'Save Employee'}
              </button>
              <button
                type="button"
                onClick={() => { setShowModal(false); reset(); }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
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

export default Employees;
