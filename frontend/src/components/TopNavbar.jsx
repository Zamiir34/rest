import { useEffect, useState } from 'react';
import { FiBell, FiMenu, FiMoon, FiSearch, FiSun } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { ROLE_LABELS, formatCurrency } from '../utils/constants';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { AnimatePresence, motion } from 'framer-motion';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play first tone (D5 note, 587.33Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.1);

    // Play second tone (A5 note, 880Hz) after a short delay
    setTimeout(() => {
      const audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
      const osc2 = audioCtx2.createOscillator();
      const gain2 = audioCtx2.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx2.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx2.currentTime);
      gain2.gain.setValueAtTime(0.05, audioCtx2.currentTime);
      osc2.start();
      osc2.stop(audioCtx2.currentTime + 0.15);
    }, 150);
  } catch (err) {
    console.error('Audio play failed:', err);
  }
};

const TopNavbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { darkMode, toggleTheme } = useTheme();
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    api.get('/notifications?unread=true&limit=1')
      .then(({ data }) => setUnread(data.pagination?.total || 0))
      .catch(() => {});

    const socket = connectSocket();

    const handleNewOrder = (order) => {
      // Play sound
      playNotificationSound();
      // Increment count
      setUnread((prev) => prev + 1);
      // Add toast
      const id = Date.now();
      const newToast = {
        id,
        title: 'New Order Placed 🍽️',
        message: `Order ${order.orderNumber} ${order.tableNumber ? `for Table ${order.tableNumber}` : 'Walk-in'}`,
        total: order.total,
      };
      setToasts((prev) => [newToast, ...prev]);

      // Remove after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, []);

  return (
    <>
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
                Savory Bites
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

            <button className="relative p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Notifications">
              <FiBell className="w-[18px] h-[18px]" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

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

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto p-4 rounded-xl shadow-xl border bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-1 backdrop-blur-md"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-950 dark:text-white">{toast.title}</span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{toast.message}</p>
              {toast.total !== undefined && (
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">
                  Total: {formatCurrency(toast.total)}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TopNavbar;
