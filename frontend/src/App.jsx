import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getMe } from './redux/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import CustomerLayout from './layouts/CustomerLayout';
import { getRoleDashboard } from './utils/constants';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/admin/Dashboard';
import Foods from './pages/admin/Foods';
import Categories from './pages/admin/Categories';
import Tables from './pages/admin/Tables';
import Customers from './pages/admin/Customers';
import Reservations from './pages/admin/Reservations';
import Inventory from './pages/admin/Inventory';
import Employees from './pages/admin/Employees';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Restaurants from './pages/admin/Restaurants';
import POS from './pages/pos/POS';
import Kitchen from './pages/kitchen/Kitchen';
import Orders from './pages/orders/Orders';
import CustomerMenu from './pages/customer/CustomerMenu';
import OrderTracking from './pages/customer/OrderTracking';
import Cart from './pages/customer/Cart';

const STAFF_ROLES = ['super_admin', 'restaurant_admin', 'manager', 'cashier', 'chef', 'waiter'];
const ADMIN_ROLES = ['super_admin', 'restaurant_admin', 'manager'];

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/menu/table/:tableNumber" element={<CustomerMenu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/track-order/:orderId" element={<OrderTracking />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={STAFF_ROLES} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin/foods" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><Foods /></ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}><Categories /></ProtectedRoute>
          } />
          <Route path="/admin/tables" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><Tables /></ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><Customers /></ProtectedRoute>
          } />
          <Route path="/admin/reservations" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'waiter']}><Reservations /></ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}><Inventory /></ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}><Employees /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><Reports /></ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['super_admin', 'restaurant_admin']}><Settings /></ProtectedRoute>
          } />
          <Route path="/admin/restaurants" element={
            <ProtectedRoute allowedRoles={['super_admin']}><Restaurants /></ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'cashier']}><POS /></ProtectedRoute>
          } />
          <Route path="/kitchen" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES, 'chef']}><Kitchen /></ProtectedRoute>
          } />
          <Route path="/orders" element={<Orders />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
