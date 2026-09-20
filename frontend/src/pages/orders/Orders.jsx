import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag,
  FiClock,
  FiCoffee,
  FiBell,
  FiCheckCircle,
  FiEye,
  FiCopy,
  FiCheck,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiMapPin,
  FiDollarSign,
  FiUser,
  FiArrowRight,
} from 'react-icons/fi';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import { PageLoader } from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/Badge';
import { formatCurrency, formatDateTime, STATUS_COLORS } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'pending', label: 'Pending', color: 'amber' },
  { key: 'accepted', label: 'Accepted', color: 'sky' },
  { key: 'preparing', label: 'Preparing', color: 'orange' },
  { key: 'ready', label: 'Ready', color: 'emerald' },
  { key: 'served', label: 'Served', color: 'purple' },
  { key: 'completed', label: 'Completed', color: 'slate' },
  { key: 'cancelled', label: 'Cancelled', color: 'rose' },
];

const NEXT_STATUS = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: 'completed',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = new URLSearchParams({ search, limit: 100 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    socket.emit('join_pos');
    socket.emit('join_admin');

    const handleUpdate = () => fetchOrders();
    socket.on('new_order', handleUpdate);
    socket.on('order_status_updated', handleUpdate);

    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
    };
  }, [search, statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const copyId = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const inKitchen = orders.filter((o) => ['accepted', 'preparing'].includes(o.status)).length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const revenue = orders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + (o.total || 0) : acc), 0);
    return { total, pending, inKitchen, ready, completed, revenue };
  }, [orders]);

  if (loading) return <PageLoader />;

  return (
    <div className="ds-page">
      {/* Header */}
      <PageHeader
        title="Orders Management"
        subtitle="Track, filter, and manage restaurant orders in real-time"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="ds-btn-secondary py-2 text-xs"
              title="Refresh Orders"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="!p-4 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FiShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{metrics.total}</p>
        </Card>

        <Card className="!p-4 border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pending</span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">{metrics.pending}</p>
        </Card>

        <Card className="!p-4 border-orange-200/60 dark:border-orange-900/40 bg-orange-50/20 dark:bg-orange-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Cooking</span>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
              <FiCoffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-300 mt-2">{metrics.inKitchen}</p>
        </Card>

        <Card className="!p-4 border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ready</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <FiBell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{metrics.ready}</p>
        </Card>

        <Card className="!p-4 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Done</span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{metrics.completed}</p>
        </Card>

        <Card className="!p-4 border-primary-200/60 dark:border-primary-900/40 bg-primary-50/20 dark:bg-primary-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Revenue</span>
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-primary-700 dark:text-primary-300 mt-2 truncate">
            {formatCurrency(metrics.revenue)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm ring-2 ring-slate-900/20 dark:ring-white/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="max-w-md w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order #, table, customer..."
            />
          </div>
          <span className="text-xs font-medium text-slate-400 sm:text-right">
            Showing <b className="text-slate-700 dark:text-slate-300">{orders.length}</b> orders
          </span>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="ds-table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Table</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created Time</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FiShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-sm">No orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try altering your search or status filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const nextStatusKey = NEXT_STATUS[order.status];
                return (
                  <tr key={order._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Order Number */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {order.orderNumber}
                        </span>
                        <button
                          onClick={() => copyId(order._id, order.orderNumber)}
                          title="Copy order number"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {copiedId === order._id ? (
                            <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Table */}
                    <td>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <FiMapPin className="w-3 h-3 text-primary-500" />
                        {order.tableNumber ? `T-${order.tableNumber}` : 'Takeaway'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {order.customerName || 'Guest'}
                        </span>
                      </div>
                    </td>

                    {/* Items */}
                    <td>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{order.items?.length || 0} items</span>
                        <FiEye className="w-3 h-3" />
                      </button>
                    </td>

                    {/* Total */}
                    <td>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {formatCurrency(order.total)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide capitalize shadow-2xs ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Time */}
                    <td>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {nextStatusKey && (
                          <button
                            onClick={() => updateStatus(order._id, nextStatusKey)}
                            title={`Advance to ${nextStatusKey}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors"
                          >
                            <span className="capitalize">{nextStatusKey}</span>
                            <FiArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20"
                        >
                          {['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Gradient accent strip */}
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />

              {/* Modal Header */}
              <div className="px-6 py-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Customer avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
                    {(selectedOrder.customerName || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white">
                        {selectedOrder.orderNumber}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_COLORS[selectedOrder.status]}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0"
                >
                  <FiX size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 pb-5 space-y-4 overflow-y-auto">
                {/* Meta chips */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Table</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                      {selectedOrder.tableNumber ? `Table ${selectedOrder.tableNumber}` : 'Walk-in'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {selectedOrder.customerName || 'Guest'}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Items ({selectedOrder.items?.length || 0})
                  </p>
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {selectedOrder.items?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-b-0 bg-white dark:bg-gray-900"
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            <span className="font-black text-violet-600 dark:text-violet-400 mr-1">{item.quantity}×</span>
                            {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-amber-500 mt-0.5">📝 {item.notes}</p>
                          )}
                        </div>
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Tax</span>
                      <span>{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span className="text-violet-600 dark:text-violet-400">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer — Status Pills */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'accepted', 'preparing', 'ready', 'served', 'completed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder._id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        selectedOrder.status === s
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
