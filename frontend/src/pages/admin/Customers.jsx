import { useEffect, useState } from 'react';
import { FiUsers, FiSearch, FiShoppingBag, FiDollarSign, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/constants';

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

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    api.get(`/customers?search=${search}`).then(({ data }) => {
      setCustomers(data.data);
      setLoading(false);
    });
  }, [search]);

  if (loading) return <PageLoader />;

  const totalSpend = customers.reduce((s, c) => s + (c.totalSpending || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.orderCount || 0), 0);
  const topSpender = customers.reduce((top, c) => (c.totalSpending > (top?.totalSpending || 0) ? c : top), null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{customers.length} registered customers</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={customers.length}          icon={FiUsers}       gradient="from-violet-500 to-purple-600" />
        <StatCard label="Total Orders"    value={totalOrders}               icon={FiShoppingBag} gradient="from-sky-400 to-blue-600"      />
        <StatCard label="Total Revenue"   value={formatCurrency(totalSpend)} icon={FiDollarSign}  gradient="from-emerald-400 to-teal-600"  />
        <StatCard label="Top Spender"     value={topSpender?.name?.split(' ')[0] || '—'} icon={FiStar} gradient="from-orange-400 to-red-500" />
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
              {['Customer', 'Phone', 'Orders', 'Total Spent', 'Last Order'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                  <FiUsers size={32} className="mx-auto mb-3 opacity-40" />
                  No customers found
                </td>
              </tr>
            ) : customers.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.phone || '—'}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                    <FiShoppingBag size={10} /> {c.orderCount}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(c.totalSpending)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn  { animation: fadeIn .35s ease both }
      `}</style>
    </div>
  );
};

export default Customers;
