import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiPrinter, FiCreditCard, FiPercent, FiGift, 
  FiChevronDown, FiCheckCircle, FiBell, FiX, FiSend, FiCoffee, FiUser, FiPhone,
  FiDollarSign, FiTrendingUp, FiPieChart, FiRefreshCw, FiCalendar, FiBarChart2, FiArrowRight
} from 'react-icons/fi';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime, STATUS_COLORS, PAYMENT_METHODS } from '../../utils/constants';
import { connectSocket } from '../../services/socket';

const playOrderChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Note 1 (E5 - 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2 (G#5 - 830Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);

    // Note 3 (B5 - 987Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(987.77, now + 0.25);
    gain3.gain.setValueAtTime(0.18, now + 0.25);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.7);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
};

const POS = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders]           = useState([]);
  const [selected, setSelected]       = useState(null);
  const [lastPayment, setLastPayment] = useState(null);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [payment, setPayment]         = useState({ method: 'cash', discount: 0, tip: 0 });
  const [settings, setSettings]       = useState({ restaurantName: user?.restaurantId?.name || '', address: '', phone: '', email: '' });

  // Daily Income state
  const [dailySummary, setDailySummary]       = useState(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [loadingSummary, setLoadingSummary]   = useState(false);
  const [summaryFilter, setSummaryFilter]     = useState('all');

  // Order slip & auto-print states
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [slipOrder, setSlipOrder]         = useState(null);
  const [printMode, setPrintMode]         = useState('invoice'); // 'invoice' | 'slip'
  const [autoPrint, setAutoPrint]         = useState(() => {
    return localStorage.getItem('pos_autoprint_slip') === 'true';
  });

  const autoPrintRef = useRef(autoPrint);
  useEffect(() => {
    autoPrintRef.current = autoPrint;
  }, [autoPrint]);

  const toggleAutoPrint = () => {
    setAutoPrint((prev) => {
      const next = !prev;
      localStorage.setItem('pos_autoprint_slip', String(next));
      return next;
    });
  };

  const fetchOrders = async () => {
    const { data } = await api.get(`/orders?search=${search}&paymentStatus=unpaid&limit=50`);
    setOrders(data.data);
    setLoading(false);
  };

  const fetchDailySummary = async () => {
    try {
      setLoadingSummary(true);
      const { data } = await api.get('/payments/daily-summary');
      setDailySummary(data.data);
    } catch (err) {
      console.error('Failed to fetch daily summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePrintInvoice = () => {
    setPrintMode('invoice');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintOrderSlip = (orderToPrint) => {
    if (!orderToPrint) return;
    setSlipOrder(orderToPrint);
    setPrintMode('slip');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const sendToKitchen = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'accepted' });
      fetchOrders();
      if (incomingOrder?._id === orderId) {
        setIncomingOrder(null);
      }
    } catch (err) {
      console.error('Failed to send order to kitchen:', err);
    }
  };

  useEffect(() => {
    // Load restaurant settings for invoice header
    api.get('/settings').then(({ data }) => {
      if (data.data) setSettings(data.data);
    }).catch(() => {});

    fetchOrders();
    fetchDailySummary();
    const socket = connectSocket();
    socket.emit('join_pos');

    const onNewOrder = (newOrder) => {
      playOrderChime();
      fetchOrders();
      setIncomingOrder(newOrder);
      if (autoPrintRef.current) {
        handlePrintOrderSlip(newOrder);
      }
    };

    const onPaymentProcessed = () => {
      fetchOrders();
      fetchDailySummary();
    };

    socket.on('new_order', onNewOrder);
    socket.on('payment_processed', onPaymentProcessed);
    socket.on('order_status_updated', fetchOrders);

    return () => { 
      socket.off('new_order', onNewOrder); 
      socket.off('payment_processed', onPaymentProcessed); 
      socket.off('order_status_updated', fetchOrders);
    };
  }, [search]);

  const processPayment = async () => {
    if (!selected) return;
    const amount = selected.total - (selected.total * payment.discount) / 100 + Number(payment.tip);
    const { data } = await api.post('/payments', {
      order: selected._id, amount, method: payment.method,
      discount: payment.discount, tax: selected.tax, tip: payment.tip,
    });
    setLastPayment(data.data);
    setSelected(null);
    fetchOrders();
    fetchDailySummary();
  };

  if (loading) return <PageLoader />;

  const finalTotal = selected
    ? selected.total - (selected.total * payment.discount) / 100 + Number(payment.tip)
    : 0;

  const filteredPayments = (dailySummary?.payments || []).filter((p) => {
    if (summaryFilter === 'all') return true;
    return p.method === summaryFilter;
  });

  const restName = settings.restaurantName || user?.restaurantId?.name || 'Restaurant POS';
  const initials = restName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {/* ── Print-only invoice & order slip styles ───────────────────────────── */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn  { animation: fadeIn .35s ease both }
        @keyframes bounceNotice { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounceNotice { animation: bounceNotice 2s infinite ease-in-out; }

        @media print {
          body * { visibility: hidden !important; }
          .printable-doc, .printable-doc * { visibility: visible !important; }
          .printable-doc {
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

      {/* ── Hidden print invoice (Receipt with prices) ───────────── */}
      {lastPayment && (
        <div id="print-invoice" className={printMode === 'invoice' ? 'printable-doc' : 'hidden'} style={{ display: printMode === 'invoice' ? 'block' : 'none' }}>
          <div style={{
            fontFamily: "'Segoe UI', Arial, sans-serif",
            width: '320px',
            padding: '24px 20px',
            background: 'white',
            color: '#111',
          }}>
            {/* Restaurant header */}
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #111', paddingBottom: '16px' }}>
              {/* Logo circle */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px', color: 'white', fontWeight: '900',
                fontSize: '22px', letterSpacing: '-1px',
              }}>
                {initials}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '2px' }}>
                {restName}
              </div>
              {settings.address && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>{settings.address}</div>
              )}
              {settings.phone && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>📞 {settings.phone}</div>
              )}
              {settings.email && (
                <div style={{ fontSize: '11px', color: '#666' }}>✉ {settings.email}</div>
              )}
            </div>

            {/* Invoice title */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>
                RECEIPT
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '4px' }}>{lastPayment.invoiceNumber}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{formatDateTime(lastPayment.createdAt)}</div>
            </div>

            {/* Order info */}
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>Order</span>
                <span style={{ fontWeight: '700' }}>{lastPayment.order?.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>Table</span>
                <span style={{ fontWeight: '700' }}>
                  {lastPayment.order?.tableNumber ? `Table ${lastPayment.order.tableNumber}` : 'Walk-in'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Customer</span>
                <span style={{ fontWeight: '700' }}>{lastPayment.order?.customerName || 'Guest'}</span>
              </div>
            </div>

            {/* Items */}
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                ITEMS
              </div>
              {lastPayment.order?.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span>{item.quantity}× {item.name}</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#666' }}>
                <span>Subtotal</span><span>{formatCurrency(lastPayment.order?.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#666' }}>
                <span>Tax</span><span>{formatCurrency(lastPayment.tax)}</span>
              </div>
              {lastPayment.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#059669' }}>
                  <span>Discount</span><span>-{formatCurrency(lastPayment.discount)}</span>
                </div>
              )}
              {lastPayment.tip > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#059669' }}>
                  <span>Tip</span><span>{formatCurrency(lastPayment.tip)}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '2px solid #111', paddingTop: '8px', marginTop: '8px',
                fontWeight: '900', fontSize: '16px',
              }}>
                <span>TOTAL</span><span>{formatCurrency(lastPayment.amount)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '10px', padding: '10px', marginTop: '14px',
              fontSize: '12px', textAlign: 'center',
            }}>
              <div style={{ color: '#166534', fontWeight: '700' }}>✓ Payment Received</div>
              <div style={{ color: '#16a34a', marginTop: '2px' }}>
                {PAYMENT_METHODS.find((m) => m.value === lastPayment.method)?.label || lastPayment.method}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px dashed #ccc' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>Thank you for dining with us!</div>
              <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                {restName} · Powered by SavoryBites POS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Kitchen Order Slip (Warqadda Dalabka ee Kitchen-ka / Cashier) ─── */}
      {slipOrder && (
        <div id="print-order-slip" className={printMode === 'slip' ? 'printable-doc' : 'hidden'} style={{ display: printMode === 'slip' ? 'block' : 'none' }}>
          <div style={{
            fontFamily: "'Segoe UI', Arial, sans-serif",
            width: '320px',
            padding: '20px 16px',
            background: 'white',
            color: '#111',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {restName}
              </div>
              <div style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '3px 10px',
                border: '1.5px solid #000',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                KITCHEN ORDER TICKET (KOT)
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                WARQADDA DALABKA KITCHEN-KA
              </div>
            </div>

            {/* Prominent Table & Order Info */}
            <div style={{
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#000', letterSpacing: '-0.5px' }}>
                {slipOrder.tableNumber ? `TABLE ${slipOrder.tableNumber}` : 'WALK-IN / TAKEAWAY'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#333', marginTop: '2px' }}>
                Order #{slipOrder.orderNumber}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                {formatDateTime(slipOrder.createdAt || new Date())}
              </div>
            </div>

            {/* Customer & Type */}
            <div style={{ fontSize: '11px', borderBottom: '1px dashed #999', paddingBottom: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ color: '#666' }}>Customer:</span>
                <span style={{ fontWeight: '700' }}>{slipOrder.customerName || 'Guest'}</span>
              </div>
              {slipOrder.customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Phone:</span>
                  <span style={{ fontWeight: '600' }}>{slipOrder.customerPhone}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Type:</span>
                <span style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                  {slipOrder.orderType || (slipOrder.tableNumber ? 'Dine In' : 'Takeaway')}
                </span>
              </div>
            </div>

            {/* Items Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: '800',
              borderBottom: '2px solid #000',
              paddingBottom: '4px',
              marginBottom: '8px',
            }}>
              <span>QTY & ITEM</span>
              <span>PRICE</span>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '12px' }}>
              {slipOrder.items?.map((item, i) => (
                <div key={i} style={{ borderBottom: '1px dotted #ccc', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span>{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                  </div>
                  {item.notes && (
                    <div style={{
                      fontSize: '11px',
                      color: '#c2410c',
                      fontWeight: '600',
                      marginTop: '2px',
                      paddingLeft: '14px',
                    }}>
                      ⚠️ Note: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total / Items count */}
            <div style={{ borderTop: '2px solid #000', paddingTop: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600' }}>Total Items:</span>
                <span style={{ fontWeight: '800' }}>
                  {slipOrder.items?.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900' }}>
                <span>Order Total:</span>
                <span>{formatCurrency(slipOrder.total)}</span>
              </div>
            </div>

            {/* Order Notes */}
            {slipOrder.notes && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '6px',
                fontSize: '11px',
              }}>
                <span style={{ fontWeight: '700', color: '#b45309' }}>Instructions: </span>
                <span style={{ color: '#78350f' }}>{slipOrder.notes}</span>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #999', fontSize: '10px', color: '#777' }}>
              <div>*** DALAB CUSUB / SENT TO KITCHEN ***</div>
              <div style={{ marginTop: '2px' }}>Printed by Cashier · {formatDateTime(new Date())}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Incoming Order Alert Modal ────────────────────────────── */}
      <AnimatePresence>
        {incomingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-violet-500/30 max-w-lg w-full overflow-hidden"
            >
              {/* Top gradient banner */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white relative">
                <button
                  onClick={() => setIncomingOrder(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl animate-bounceNotice">
                    🔔
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      New Customer Order
                    </span>
                    <h3 className="text-xl font-extrabold mt-0.5">Order Cusub baa Soo Dhacay!</h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Highlights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 text-center">
                    <p className="text-xs text-violet-500 font-semibold uppercase">Goobta / Table</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                      {incomingOrder.tableNumber ? `Table ${incomingOrder.tableNumber}` : 'Walk-in'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-center">
                    <p className="text-xs text-purple-500 font-semibold uppercase">Number-ka Order</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                      {incomingOrder.orderNumber}
                    </p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FiUser size={14} className="text-violet-500" />
                    {incomingOrder.customerName || 'Customer / Guest'}
                  </span>
                  {incomingOrder.customerPhone && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FiPhone size={13} /> {incomingOrder.customerPhone}
                    </span>
                  )}
                </div>

                {/* Items preview */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-2 bg-white dark:bg-gray-900/50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Cunnooyinka la Dalbay ({incomingOrder.items?.length || 0} items)
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {incomingOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-sm border-b border-gray-50 dark:border-gray-800/40 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <span className="font-bold text-violet-600 dark:text-violet-400 mr-2">{item.quantity}×</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                          {item.notes && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 pl-5 mt-0.5">Note: {item.notes}</p>
                          )}
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {formatCurrency(item.subtotal || item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between items-center font-extrabold text-base">
                    <span>Total:</span>
                    <span className="text-violet-600 dark:text-violet-400">{formatCurrency(incomingOrder.total)}</span>
                  </div>
                </div>

                {incomingOrder.notes && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Fariin / Instructions: </span>
                    {incomingOrder.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePrintOrderSlip(incomingOrder)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition"
                >
                  <FiPrinter size={16} /> Daabac Warqadda (Print Slip)
                </button>

                <button
                  type="button"
                  onClick={() => sendToKitchen(incomingOrder._id)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition"
                >
                  <FiSend size={16} /> U Dir Kitchen-ka
                </button>

                <button
                  type="button"
                  onClick={() => setIncomingOrder(null)}
                  className="py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl transition text-sm"
                >
                  Xir
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Daily Restaurant Income Details Modal ─────────────────────────────── */}
        {showIncomeModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <FiDollarSign size={26} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Dakhliga Maanta ee Maqayadda</h2>
                    <p className="text-xs text-emerald-100 flex items-center gap-2 mt-0.5">
                      <FiCalendar size={13} /> Tariikhda: {formatDate(new Date())} · Cashier Console
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* 4 Overview Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Dakhliga Guud</p>
                    <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                      {formatCurrency(dailySummary?.totalIncome || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Total Revenue</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Dalabyo La Bixiyay</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">
                      {dailySummary?.totalTransactions || 0}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Completed Receipts</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Cash-dhimis (Discounts)</p>
                    <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                      {formatCurrency(dailySummary?.totalDiscount || 0)}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Total Discounts</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Canshuurta (Tax)</p>
                    <p className="text-2xl font-black text-purple-900 dark:text-purple-200 mt-1">
                      {formatCurrency(dailySummary?.totalTax || 0)}
                    </p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">Total Taxes</p>
                  </div>
                </div>

                {/* Method Breakdown Pills */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                    Kala Saaridda Habka Lacag-bixinta (By Payment Method)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const data = dailySummary?.methodBreakdown?.[pm.value] || { amount: 0, count: 0 };
                      const isSelected = summaryFilter === pm.value;
                      return (
                        <button
                          key={pm.value}
                          type="button"
                          onClick={() => setSummaryFilter(summaryFilter === pm.value ? 'all' : pm.value)}
                          className={`p-3 rounded-2xl text-left border transition-all ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30'
                              : 'bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSelected ? 'text-violet-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {pm.label}
                          </p>
                          <p className={`text-base font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {formatCurrency(data.amount)}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-violet-200' : 'text-gray-400'}`}>
                            {data.count} transaction{data.count !== 1 ? 's' : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter and Table of Today's Transactions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Liiska Lacagaha Maanta La Qaaday ({filteredPayments.length})
                    </h3>
                    {summaryFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSummaryFilter('all')}
                        className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                      >
                        Muuji Dhammaan (Clear Filter)
                      </button>
                    )}
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 text-sm">
                      Maanta weli ma jirto lacag-bixin la diiwaangeliyay.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                          <tr>
                            <th className="py-3 px-3.5">Waqtiga</th>
                            <th className="py-3 px-3.5">Order / Invoice #</th>
                            <th className="py-3 px-3.5">Miiska / Nooca</th>
                            <th className="py-3 px-3.5">Habka</th>
                            <th className="py-3 px-3.5">Cashier</th>
                            <th className="py-3 px-3.5 text-right">Lacagta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filteredPayments.map((p) => {
                            const methodObj = PAYMENT_METHODS.find((m) => m.value === p.method);
                            return (
                              <tr key={p._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                                <td className="py-3 px-3.5 font-medium text-gray-500 dark:text-gray-400">
                                  {formatDateTime(p.createdAt)}
                                </td>
                                <td className="py-3 px-3.5 font-bold text-gray-900 dark:text-white">
                                  {p.order?.orderNumber || p.invoiceNumber || '—'}
                                </td>
                                <td className="py-3 px-3.5 text-gray-600 dark:text-gray-300">
                                  {p.order?.tableNumber ? `Table ${p.order.tableNumber}` : (p.order?.orderType || 'Order')}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    {methodObj?.label || p.method}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 text-gray-600 dark:text-gray-300">
                                  {p.processedBy?.name || 'Cashier'}
                                </td>
                                <td className="py-3 px-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(p.amount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <Link
                  to="/admin/reports"
                  className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition"
                >
                  <FiBarChart2 size={15} />
                  <span>Daawo Warbixinnada Buuxa & Soo Deji PDF / Excel</span>
                  <FiArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold transition"
                >
                  Xir (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main POS UI ──────────────────────────────────────────── */}
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-1">Cashier Console</p>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Point of Sale</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-print toggle button */}
            <button
              onClick={toggleAutoPrint}
              type="button"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                autoPrint
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
              title="Automatically open print dialog when customer places order"
            >
              <FiPrinter size={14} className={autoPrint ? 'text-emerald-500' : 'text-gray-400'} />
              <span>Auto-Print Orders:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                autoPrint ? 'bg-emerald-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {autoPrint ? 'ON' : 'OFF'}
              </span>
            </button>

            {lastPayment && (
              <button
                onClick={handlePrintInvoice}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:opacity-90 transition print:hidden text-sm"
              >
                <FiPrinter size={15} /> Print Invoice
              </button>
            )}
          </div>
        </div>

        {/* ── Daily Restaurant Income Banner ── */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-cyan-950/40 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Total Income & Transaction Count */}
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
                <FiDollarSign size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-300/50 dark:border-emerald-700/50">
                    Dakhliga Maanta ee Maqayadda
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    · {formatDate(new Date())}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    {formatCurrency(dailySummary?.totalIncome || 0)}
                  </h2>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    ({dailySummary?.totalTransactions || 0} dalab la bixiyay maanta)
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Method Breakdown & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {dailySummary?.methodBreakdown && (
                <div className="hidden sm:flex flex-wrap items-center gap-1.5 mr-1">
                  {Object.entries(dailySummary.methodBreakdown)
                    .filter(([_, v]) => v.amount > 0)
                    .map(([method, val]) => (
                      <div
                        key={method}
                        className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1 shadow-2xs"
                      >
                        <span className="capitalize text-gray-500 dark:text-gray-400">
                          {method.replace('_', ' ')}:
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(val.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowIncomeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition cursor-pointer"
              >
                <FiPieChart size={14} />
                <span>Faahfaahinta Dakhliga</span>
              </button>

              <button
                type="button"
                onClick={fetchDailySummary}
                disabled={loadingSummary}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                title="Dib u cusbooneysii Dakhliga"
              >
                <FiRefreshCw size={14} className={loadingSummary ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left – Order list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders by number, table or customer…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
              />
            </div>

            <div className="grid gap-3">
              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <FiCheckCircle size={36} className="text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-400">No unpaid orders right now.</p>
                </div>
              )}
              {orders.map((order) => (
                <motion.div
                  key={order._id}
                  whileHover={{ scale: 1.005 }}
                  onClick={() => { setSelected(order); setLastPayment(null); }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border cursor-pointer transition-all duration-200 ${
                    selected?._id === order._id
                      ? 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-800 shadow-lg'
                      : 'border-gray-100 dark:border-gray-800 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                        {order.status === 'pending' && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'} · {order.customerName || 'Guest'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {/* Quick print slip button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintOrderSlip(order);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                          title="Print Kitchen / Order Slip"
                        >
                          <FiPrinter size={12} className="text-violet-500" />
                          <span>Slip</span>
                        </button>

                        {/* Send to Kitchen button if pending */}
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendToKitchen(order._id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition"
                            title="Confirm & Send to Kitchen"
                          >
                            <FiSend size={11} />
                            <span>Kitchen</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-violet-600 dark:text-violet-400">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right – Payment panel */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-fit sticky top-4 overflow-hidden">
            {selected ? (
              <>
                <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
                <div className="p-6 space-y-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Payment <span className="text-violet-600 dark:text-violet-400">{selected.orderNumber}</span>
                  </h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selected.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(selected.tax)}</span></div>
                    {payment.discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Discount -{payment.discount}%</span>
                        <span>-{formatCurrency(selected.total * payment.discount / 100)}</span>
                      </div>
                    )}
                    {payment.tip > 0 && (
                      <div className="flex justify-between text-emerald-600"><span>Tip</span><span>+{formatCurrency(payment.tip)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                      <span>Total</span><span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                      <select
                        value={payment.method}
                        onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                        className="appearance-none w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                      >
                        {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="number" placeholder="Discount %" value={payment.discount}
                        onChange={(e) => setPayment({ ...payment, discount: +e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="relative">
                      <FiGift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="number" placeholder="Tip amount" value={payment.tip}
                        onChange={(e) => setPayment({ ...payment, tip: +e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Quick Order Slip Print & Send to Kitchen */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintOrderSlip(selected)}
                      className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl flex items-center justify-center gap-1.5 text-xs transition"
                    >
                      <FiPrinter size={14} className="text-violet-500" /> Print Order Slip
                    </button>
                    {selected.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => sendToKitchen(selected._id)}
                        className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold rounded-xl flex items-center justify-center gap-1.5 text-xs border border-amber-200 dark:border-amber-800 transition"
                      >
                        <FiSend size={14} /> Send to Kitchen
                      </button>
                    )}
                  </div>

                  <button
                    onClick={processPayment}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  >
                    Process Payment — {formatCurrency(finalTotal)}
                  </button>
                </div>
              </>
            ) : lastPayment ? (
              <>
                <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="p-6 space-y-5">
                  {/* Invoice preview header (screen only) */}
                  <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-800">
                    {/* Restaurant logo (screen) */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-xl mx-auto mb-2 shadow-lg">
                      {initials}
                    </div>
                    <p className="font-black text-base text-gray-900 dark:text-white">{restName}</p>
                    {settings.address && <p className="text-xs text-gray-400 mt-0.5">{settings.address}</p>}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Receipt</p>
                      <p className="font-black text-lg text-gray-900 dark:text-white mt-0.5">{lastPayment.invoiceNumber}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(lastPayment.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{lastPayment.order?.orderNumber}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {lastPayment.order?.tableNumber ? `Table ${lastPayment.order.tableNumber}` : 'Walk-in'} · {lastPayment.order?.customerName || 'Guest'}
                    </p>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-sm">
                    {lastPayment.order?.items?.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}× {item.name}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(lastPayment.order?.subtotal)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(lastPayment.tax)}</span></div>
                    {lastPayment.tip > 0 && <div className="flex justify-between text-emerald-600"><span>Tip</span><span>{formatCurrency(lastPayment.tip)}</span></div>}
                    <div className="flex justify-between font-black text-lg text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                      <span>Paid</span><span>{formatCurrency(lastPayment.amount)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">✓ Payment completed</p>
                    <p className="text-emerald-600/70 dark:text-emerald-300/70 text-xs mt-0.5">
                      {PAYMENT_METHODS.find((m) => m.value === lastPayment.method)?.label || lastPayment.method}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrintInvoice}
                      className="flex-1 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition print:hidden text-sm"
                    >
                      <FiPrinter size={15} /> Print Receipt
                    </button>
                    <button
                      onClick={() => handlePrintOrderSlip(lastPayment.order)}
                      className="py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition print:hidden text-xs"
                      title="Print Kitchen Copy"
                    >
                      <FiPrinter size={14} className="text-violet-500" /> Kitchen Copy
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center py-20 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FiCreditCard size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Select an order to process payment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default POS;
