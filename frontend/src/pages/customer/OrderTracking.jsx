import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCoffee,
  FiBell,
  FiShoppingBag,
  FiAward,
  FiAlertCircle,
  FiRefreshCw,
  FiCopy,
  FiArrowLeft,
  FiShare2,
  FiCreditCard,
  FiPlus,
  FiHelpCircle,
  FiPhone,
  FiMapPin,
  FiInfo,
} from 'react-icons/fi';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/constants';
import { getFoodImageUrl, handleImageError } from '../../utils/imageUtils';

// Sound effect when status updates
const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);

    setTimeout(() => {
      try {
        const audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = audioCtx2.createOscillator();
        const gain2 = audioCtx2.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx2.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx2.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx2.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx2.currentTime + 0.35);
        osc2.start();
        osc2.stop(audioCtx2.currentTime + 0.35);
      } catch (_) {}
    }, 120);
  } catch (_) {}
};

const TRACK_STEPS = [
  {
    key: 'pending',
    label: 'Order Placed',
    desc: 'Waiting for kitchen to accept',
    icon: FiClock,
    color: 'from-amber-500 to-amber-600',
    progressPercent: 16,
  },
  {
    key: 'accepted',
    label: 'Order Confirmed',
    desc: 'Kitchen has accepted your ticket',
    icon: FiCheckCircle,
    color: 'from-sky-500 to-blue-600',
    progressPercent: 35,
  },
  {
    key: 'preparing',
    label: 'Cooking Now',
    desc: 'Chefs are preparing your dishes',
    icon: FiCoffee,
    color: 'from-orange-500 to-amber-600',
    progressPercent: 62,
  },
  {
    key: 'ready',
    label: 'Food Ready',
    desc: 'Plated and ready to be served',
    icon: FiBell,
    color: 'from-emerald-500 to-teal-600',
    progressPercent: 85,
  },
  {
    key: 'served',
    label: 'Served',
    desc: 'Delivered to your table. Enjoy!',
    icon: FiShoppingBag,
    color: 'from-purple-500 to-indigo-600',
    progressPercent: 100,
  },
  {
    key: 'completed',
    label: 'Completed',
    desc: 'Order finished & closed. Thank you!',
    icon: FiAward,
    color: 'from-emerald-600 to-cyan-600',
    progressPercent: 100,
  },
];

