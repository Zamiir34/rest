import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canAccess, getRoleDashboard } from '../utils/constants';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !canAccess(user?.role, allowedRoles)) {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
