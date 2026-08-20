import { useEffect, useState } from 'react';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDateTime, STATUS_COLORS } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    const params = new URLSearchParams({ search, limit: 50 });
    if (statusFilter) params.append('status', statusFilter);
    const { data } = await api.get(`/orders?${params}`);
    setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    socket.on('new_order', fetchOrders);
    socket.on('order_status_updated', fetchOrders);
    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, [search, statusFilter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    fetchOrders();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-3">
          <SearchInput value={search} onChange={setSearch} className="w-64" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
            <option value="">All Status</option>
            {['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Order', 'Table', 'Customer', 'Items', 'Total', 'Status', 'Time', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.tableNumber || '-'}</td>
                <td className="px-4 py-3">{order.customerName || 'Guest'}</td>
                <td className="px-4 py-3">{order.items?.length}</td>
                <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(order.createdAt)}</td>
                <td className="px-4 py-3">
                  <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border dark:border-gray-600 dark:bg-gray-800">
                    {['pending', 'accepted', 'preparing', 'ready', 'served', 'completed'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
