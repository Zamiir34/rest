export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  RESTAURANT_ADMIN: 'restaurant_admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  CHEF: 'chef',
  WAITER: 'waiter',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  restaurant_admin: 'Restaurant Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  chef: 'Chef',
  waiter: 'Waiter',
};

export const ORDER_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  served: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'evc_plus', label: 'EVC Plus' },
  { value: 'sahal', label: 'Sahal' },
  { value: 'premier_wallet', label: 'Premier Wallet' },
  { value: 'credit_card', label: 'Credit Card' },
];

export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const getRoleDashboard = (role) => {
  const routes = {
    super_admin: '/admin/dashboard',
    restaurant_admin: '/admin/dashboard',
    manager: '/admin/dashboard',
    cashier: '/pos',
    chef: '/kitchen',
    waiter: '/orders',
  };
  return routes[role] || '/login';
};

export const canAccess = (userRole, allowedRoles) => allowedRoles.includes(userRole);
