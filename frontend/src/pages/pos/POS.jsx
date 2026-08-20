import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPrinter } from 'react-icons/fi';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDateTime, STATUS_COLORS, PAYMENT_METHODS } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const POS = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState({ method: 'cash', discount: 0, tip: 0 });

  const fetchOrders = async () => {
    const { data } = await api.get(`/orders?search=${search}&paymentStatus=unpaid&limit=50`);
    setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const socket = connectSocket();
    socket.emit('join_pos');
    socket.on('new_order', fetchOrders);
    socket.on('payment_processed', fetchOrders);
    return () => {
      socket.off('new_order');
      socket.off('payment_processed');
    };
  }, [search]);

  const processPayment = async () => {
    if (!selected) return;
    const amount = selected.total - (selected.total * payment.discount) / 100 + payment.tip;
    const { data } = await api.post('/payments', {
      order: selected._id,
      amount,
      method: payment.method,
      discount: payment.discount,
      tax: selected.tax,
      tip: payment.tip,
    });
    setLastPayment(data.data);
    setSelected(null);
    fetchOrders();
  };

  const printInvoice = () => {
    if (!lastPayment) return;
    window.print();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="system-kicker mb-2">Cashier console</p>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Point of Sale</h1>
        </div>
        {lastPayment && (
          <button
            onClick={printInvoice}
            className="ds-btn-primary print:hidden"
          >
            <FiPrinter />
            Print invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
          </div>

          <div className="grid gap-3">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelected(order)}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border cursor-pointer transition ${
                  selected?._id === order._id ? 'border-primary-500 ring-2 ring-primary-200' : 'dark:border-gray-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'} · {order.customerName || 'Guest'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{formatCurrency(order.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800 h-fit sticky top-4">
          {selected ? (
            <>
              <h3 className="font-bold text-lg mb-4">Payment - {selected.orderNumber}</h3>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {selected.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(selected.tax)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(selected.total)}</span></div>
              </div>

              <div className="mt-4 space-y-3">
                <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" placeholder="Discount %" value={payment.discount}
                  onChange={(e) => setPayment({ ...payment, discount: +e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
                <input type="number" placeholder="Tip" value={payment.tip}
                  onChange={(e) => setPayment({ ...payment, tip: +e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
                <button onClick={processPayment}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold">
                  Process Payment
                </button>
              </div>
            </>
          ) : (
            lastPayment ? (
              <div>
                <div id="cashier-invoice" className="space-y-4">
                  <div className="text-center border-b dark:border-gray-700 pb-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Invoice</p>
                    <h3 className="font-bold text-lg mt-1">{lastPayment.invoiceNumber}</h3>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(lastPayment.createdAt)}</p>
                  </div>

                  <div>
                    <p className="font-semibold">{lastPayment.order?.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {lastPayment.order?.tableNumber ? `Table ${lastPayment.order.tableNumber}` : 'Walk-in'} - {lastPayment.order?.customerName || 'Guest'}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lastPayment.order?.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(lastPayment.order?.subtotal)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(lastPayment.tax)}</span></div>
                    {lastPayment.tip > 0 && <div className="flex justify-between"><span>Tip</span><span>{formatCurrency(lastPayment.tip)}</span></div>}
                    <div className="flex justify-between font-bold text-lg"><span>Paid</span><span>{formatCurrency(lastPayment.amount)}</span></div>
                  </div>

                  <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-300">Payment completed</p>
                    <p className="text-green-700/70 dark:text-green-300/70">
                      Method: {PAYMENT_METHODS.find((m) => m.value === lastPayment.method)?.label || lastPayment.method}
                    </p>
                  </div>
                </div>

                <button onClick={printInvoice}
                  className="mt-4 w-full py-3 bg-slate-950 dark:bg-primary-500 text-white dark:text-slate-950 rounded-xl font-semibold flex items-center justify-center gap-2 print:hidden">
                  <FiPrinter />
                  Print invoice
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">Select an order to process payment</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default POS;
