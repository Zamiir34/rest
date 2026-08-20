import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiCreditCard } from 'react-icons/fi';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/constants';

const TRACK_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed'];

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/public/${orderId}`).then(({ data }) => {
      setOrder(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    const socket = connectSocket();
    socket.emit('join_order', orderId);
    socket.on('order_status_updated', (updated) => {
      if (updated._id === orderId) setOrder(updated);
    });

    return () => socket.off('order_status_updated');
  }, [orderId]);

  if (loading) return <PageLoader />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const currentIndex = TRACK_STEPS.indexOf(order.status);

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 min-h-screen">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
          <FiCreditCard className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Order Tracking</h1>
        <p className="text-gray-500 mt-1">{order.orderNumber}</p>
        {order.tableNumber && <p className="text-sm text-primary-700 dark:text-primary-300">Table {order.tableNumber}</p>}
      </div>

      <div className="relative mb-8 bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        {TRACK_STEPS.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex items-start gap-4 mb-6 last:mb-0 relative">
              {index < TRACK_STEPS.length - 1 && (
                <div className={`absolute left-5 top-10 w-0.5 h-8 ${isComplete ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  isComplete ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-primary-200 dark:ring-primary-900/50' : ''}`}
              >
                {isComplete && index < currentIndex ? <FiCheck /> : index + 1}
              </motion.div>
              <div className="pt-2">
                <p className={`font-semibold capitalize ${isCurrent ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-200'}`}>{step}</p>
                {isCurrent && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500">
                    {step === 'completed' ? 'Your order is complete.' : 'Your order is being processed.'}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-semibold mb-4 text-slate-950 dark:text-white">Order Summary</h3>
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span>{item.quantity}x {item.name}</span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <span>Total</span>
          <span className="text-primary-700 dark:text-primary-300">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
