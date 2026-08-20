import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiShoppingBag, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/Badge';
import { formatCurrency, formatDateTime, STATUS_COLORS } from '../../utils/constants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card hover className="relative overflow-hidden min-h-[148px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-400/70 to-transparent" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-2 tracking-tight">{value}</p>
        </div>
        <div className={`ds-stat-icon bg-gradient-to-br ${gradient} ring-1 ring-white/20`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-600 dark:text-emerald-300">Live synced</span>
        <span className="text-slate-400">Operational metric</span>
      </div>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/dashboard?period=${period}`);
        setStats(data.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period]);

  if (loading) return <PageLoader />;

  const lineData = {
    labels: stats?.salesByDay?.map((d) => d._id) || [],
    datasets: [{
      label: 'Revenue',
      data: stats?.salesByDay?.map((d) => d.revenue) || [],
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(6, 182, 212, 0.10)',
      fill: true,
      tension: 0.4,
    }],
  };

  const doughnutData = {
    labels: ['Pending', 'Preparing', 'Ready', 'Completed'],
    datasets: [{
      data: [
        stats?.ordersByStatus?.pending || 0,
        stats?.ordersByStatus?.preparing || 0,
        stats?.ordersByStatus?.ready || 0,
        stats?.ordersByStatus?.completed || 0,
      ],
      backgroundColor: ['#f59e0b', '#f97316', '#10b981', '#64748b'],
      borderColor: 'transparent',
      hoverOffset: 6,
    }],
  };

  return (
    <div className="ds-page">
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of sales, orders, customers, and stock signals"
        action={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="ds-input w-auto min-w-[140px] py-2 text-sm font-medium"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Revenue" value={formatCurrency(stats?.revenue)} gradient="from-emerald-400 to-emerald-600" delay={0} />
        <StatCard icon={FiShoppingBag} label="Orders" value={stats?.orders || 0} gradient="from-primary-400 to-primary-600" delay={0.1} />
        <StatCard icon={FiUsers} label="Customers" value={stats?.customers || 0} gradient="from-sky-400 to-blue-600" delay={0.2} />
        <StatCard icon={FiAlertTriangle} label="Low Stock" value={stats?.lowStockCount || 0} gradient="from-rose-400 to-red-600" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="system-kicker mb-1">Revenue pulse</p>
              <h3 className="font-bold text-slate-950 dark:text-white">Sales Trend</h3>
            </div>
            <Badge variant="success">Realtime</Badge>
          </div>
          <div className="min-h-[280px]">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(148, 163, 184, 0.18)' } },
                },
              }}
            />
          </div>
        </Card>
        <Card>
          <div className="mb-5">
            <p className="system-kicker mb-1">Kitchen flow</p>
            <h3 className="font-bold text-slate-950 dark:text-white">Orders by Status</h3>
          </div>
          <div className="min-h-[280px] flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-5">
            <p className="system-kicker mb-1">Demand</p>
            <h3 className="font-bold text-slate-950 dark:text-white">Popular Foods</h3>
          </div>
          <div className="space-y-3">
            {stats?.popularFoods?.map((food, i) => (
              <div key={i} className="flex justify-between items-center gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{food.name}</span>
                <Badge variant="primary">{food.totalSold} sold</Badge>
              </div>
            )) || <p className="text-slate-400 text-sm">No data yet</p>}
          </div>
        </Card>
        <Card>
          <div className="mb-5">
            <p className="system-kicker mb-1">Activity</p>
            <h3 className="font-bold text-slate-950 dark:text-white">Recent Orders</h3>
          </div>
          <div className="space-y-3">
            {stats?.recentOrders?.map((order) => (
              <div key={order._id} className="flex justify-between items-center gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
            )) || <p className="text-slate-400 text-sm">No orders yet</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
