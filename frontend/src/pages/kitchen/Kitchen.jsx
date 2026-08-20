import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatDateTime } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const KDS_COLUMNS = [
  { key: 'pending', label: 'New Orders', color: 'border-yellow-400' },
  { key: 'accepted', label: 'Accepted', color: 'border-blue-400' },
  { key: 'preparing', label: 'Preparing', color: 'border-orange-400' },
  { key: 'ready', label: 'Ready', color: 'border-green-400' },
];

const NEXT_STATUS = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await api.get('/orders/kitchen');
    setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    socket.emit('join_kitchen');
    socket.on('new_order', (order) => setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]));
    socket.on('order_status_updated', fetchOrders);
    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    fetchOrders();
  };

  if (loading) return <PageLoader />;

  const getOrdersByStatus = (status) => orders.filter((o) => o.status === status);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kitchen Display</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {KDS_COLUMNS.map((col) => (
          <div key={col.key} className={`bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 border-t-4 ${col.color} min-h-[500px]`}>
            <h3 className="font-bold text-lg mb-4">{col.label} ({getOrdersByStatus(col.key).length})</h3>
            <div className="space-y-3">
              {getOrdersByStatus(col.key).map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">{order.orderNumber}</span>
                    <span className="text-xs text-gray-400">{order.tableNumber || 'Walk-in'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{formatDateTime(order.createdAt)}</p>
                  <ul className="space-y-1 mb-3">
                    {order.items?.map((item, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.notes && <span className="text-orange-500 text-xs block">Note: {item.notes}</span>}
                      </li>
                    ))}
                  </ul>
                  {NEXT_STATUS[col.key] && (
                    <button
                      onClick={() => updateStatus(order._id, NEXT_STATUS[col.key])}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                    >
                      → {NEXT_STATUS[col.key].charAt(0).toUpperCase() + NEXT_STATUS[col.key].slice(1)}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kitchen;
