import { Outlet } from 'react-router-dom';

const CustomerLayout = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    <Outlet />
  </div>
);

export default CustomerLayout;