const STATUS_HERO_INFO = {
  pending: {
    badge: 'Received & Pending',
    title: 'Order Placed Successfully!',
    subtitle: 'We have transmitted your order to the kitchen. Please relax while they review it.',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    borderCol: 'border-amber-400/40 dark:border-amber-500/30',
    accentText: 'text-amber-600 dark:text-amber-400',
    glowColor: 'shadow-amber-500/20',
    estTime: '15 - 25 min',
    pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  accepted: {
    badge: 'Kitchen Accepted',
    title: 'Your Order is Accepted!',
    subtitle: 'The kitchen team has acknowledged your order and queued the preparation.',
    bgGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
    borderCol: 'border-sky-400/40 dark:border-sky-500/30',
    accentText: 'text-sky-600 dark:text-sky-400',
    glowColor: 'shadow-sky-500/20',
    estTime: '12 - 20 min',
    pill: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  },
  preparing: {
    badge: 'Cooking in Progress',
    title: 'Chef is Preparing Your Food!',
    subtitle: 'Ingredients are sizzling! Our culinary team is carefully crafting your meal fresh.',
    bgGradient: 'from-orange-500/15 via-amber-500/5 to-transparent',
    borderCol: 'border-orange-400/40 dark:border-orange-500/30',
    accentText: 'text-orange-600 dark:text-orange-400',
    glowColor: 'shadow-orange-500/20',
    estTime: '8 - 14 min',
    pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  ready: {
    badge: 'Hot & Ready',
    title: 'Your Food is Ready! 🍽️',
    subtitle: 'Freshly plated and warm! A waiter is bringing your dishes directly to your table.',
    bgGradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    borderCol: 'border-emerald-400/40 dark:border-emerald-500/30',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    estTime: 'Serving now',
    pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  served: {
    badge: 'Delivered',
    title: 'Order Served. Bon Appétit!',
    subtitle: 'We hope you thoroughly enjoy your meal! Please let us know if you need anything.',
    bgGradient: 'from-purple-500/15 via-indigo-500/5 to-transparent',
    borderCol: 'border-purple-400/40 dark:border-purple-500/30',
    accentText: 'text-purple-600 dark:text-purple-400',
    glowColor: 'shadow-purple-500/20',
    estTime: 'Enjoy meal',
    pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  },
  completed: {
    badge: 'Completed',
    title: 'Order Completed. Thank You!',
    subtitle: 'Thank you for dining at Savory Bites. We look forward to serving you again soon!',
    bgGradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    borderCol: 'border-slate-300 dark:border-slate-700',
    accentText: 'text-slate-700 dark:text-slate-300',
    glowColor: 'shadow-slate-500/10',
    estTime: 'Finished',
    pill: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
  cancelled: {
    badge: 'Order Cancelled',
    title: 'This Order Was Cancelled',
    subtitle: 'Your order has been cancelled. Please talk to a waiter or manager for any inquiries.',
    bgGradient: 'from-rose-500/15 via-red-500/5 to-transparent',
    borderCol: 'border-rose-400/40 dark:border-rose-500/30',
    accentText: 'text-rose-600 dark:text-rose-400',
    glowColor: 'shadow-rose-500/20',
    estTime: 'Cancelled',
    pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);

  const fetchOrder = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await api.get(`/orders/public/${orderId}`);
      setOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchOrder();

    const socket = connectSocket();
    socket.emit('join_order', orderId);

    const handleUpdate = (updated) => {
      if (updated._id === orderId) {
        setOrder(updated);
        playNotificationChime();
      }
    };

    socket.on('order_status_updated', handleUpdate);

    return () => {
      socket.off('order_status_updated', handleUpdate);
    };
  }, [orderId]);

  const copyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setWaiterModalOpen(false);
    setTimeout(() => setWaiterCalled(false), 8000);
  };

  const currentStatus = order?.status || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const heroInfo = STATUS_HERO_INFO[currentStatus] || STATUS_HERO_INFO.pending;

  const currentIndex = useMemo(() => {
    if (isCancelled) return -1;
    return TRACK_STEPS.findIndex((s) => s.key === currentStatus);
  }, [currentStatus, isCancelled]);

  const progressPercentage = useMemo(() => {
    if (isCancelled) return 0;
    if (currentIndex === -1) return 15;
    return TRACK_STEPS[currentIndex]?.progressPercent || 20;
  }, [currentIndex, isCancelled]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <PageLoader />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 animate-pulse">
          Loading live order updates...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4 text-2xl">
          <FiAlertCircle />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
          We couldn't locate this order tracking ID. Please check the link or ask your server.
        </p>
        <Link
          to="/"
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-primary-500 text-white dark:text-slate-950 font-semibold text-sm shadow-md"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  const menuUrl = order.tableNumber ? `/menu/table/${order.tableNumber}` : '/';

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Floating / Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Link
            to={menuUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              Live Tracker
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              title="Refresh order"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              aria-label="Refresh Order"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
            </button>
            <button
              onClick={copyTrackingLink}
              title="Share Tracking Link"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              aria-label="Share tracking link"
            >
              <FiShare2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Waiter Alert Toast Notification */}
        <AnimatePresence>
          {waiterCalled && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Service Alerted</p>
                  <p className="text-sm font-semibold">
                    Waiter requested for Table {order.tableNumber || 'Service'}! A staff member is on the way.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaiterCalled(false)}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Order Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl border ${heroInfo.borderCol} bg-gradient-to-b ${heroInfo.bgGradient} p-6 sm:p-7 shadow-xl backdrop-blur-md`}
        >
          {/* Ambient Glow element */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${heroInfo.pill}`}>
                  {heroInfo.badge}
                </span>
                {order.tableNumber && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs">
                    <FiMapPin className="w-3 h-3 text-primary-400" />
                    Table {order.tableNumber}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {heroInfo.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1.5 max-w-md leading-relaxed">
                {heroInfo.subtitle}
              </p>
            </div>

            {/* Estimated time or live badge */}
            <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Prep Estimate
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {heroInfo.estTime}
              </span>
            </div>
          </div>

          {/* Animated Progress Meter */}
          {!isCancelled && (
            <div className="mt-6">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <span>Kitchen Progress</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{progressPercentage}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 via-sky-500 to-emerald-500 shadow-sm"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Stepper Timeline Section */}
        {!isCancelled ? (
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Order Timeline</span>
                <span className="text-xs font-normal text-slate-400">({currentIndex + 1} of {TRACK_STEPS.length})</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Updated in real-time
              </span>
            </div>

            <div className="relative pl-2 sm:pl-4 space-y-6">
              {TRACK_STEPS.map((step, index) => {
                const isComplete = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isUpcoming = index > currentIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="relative flex items-start gap-4 sm:gap-5 group">
                    {/* Connecting Vertical Line */}
                    {index < TRACK_STEPS.length - 1 && (
                      <div
                        className={`absolute left-5 sm:left-5 top-10 w-0.5 h-12 -ml-[1px] transition-colors duration-500 ${
                          index < currentIndex
                            ? 'bg-gradient-to-b from-primary-500 to-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div className="relative shrink-0 z-10">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isCurrent ? 1.08 : 1,
                        }}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                            : isCurrent
                            ? 'bg-gradient-to-br ' + step.color + ' text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/20 dark:ring-primary-400/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isComplete ? (
                          <FiCheck className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </motion.div>
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pt-1 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`font-bold text-sm sm:text-base tracking-tight ${
                            isCurrent
                              ? 'text-slate-950 dark:text-white'
                              : isComplete
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                            Active Stage
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isCurrent
                            ? 'text-slate-600 dark:text-slate-300 font-medium'
                            : isComplete
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
            <p className="text-rose-700 dark:text-rose-300 font-bold text-base">This order was cancelled</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              If this was unexpected, please speak to your server or the cashier counter.
            </p>
          </div>
        )}

        {/* Order Details & Meta Pills */}
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Order Number with Copy */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Order ID
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate font-mono">
                  {order.orderNumber}
                </span>
                <button
                  onClick={copyOrderNumber}
                  title="Copy Order ID"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Table Number */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Location
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5 text-primary-500" />
                {order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in'}
              </span>
            </div>

            {/* Order Type */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Type
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                {order.orderType?.replace('_', ' ') || 'Dine In'}
              </span>
            </div>

            {/* Payment Status */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Payment
              </span>
              <span
                className={`text-xs font-bold inline-flex items-center gap-1 ${
                  order.paymentStatus === 'paid'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {order.paymentStatus === 'paid' ? (
                  <>
                    <FiCheckCircle className="w-3.5 h-3.5" /> Paid
                  </>
                ) : (
                  <>
                    <FiCreditCard className="w-3.5 h-3.5" /> Pay at Counter
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800">
            <span>Placed on {formatDateTime(order.createdAt)}</span>
            {order.customerName && <span>Customer: <b>{order.customerName}</b></span>}
          </div>
        </div>

        {/* Itemized Order Summary Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Ordered Items
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {order.items?.length || 0} items
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {order.items?.map((item, i) => (
              <div key={i} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                  <img
                    src={getFoodImageUrl(item.food || { name: item.name })}
                    alt={item.name}
                    onError={(e) => handleImageError(e, item.food || { name: item.name })}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-xs text-slate-400">
                      @ {formatCurrency(item.price)} each
                    </span>
                  </div>

                  {item.notes && (
                    <div className="mt-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg inline-block">
                      📝 {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatCurrency(order.subtotal || order.total)}
              </span>
            </div>

            {order.tax > 0 && (
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Tax / VAT</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(order.tax)}
                </span>
              </div>
            )}

            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="font-medium">-{formatCurrency(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-black pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-900 dark:text-white">Grand Total</span>
              <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Assistance Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to={menuUrl}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-sm shadow-md transition-all active:scale-98"
          >
            <FiPlus className="w-4 h-4" />
            <span>Order More Items</span>
          </Link>

          <button
            onClick={() => setWaiterModalOpen(true)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm transition-all active:scale-98"
          >
            <FiBell className="w-4 h-4 text-amber-500" />
            <span>Call Waiter / Assistance</span>
          </button>
        </div>

        {/* Customer Help Footer Info */}
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <FiInfo className="w-5 h-5 text-primary-500 shrink-0" />
          <p>
            Keep this screen open to track progress live. You will hear an audible notification chime whenever the kitchen advances your ticket!
          </p>
        </div>
      </main>

      {/* Call Waiter Confirmation Modal */}
      <AnimatePresence>
        {waiterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-2xl mb-4">
                🔔
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                Need Waiter Assistance?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Would you like to request table service for{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  Table {order.tableNumber || 'your table'}
                </span>
                ? A server will arrive at your table shortly.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setWaiterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCallWaiter}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                >
                  Yes, Call Waiter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderTracking;
