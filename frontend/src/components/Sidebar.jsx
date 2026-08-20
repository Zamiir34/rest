import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiChevronLeft,
  FiCoffee,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi';
import { logout } from '../redux/slices/authSlice';
import { toggleSidebar } from '../redux/slices/uiSlice';
import { ROLE_LABELS } from '../utils/constants';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/pos', icon: FiCreditCard, label: 'POS', roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'] },
      { path: '/kitchen', icon: FiCoffee, label: 'Kitchen', roles: ['super_admin', 'restaurant_admin', 'manager', 'chef'] },
      { path: '/orders', icon: FiShoppingBag, label: 'Orders', roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier', 'waiter', 'chef'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/admin/foods', icon: FiPackage, label: 'Foods', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/admin/categories', icon: FiGrid, label: 'Categories', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/admin/tables', icon: FiGrid, label: 'Tables', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/admin/customers', icon: FiUsers, label: 'Customers', roles: ['super_admin', 'restaurant_admin', 'manager', 'cashier'] },
      { path: '/admin/reservations', icon: FiCalendar, label: 'Reservations', roles: ['super_admin', 'restaurant_admin', 'manager', 'waiter'] },
      { path: '/admin/inventory', icon: FiPackage, label: 'Inventory', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/admin/employees', icon: FiUsers, label: 'Employees', roles: ['super_admin', 'restaurant_admin', 'manager'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/admin/reports', icon: FiBarChart2, label: 'Reports', roles: ['super_admin', 'restaurant_admin', 'manager'] },
      { path: '/admin/settings', icon: FiSettings, label: 'Settings', roles: ['super_admin', 'restaurant_admin'] },
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed left-0 top-0 h-full w-[270px] z-50 flex flex-col bg-sidebar text-slate-300 border-r border-sidebar-border shadow-2xl"
          >
            <div className="p-5 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white text-slate-950 flex items-center justify-center text-sm font-black shadow-lg shadow-cyan-950/40">
                    SB
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-white tracking-tight">Savory Bites</h1>
                    <p className="text-[10px] uppercase tracking-widest text-primary-300 font-semibold">Command OS</p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-hover text-slate-400"
                  aria-label="Close sidebar"
                >
                  <FiChevronLeft />
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <FiActivity className="h-3.5 w-3.5 text-emerald-300" />
                  System online
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-white">10</p>
                    <p className="text-[10px] text-slate-500">Tables</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Live</p>
                    <p className="text-[10px] text-slate-500">KDS</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">POS</p>
                    <p className="text-[10px] text-slate-500">Ready</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {navGroups.map((group) => {
                const items = group.items.filter((item) => canSee(item.roles));
                if (!items.length) return null;
                return (
                  <div key={group.label}>
                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                              isActive
                                ? 'bg-primary-400/12 text-primary-200 shadow-sm ring-1 ring-primary-400/20'
                                : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`
                          }
                        >
                          <item.icon className="w-[18px] h-[18px] shrink-0 opacity-80 group-hover:opacity-100" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-950 flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{ROLE_LABELS[user?.role]}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <FiLogOut className="w-[18px] h-[18px]" />
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
