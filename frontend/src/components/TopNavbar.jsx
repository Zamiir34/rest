import { useEffect, useRef, useState } from 'react';
import { FiBell, FiMenu, FiMoon, FiSearch, FiSun, FiX, FiCheck, FiCheckCircle, FiShoppingBag, FiClock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { ROLE_LABELS, formatCurrency } from '../utils/constants';

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Notification chime ─────────────────────────────────────────────────── */
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, startAt, duration, gain = 0.12) => {
      const osc = audioCtx.createOscillator();
      const g   = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startAt);
      g.gain.setValueAtTime(gain, audioCtx.currentTime + startAt);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startAt + duration);
      osc.start(audioCtx.currentTime + startAt);
      osc.stop(audioCtx.currentTime + startAt + duration);
    };
    play(587.33, 0,    0.15);
    play(880,    0.18, 0.18);
    play(1046.5, 0.38, 0.22, 0.1);
  } catch (err) {
    console.error('Audio play failed:', err);
  }
};

const getNotifIcon = (type) => {
  switch (type) {
    case 'order':       return '🍽️';
    case 'payment':     return '💳';
    case 'reservation': return '📅';
    case 'inventory':   return '📦';
    default:            return '🔔';
  }
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const TopNavbar = () => {
  const dispatch = useDispatch();
  const { user }        = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { darkMode, toggleTheme } = useTheme();

  const [unread,       setUnread]       = useState(0);
  const [toasts,       setToasts]       = useState([]);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef(null);

  /* ── fetch unread count ────────────────────────────────────────────────── */
  const fetchUnread = () => {
    api.get('/notifications?unread=true&limit=1')
      .then(({ data }) => setUnread(data.pagination?.total || 0))
      .catch(() => {});
  };

  const fetchNotifs = async () => {
    setLoadingNotifs(true);
    try {
      const { data } = await api.get('/notifications?limit=20');
      setNotifs(data.data || []);
    } catch { /* noop */ } finally {
      setLoadingNotifs(false);
    }
  };

  /* ── socket ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetchUnread();
    const socket = connectSocket();

    const handleNewOrder = (order) => {
      playNotificationSound();
      setUnread((prev) => prev + 1);

      const id = Date.now();
      setToasts((prev) => [
        {
          id,
          title: '🍽️ Order Cusub Soo Galay!',
          orderNumber: order.orderNumber,
          table: order.tableNumber ? `Table ${order.tableNumber}` : 'Walk-in',
          items: order.items?.length ?? 0,
          total: order.total,
        },
        ...prev.slice(0, 3),
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 10000);
    };

    socket.on('new_order', handleNewOrder);
    return () => { socket.off('new_order', handleNewOrder); };
  }, []);

  /* ── close panel on outside click ──────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPanel = () => {
    setPanelOpen((prev) => {
      if (!prev) fetchNotifs();
      return !prev;
    });
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch { /* noop */ }
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* noop */ }
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/82 dark:bg-slate-950/82 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            {!sidebarOpen && (
              <span className="hidden sm:block font-bold text-slate-900 dark:text-white tracking-tight">
                {user?.restaurantId?.name || (user?.role === 'super_admin' ? 'Multi-Restaurant HQ' : 'Restaurant POS')}
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 min-w-[280px] lg:min-w-[360px] px-3 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 text-slate-400">
            <FiSearch className="h-4 w-4" />
            <span className="text-sm font-medium">Search orders, tables, customers</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun className="w-[18px] h-[18px]" /> : <FiMoon className="w-[18px] h-[18px]" />}
            </button>

            {/* ── Bell Button + Panel ─────────────────────────────────── */}
            <div ref={panelRef} className="relative">
              <button
                id="notif-bell-btn"
                onClick={openPanel}
                className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                  panelOpen
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label="Notifications"
              >
                <FiBell className="w-[18px] h-[18px]" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-red-500/40 animate-pulse">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* ── Notification Dropdown ───────────────────────────────── */}
              <AnimatePresence>
                {panelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <FiBell className="text-slate-700 dark:text-white" size={15} />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-full">
                            {unread} new
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <button
                          onClick={markAll}
                          className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <FiCheckCircle size={11} /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {loadingNotifs ? (
                        <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
                      ) : notifs.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                          <FiBell size={28} className="opacity-25" />
                          No notifications yet
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div
                            key={n._id}
                            className={`flex items-start gap-3 px-4 py-3.5 group transition-colors cursor-default ${
                              n.isRead
                                ? 'bg-white dark:bg-slate-900'
                                : 'bg-violet-50/70 dark:bg-violet-950/20'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                              n.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-violet-100 dark:bg-violet-900/50'
                            }`}>
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'font-semibold text-slate-900 dark:text-white'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{n.message}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-600 flex items-center gap-1 mt-1">
                                <FiClock size={9} />
                                {formatDateTime(n.createdAt)}
                              </p>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={() => markOne(n._id)}
                                title="Mark as read"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 mt-1 flex-shrink-0"
                              >
                                <FiCheck size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-center">
                      <p className="text-[11px] text-slate-400 dark:text-slate-600">Showing last 20 notifications</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Restaurant Badge */}
            {user?.restaurantId?.name && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
                <span>🍽️</span> {user.restaurantId.name}
              </span>
            )}

            {/* Super Admin Badge */}
            {user?.role === 'super_admin' && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
                <span>👑</span> Super Admin (Dhamaan Maqayadaha)
              </span>
            )}

            {/* User */}
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
              <div className="w-9 h-9 rounded-lg bg-slate-950 dark:bg-primary-400 text-white dark:text-slate-950 flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{ROLE_LABELS[user?.role]}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Order Toast Notifications ─────────────────────────────────────── */}
      <div className="fixed top-[72px] right-4 z-[9999] flex flex-col gap-3 w-[340px] sm:w-[380px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl shadow-2xl shadow-violet-900/40"
              role="alert"
            >
              {/* Gradient BG */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />

              {/* Progress bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-[3px] bg-white/30 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 10, ease: 'linear' }}
              />

              <div className="relative px-4 py-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      🍽️
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-sm tracking-tight">{toast.title}</p>
                      <p className="text-violet-200 text-[11px] mt-0.5 font-semibold">Order #{toast.orderNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="text-white/50 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Close"
                  >
                    <FiX size={16} />
                  </button>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] font-bold">
                    <FiShoppingBag size={11} /> {toast.table}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] font-bold">
                    {toast.items} item{toast.items !== 1 ? 's' : ''}
                  </span>
                  {toast.total !== undefined && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[11px] font-extrabold ml-auto">
                      {formatCurrency(toast.total)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TopNavbar;

