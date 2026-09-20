import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiAlertCircle, FiLoader, FiPrinter, FiBell, FiX } from 'react-icons/fi';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatDateTime } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const playKitchenChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // 2-tone kitchen bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  } catch (e) {
    console.error('Kitchen audio error:', e);
  }
};

const KDS_COLUMNS = [
  {
    key: 'pending',
    label: 'New Orders',
    gradient: 'from-yellow-400 to-amber-500',
    bar: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    ring: 'ring-yellow-400/30',
    btn: 'from-yellow-500 to-amber-500 shadow-yellow-400/30',
    badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    gradient: 'from-sky-400 to-blue-600',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-600',
    ring: 'ring-sky-400/30',
    btn: 'from-sky-500 to-blue-500 shadow-sky-400/30',
    badge: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    gradient: 'from-orange-400 to-red-500',
    bar: 'bg-gradient-to-r from-orange-400 to-red-500',
    ring: 'ring-orange-400/30',
    btn: 'from-orange-500 to-red-500 shadow-orange-400/30',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  },
  {
    key: 'ready',
    label: 'Ready to Serve',
    gradient: 'from-emerald-400 to-teal-600',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-600',
    ring: 'ring-emerald-400/30',
    btn: 'from-emerald-500 to-teal-500 shadow-emerald-400/30',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
];

const NEXT_STATUS = { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served' };
const NEXT_LABEL  = { pending: 'Accept', accepted: 'Start Cooking', preparing: 'Mark Ready', ready: 'Served ✓' };

const Kitchen = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [printOrder, setPrintOrder]   = useState(null);
  const [settings, setSettings]       = useState({ restaurantName: 'Savory Bites' });

  const fetchOrders = async () => {
    const { data } = await api.get('/orders/kitchen');
    setOrders(data.data);
    setLoading(false);
  };

  const handlePrintTicket = (order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (data.data) setSettings(data.data);
    }).catch(() => {});

    fetchOrders();
    const socket = connectSocket();
    socket.emit('join_kitchen');

    const handleNewOrder = (order) => {
      playKitchenChime();
      setOrders((prev) => [order, ...prev.filter((o) => o._id !== order._id)]);
      setNewOrderAlert(order);
      // Auto-hide alert after 8s
      setTimeout(() => {
        setNewOrderAlert((cur) => (cur?._id === order._id ? null : cur));
      }, 8000);
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', fetchOrders);

    return () => { 
      socket.off('new_order', handleNewOrder); 
      socket.off('order_status_updated', fetchOrders); 
    };
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    fetchOrders();
  };

  if (loading) return <PageLoader />;

  const getByStatus = (status) => orders.filter((o) => o.status === status);
  const restName = settings.restaurantName || 'Savory Bites';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Print styles for Kitchen Ticket ── */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn  { animation: fadeIn .35s ease both }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .animate-pulse   { animation: pulse 2s ease-in-out infinite }

        @media print {
          body * { visibility: hidden !important; }
          #kitchen-print-ticket, #kitchen-print-ticket * { visibility: visible !important; }
          #kitchen-print-ticket {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            padding: 0 !important;
            background: white !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* ── Hidden thermal ticket for kitchen printer ── */}
      {printOrder && (
        <div id="kitchen-print-ticket" style={{ display: 'none' }}>
          <div style={{
            fontFamily: "'Segoe UI', Arial, sans-serif",
            width: '320px',
            padding: '20px 16px',
            background: 'white',
            color: '#111',
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{restName}</div>
              <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1px', marginTop: '4px' }}>
                KITCHEN ORDER TICKET (KOT)
              </div>
            </div>

            <div style={{
              background: '#f4f4f5',
              padding: '10px',
              borderRadius: '6px',
              textAlign: 'center',
              marginBottom: '10px',
            }}>
              <div style={{ fontSize: '26px', fontWeight: '900' }}>
                {printOrder.tableNumber ? `TABLE ${printOrder.tableNumber}` : 'WALK-IN'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>
                Order #{printOrder.orderNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                {formatDateTime(printOrder.createdAt || new Date())}
              </div>
            </div>

            <div style={{ fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
              <div>Customer: <strong>{printOrder.customerName || 'Guest'}</strong></div>
              <div>Type: <strong>{printOrder.orderType || 'Dine-in'}</strong></div>
            </div>

            <div style={{ borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px', fontSize: '12px', fontWeight: '900' }}>
              ITEMS TO PREPARE
            </div>

            <div style={{ marginBottom: '12px' }}>
              {printOrder.items?.map((item, i) => (
                <div key={i} style={{ borderBottom: '1px dotted #888', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900' }}>
                    {item.quantity}× {item.name}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: '700', marginTop: '2px', paddingLeft: '12px' }}>
                      ⚠️ {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {printOrder.notes && (
              <div style={{ padding: '8px', border: '1px solid #000', borderRadius: '4px', fontSize: '12px', marginBottom: '10px' }}>
                <strong>Note: </strong>{printOrder.notes}
              </div>
            )}

            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10px' }}>
              *** KITCHEN ORDER ***
            </div>
          </div>
        </div>
      )}

      {/* Alert banner for incoming order */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shadow-lg shadow-orange-500/20"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🛎️</span>
              <div>
                <p className="font-extrabold text-sm">DALAB CUSUB BAA SOO DHACAY / NEW ORDER RECEIVED!</p>
                <p className="text-xs text-white/90">
                  Order <strong>#{newOrderAlert.orderNumber}</strong> ·{' '}
                  <strong>{newOrderAlert.tableNumber ? `Table ${newOrderAlert.tableNumber}` : 'Walk-in'}</strong> ·{' '}
                  {newOrderAlert.items?.length || 0} items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrintTicket(newOrderAlert)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <FiPrinter size={13} /> Print Ticket
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-white transition"
              >
                <FiX size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Kitchen Display</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} active orders</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
        </div>
      </div>

      {/* KDS Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {KDS_COLUMNS.map((col) => {
          const colOrders = getByStatus(col.key);
          return (
            <div key={col.key} className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 min-h-[520px]">
              {/* Column header */}
              <div className={`h-1.5 ${col.bar}`} />
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 dark:text-white">{col.label}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${col.badge}`}>
                    {colOrders.length}
                  </span>
                </div>
              </div>

              {/* Order cards */}
              <div className="p-3 space-y-3">
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <FiLoader size={22} className="text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400">No orders here</p>
                  </div>
                )}
                {colOrders.map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className={`h-1 ${col.bar}`} />
                    <div className="p-4 space-y-3">
                      {/* Order number & table */}
                      <div className="flex items-center justify-between">
                        <span className="font-black text-gray-900 dark:text-white">{order.orderNumber}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {order.tableNumber || 'Walk-in'}
                        </span>
                      </div>

                      {/* Time */}
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <FiClock size={11} /> {formatDateTime(order.createdAt)}
                      </p>

                      {/* Items */}
                      <ul className="space-y-1.5">
                        {order.items?.map((item, i) => (
                          <li key={i} className="text-sm">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-gray-900 dark:text-white">{item.quantity}×</span>
                              <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                            </div>
                            {item.notes && (
                              <div className="flex items-start gap-1 mt-0.5 text-xs text-orange-500 dark:text-orange-400">
                                <FiAlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                                {item.notes}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        {NEXT_STATUS[col.key] && (
                          <button
                            onClick={() => updateStatus(order._id, NEXT_STATUS[col.key])}
                            className={`flex-1 py-2 bg-gradient-to-r ${col.btn} text-white text-xs font-semibold rounded-xl shadow hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all duration-200`}
                          >
                            {NEXT_LABEL[col.key]}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePrintTicket(order)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition text-xs font-semibold flex items-center justify-center gap-1"
                          title="Print Kitchen Ticket"
                        >
                          <FiPrinter size={13} /> Ticket
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kitchen;
