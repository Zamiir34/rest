import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canAccess, getRoleDashboard } from '../utils/constants';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, initializing } = useSelector((state) => state.auth);

  // Still verifying the stored token — don't redirect yet, show nothing / spinner
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !canAccess(user?.role, allowedRoles)) {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
