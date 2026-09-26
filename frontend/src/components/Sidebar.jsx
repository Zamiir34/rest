import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCoffee,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiUsers,
  FiMapPin,
  FiArchive,
  FiShield,
  FiServer,
} from 'react-icons/fi';
import { logout } from '../redux/slices/authSlice';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { ROLE_LABELS } from '../utils/constants';

const navGroups = [
  {
    label: 'Super Admin',
    items: [
      {
        path: '/admin/restaurants',
        icon: FiServer,
        label: 'Maqayadaha (Restaurants)',
        roles: ['super_admin'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        path: '/admin/dashboard',
        icon: FiHome,
        label: 'Dashboard',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/pos',
        icon: FiCreditCard,
        label: 'POS Register',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/kitchen',
        icon: FiCoffee,
        label: 'Kitchen Display',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'chef'],
      },
      {
        path: '/orders',
        icon: FiShoppingBag,
        label: 'Orders',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier', 'waiter', 'chef'],
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        path: '/admin/foods',
        icon: FiPackage,
        label: 'Food Menu',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/admin/categories',
        icon: FiGrid,
        label: 'Categories',
        roles: ['super_admin', 'restaurant_admin', 'manager'],
      },
      {
        path: '/admin/tables',
        icon: FiMapPin,
        label: 'Dining Tables',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/admin/customers',
        icon: FiUsers,
        label: 'Customers',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/admin/reservations',
        icon: FiCalendar,
        label: 'Reservations',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'waiter'],
      },
      {
        path: '/admin/inventory',
        icon: FiArchive,
        label: 'Inventory',
        roles: ['super_admin', 'restaurant_admin', 'manager'],
      },
      {
        path: '/admin/employees',
        icon: FiShield,
        label: 'Staff & Team',
        roles: ['super_admin', 'restaurant_admin', 'manager'],
      },
    ],
  },
  {
    label: 'Insights & Config',
    items: [
      {
        path: '/admin/reports',
        icon: FiBarChart2,
        label: 'Analytics & Reports',
        roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'],
      },
      {
        path: '/admin/settings',
        icon: FiSettings,
        label: 'Store Settings',
        roles: ['super_admin', 'restaurant_admin'],
      },
    ],
  },
];

const Sidebar = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const canSee = (roles) => roles.includes(user?.role);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
          />

          {/* Sidebar Drawer / Aside */}
          <motion.aside
            initial={{ x: -290 }}
            animate={{ x: 0 }}
            exit={{ x: -290 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed left-0 top-0 h-full w-[270px] z-50 flex flex-col bg-sidebar text-slate-300 border-r border-sidebar-border shadow-2xl select-none"
          >
            {/* Top Brand Header */}
            <div className="p-5 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg shadow-primary-500/25 shrink-0">
                    {user?.restaurantId?.name ? user.restaurantId.name.substring(0, 2).toUpperCase() : (user?.role === 'super_admin' ? 'HQ' : 'POS')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-extrabold text-white tracking-tight truncate" title={user?.restaurantId?.name || (user?.role === 'super_admin' ? 'Super Admin HQ' : 'Restaurant OS')}>
                      {user?.restaurantId?.name || (user?.role === 'super_admin' ? 'Super Admin HQ' : 'Restaurant OS')}
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest text-primary-400 font-bold truncate">
                      {user?.restaurantId?.city ? `${user.restaurantId.city} • Branch` : (user?.role === 'super_admin' ? 'Global Platform' : 'Restaurant OS')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors"
                  aria-label="Close sidebar"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Status Signal Card */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System Live
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">v1.0</span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center border-t border-white/5 pt-2">
                  <div className="p-1 rounded bg-white/[0.03]">
                    <p className="text-xs font-bold text-white">Tables</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Ready</p>
                  </div>
                  <div className="p-1 rounded bg-white/[0.03]">
                    <p className="text-xs font-bold text-white">KDS</p>
                    <p className="text-[10px] text-sky-400 font-medium">Active</p>
                  </div>
                  <div className="p-1 rounded bg-white/[0.03]">
                    <p className="text-xs font-bold text-white">POS</p>
                    <p className="text-[10px] text-primary-400 font-medium">Synced</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
              {navGroups.map((group) => {
                const items = group.items.filter((item) => canSee(item.roles));
                if (!items.length) return null;

                return (
                  <div key={group.label} className="space-y-1.5">
                    {/* Section Kicker */}
                    <div className="px-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{group.label}</span>
                    </div>

                    {/* Nav Items with Unified Style */}
                    <div className="space-y-1">
                      {items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                              isActive
                                ? 'bg-primary-500/15 text-primary-300 font-bold border-l-2 border-primary-400 pl-2.5 shadow-xs'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isActive
                                      ? 'bg-primary-400 text-slate-950 font-bold shadow-xs'
                                      : 'bg-white/[0.05] text-slate-400 group-hover:text-white group-hover:bg-white/[0.1]'
                                  }`}
                                >
                                  <item.icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{item.label}</span>
                              </div>

                              {isActive ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-sm" />
                              ) : (
                                <FiChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Bottom Profile & Sign Out Footer */}
            <div className="p-4 border-t border-sidebar-border space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-sky-400 text-slate-950 flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</p>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary-300 bg-primary-500/10 px-1.5 py-0.5 rounded-md mt-0.5">
                    {ROLE_LABELS[user?.role] || user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition-all active:scale-98"
              >
                <FiLogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
