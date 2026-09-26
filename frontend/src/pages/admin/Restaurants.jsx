import { useEffect, useState } from 'react';
import {
  FiServer,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiMapPin,
  FiPhone,
  FiMail,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiShield,
  FiRefreshCw,
  FiLayers,
  FiAward,
  FiLock,
  FiCheck,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/constants';

/* ── Status badges & styles ────────────────────────────────────────── */
const STATUS_CONFIG = {
  active: {
    label: 'Shaqeynaya',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Xiran',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  suspended: {
    label: 'Hakad',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60',
    dot: 'bg-rose-500',
  },
};

const PLAN_CONFIG = {
  free_trial: { label: 'Free Trial', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  basic:      { label: 'Basic',      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  pro:        { label: 'Pro',        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  enterprise: { label: 'Enterprise', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
};

/* ── KPI Stat Card ─────────────────────────────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, gradient, borderColor }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className={`relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 border ${borderColor} shadow-sm`}
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10`} />
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
        <Icon size={22} />
      </div>
    </div>
  </motion.div>
);

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [addFormData, setAddFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: 'Mogadishu',
    currency: 'USD',
    taxRate: 5,
    subscriptionPlan: 'pro',
    notes: '',
    createAdmin: true,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    currency: 'USD',
    taxRate: 5,
    subscriptionPlan: 'pro',
    status: 'active',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  /* ── Fetch Data ──────────────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [ovRes, listRes] = await Promise.all([
        api.get('/restaurants/overview'),
        api.get(`/restaurants?search=${encodeURIComponent(search)}&status=${statusFilter}&subscriptionPlan=${planFilter}&limit=100`),
      ]);
      setOverview(ovRes.data.data);
      setRestaurants(listRes.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Khalad ayaa dhacay xogta soo qaadashadeeda', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  /* ── Quick status change ─────────────────────────────────────────── */
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/restaurants/${id}/status`, { status: newStatus });
      showToast(`Xaaladda maqayadda waxaa laga dhigay: ${newStatus}`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Khalad ayaa dhacay xaaladda bedelkeeda', 'error');
    }
  };

  /* ── Open Details Modal ──────────────────────────────────────────── */
  const openDetails = async (rest) => {
    setSelectedRestaurant(rest);
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/restaurants/${rest._id}`);
      setRestaurantDetails(data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Xogta lama heli karo', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  /* ── Open Edit Modal ─────────────────────────────────────────────── */
  const openEdit = (rest) => {
    setSelectedRestaurant(rest);
    setEditFormData({
      name: rest.name || '',
      email: rest.email || '',
      phone: rest.phone || '',
      address: rest.address || '',
      city: rest.city || 'Mogadishu',
      currency: rest.currency || 'USD',
      taxRate: rest.taxRate !== undefined ? rest.taxRate : 5,
      subscriptionPlan: rest.subscriptionPlan || 'pro',
      status: rest.status || 'active',
      notes: rest.notes || '',
    });
    setEditModalOpen(true);
  };

  /* ── Submit Edit ─────────────────────────────────────────────────── */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/restaurants/${selectedRestaurant._id}`, editFormData);
      showToast('Xogta maqayadda si guul leh ayaa loo cusbooneysiiyay');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cusbooneysiinta waa lagu fashilmay', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Submit Add ──────────────────────────────────────────────────── */
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/restaurants', addFormData);
      showToast('Maqayad cusub iyo maamulaheedii si guul leh ayaa loo diiwaangeliyay!');
      setAddModalOpen(false);
      // Reset form
      setAddFormData({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        city: 'Mogadishu',
        currency: 'USD',
        taxRate: 5,
        subscriptionPlan: 'pro',
        notes: '',
        createAdmin: true,
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Diiwaangelinta waa lagu fashilmay', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Submit Delete ───────────────────────────────────────────────── */
  const handleDeleteSubmit = async () => {
    if (!selectedRestaurant) return;
    setActionLoading(true);
    try {
      await api.delete(`/restaurants/${selectedRestaurant._id}`);
      showToast('Maqayadda si buuxda ayaa loo tiray');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Tiritaanka waa lagu fashilmay', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Toast Notification ────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toastMessage.type === 'error' ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
            <FiServer size={12} />
            Super Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Maamulka Maqayadaha (Restaurants)</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Maamul dhammaan maqayadaha iyo laamaha isticmaalaya system-ka: diiwaangeli maqayado cusub, kormeer dakhligooda iyo dalabaadkooda, xakamee xaaladda shaqo iyo rukumashada.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15 disabled:opacity-50"
            title="Cusbooneysii xogta"
          >
            <FiRefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-98 transition-all"
          >
            <FiPlus size={18} />
            Ku dar Maqayad Cusub
          </button>
        </div>
      </div>

      {/* ── KPI Stats Overview ────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Wadarta Maqayadaha"
            value={overview.totalRestaurants}
            subtext={`${overview.activeRestaurants} ayaa shaqeynaya`}
            icon={FiServer}
            gradient="from-indigo-500 to-purple-600"
            borderColor="border-indigo-100 dark:border-indigo-950/40"
          />
          <StatCard
            title="Maqayadaha Shaqeynaya"
            value={overview.activeRestaurants}
            subtext={`${overview.suspendedRestaurants} hakad kujira`}
            icon={FiCheckCircle}
            gradient="from-emerald-500 to-teal-600"
            borderColor="border-emerald-100 dark:border-emerald-950/40"
          />
          <StatCard
            title="Dalabaadka Guud (Orders)"
            value={overview.totalPlatformOrders}
            subtext="Dhammaan maqayadaha"
            icon={FiShoppingBag}
            gradient="from-sky-500 to-blue-600"
            borderColor="border-sky-100 dark:border-sky-950/40"
          />
          <StatCard
            title="Dakhliga Guud (Revenue)"
            value={formatCurrency(overview.totalPlatformRevenue)}
            subtext="Platform paid revenue"
            icon={FiDollarSign}
            gradient="from-amber-500 to-orange-600"
            borderColor="border-amber-100 dark:border-amber-950/40"
          />
        </div>
      )}

      {/* ── Filter & Search Toolbar ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Raadi magac, code, magaalo, taleefan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {[
              { id: 'all', label: 'Dhamaan' },
              { id: 'active', label: 'Shaqeynaya' },
              { id: 'suspended', label: 'Hakad' },
              { id: 'inactive', label: 'Xiran' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border-none outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Dhamaan Qorshayaasha (Plans)</option>
            <option value="enterprise">Enterprise</option>
            <option value="pro">Pro</option>
            <option value="basic">Basic</option>
            <option value="free_trial">Free Trial</option>
          </select>
        </div>
      </div>

      {/* ── Restaurants Grid ──────────────────────────────────────────── */}
      {restaurants.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FiServer size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Wax maqayad ah lama helin</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Ma jiraan maqayado ku habboon shaandhadaada ama raadintaada. Waxaad diiwaangelin kartaa maqayad cusub.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm shadow hover:bg-primary-700"
          >
            <FiPlus size={16} />
            Diiwaangeli Maqayaddii Koowaad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {restaurants.map((rest) => {
            const statusCfg = STATUS_CONFIG[rest.status] || STATUS_CONFIG.inactive;
            const planCfg = PLAN_CONFIG[rest.subscriptionPlan] || PLAN_CONFIG.basic;

            return (
              <motion.div
                key={rest._id}
                layout
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top gradient accent */}
                <div className="h-1.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600" />

                <div className="p-6 space-y-4 flex-1">
                  {/* Card Header: Code, Status, Plan */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 whitespace-nowrap">
                        {rest.code || 'REST'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${statusCfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider uppercase whitespace-nowrap ${planCfg.badge}`}>
                      {planCfg.label}
                    </span>
                  </div>

                  {/* Restaurant Name & Location */}
                  <div className="space-y-1">
                    <h2
                      className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1"
                      title={rest.name}
                    >
                      {rest.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <FiMapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{rest.city || 'Mogadishu'}{rest.address ? ` • ${rest.address}` : ''}</span>
                    </p>
                  </div>

                  {/* Contact & Owner Info Box */}
                  <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                        <FiShield size={13} className="text-indigo-500" /> Maamulaha:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={rest.owner?.name || rest.ownerName}>
                        {rest.owner?.name || rest.ownerName || 'Lama magacaabin'}
                      </span>
                    </div>

                    {rest.phone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                          <FiPhone size={13} /> Taleefan:
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                          {rest.phone}
                        </span>
                      </div>
                    )}

                    {rest.email && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                          <FiMail size={13} /> Email:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate" title={rest.email}>
                          {rest.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2x2 Metrics Grid - Clean, spacious, and readable */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Foods */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                        <FiPackage size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium truncate">Cuntooyinka</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                          {rest.stats?.foodCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Orders */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                        <FiShoppingBag size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium truncate">Dalabaadka</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                          {rest.stats?.orderCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Staff */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                        <FiUsers size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 font-medium truncate">Shaqaalaha</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                          {rest.stats?.employeeCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <FiDollarSign size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium truncate">Dakhliga</p>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5 truncate">
                          {formatCurrency(rest.stats?.totalRevenue || 0, rest.currency || 'USD')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3">
                  {/* Status Toggle Quick Select */}
                  <select
                    value={rest.status}
                    onChange={(e) => handleStatusChange(rest._id, e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="suspended">🔴 Suspended</option>
                    <option value="inactive">⚪ Inactive</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openDetails(rest)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      title="Eeg Faahfaahinta"
                    >
                      <FiEye size={17} />
                    </button>
                    <button
                      onClick={() => openEdit(rest)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Wax ka beddel"
                    >
                      <FiEdit size={17} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRestaurant(rest);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Tir Maqayadda"
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── ADD RESTAURANT MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FiServer className="text-primary-500" />
                    Diiwaangeli Maqayad Cusub (Add Restaurant)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Geli macluumaadka maqayadda cusub iyo koontada maamulaheedii.
                  </p>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    1. Xogta Maqayadda (Restaurant Information)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Magaca Maqayadda *
                      </label>
                      <input
                        type="text"
                        required
                        value={addFormData.name}
                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                        placeholder="Tusaale: Somali Grill Restaurant"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Code (Ikhtiyaari - Default: Auto)
                      </label>
                      <input
                        type="text"
                        value={addFormData.code}
                        onChange={(e) => setAddFormData({ ...addFormData, code: e.target.value })}
                        placeholder="REST-004"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Magaalada (City)
                      </label>
                      <input
                        type="text"
                        value={addFormData.city}
                        onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                        placeholder="Mogadishu, Hargeisa, Kismayo..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Taleefanka Maqayadda
                      </label>
                      <input
                        type="text"
                        value={addFormData.phone}
                        onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                        placeholder="+252 61..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email-ka Maqayadda
                      </label>
                      <input
                        type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                        placeholder="info@restaurant.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ciwaanka (Address)
                      </label>
                      <input
                        type="text"
                        value={addFormData.address}
                        onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                        placeholder="Jidka Maka Al-Mukarama..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white border border-transparent focus:border-primary-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Plan & Financial Settings */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    2. Qorshaha & Canshuurta (Plan & Finance)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Subscription Plan
                      </label>
                      <select
                        value={addFormData.subscriptionPlan}
                        onChange={(e) => setAddFormData({ ...addFormData, subscriptionPlan: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                      >
                        <option value="free_trial">Free Trial</option>
                        <option value="basic">Basic Plan</option>
                        <option value="pro">Pro Plan</option>
                        <option value="enterprise">Enterprise Plan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Lacagta (Currency)
                      </label>
                      <select
                        value={addFormData.currency}
                        onChange={(e) => setAddFormData({ ...addFormData, currency: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="SOS">SOS (Shiling)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={addFormData.taxRate}
                        onChange={(e) => setAddFormData({ ...addFormData, taxRate: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Provision Restaurant Admin */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      3. Koontada Maamulaha (Restaurant Admin Account)
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={addFormData.createAdmin}
                        onChange={(e) => setAddFormData({ ...addFormData, createAdmin: e.target.checked })}
                        className="w-4 h-4 rounded text-primary-600"
                      />
                      Samee koontada hadda
                    </label>
                  </div>

                  {addFormData.createAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Magaca Maamulaha *
                        </label>
                        <input
                          type="text"
                          required={addFormData.createAdmin}
                          value={addFormData.adminName}
                          onChange={(e) => setAddFormData({ ...addFormData, adminName: e.target.value })}
                          placeholder="Tusaale: Ahmed Jama"
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Email-ka Maamulaha *
                        </label>
                        <input
                          type="email"
                          required={addFormData.createAdmin}
                          value={addFormData.adminEmail}
                          onChange={(e) => setAddFormData({ ...addFormData, adminEmail: e.target.value })}
                          placeholder="admin.grill@restaurant.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Password-ka Koontada *
                        </label>
                        <input
                          type="password"
                          required={addFormData.createAdmin}
                          minLength={6}
                          value={addFormData.adminPassword}
                          onChange={(e) => setAddFormData({ ...addFormData, adminPassword: e.target.value })}
                          placeholder="Ugu yaraan 6 xaraf"
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Taleefanka Maamulaha
                        </label>
                        <input
                          type="text"
                          value={addFormData.adminPhone}
                          onChange={(e) => setAddFormData({ ...addFormData, adminPhone: e.target.value })}
                          placeholder="+252 61..."
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold"
                  >
                    Ka noqo (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 hover:brightness-110 disabled:opacity-50"
                  >
                    {actionLoading ? 'Diiwaangelinayaa...' : 'Diiwaangeli Maqayadda'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT RESTAURANT MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FiEdit className="text-primary-500" />
                    Wax ka beddel Maqayadda
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedRestaurant?.name} ({selectedRestaurant?.code})
                  </p>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Magaca Maqayadda
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Magaalada (City)
                    </label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Xaaladda (Status)
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    >
                      <option value="active">Active (Shaqeynaya)</option>
                      <option value="suspended">Suspended (Hakad)</option>
                      <option value="inactive">Inactive (Xiran)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Taleefanka
                    </label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email-ka
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ciwaanka (Address)
                    </label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={editFormData.subscriptionPlan}
                      onChange={(e) => setEditFormData({ ...editFormData, subscriptionPlan: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    >
                      <option value="free_trial">Free Trial</option>
                      <option value="basic">Basic Plan</option>
                      <option value="pro">Pro Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.taxRate}
                      onChange={(e) => setEditFormData({ ...editFormData, taxRate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow hover:bg-primary-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Keydinayaa...' : 'Keydi Isbeddelka'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DETAILS MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailsModalOpen && selectedRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-8 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {selectedRestaurant.code}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedRestaurant.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Faahfaahinta Guud ee Maqayadda & Shaqaalaheeda
                  </p>
                </div>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {loadingDetails ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <FiRefreshCw className="animate-spin inline mr-2" /> Soo qaadaya xogta faahfaahsan...
                  </div>
                ) : (
                  <>
                    {/* Performance Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Wadarta Dakhliga</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {formatCurrency(restaurantDetails?.stats?.totalRevenue || 0, selectedRestaurant.currency || 'USD')}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Dalabaadka</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {restaurantDetails?.stats?.orderCount || 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Cuntooyinka</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {restaurantDetails?.stats?.foodCount || 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Shaqaalaha</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                          {restaurantDetails?.staff?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Owner & Branch Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <FiShield size={14} /> Maamulaha Maqayadda (Owner)
                        </h4>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {restaurantDetails?.owner?.name || restaurantDetails?.ownerName || 'Lama magacaabin'}
                        </p>
                        <p className="text-xs text-slate-500">{restaurantDetails?.owner?.email || restaurantDetails?.ownerEmail || 'Email lama helin'}</p>
                        <p className="text-xs text-slate-500">{restaurantDetails?.owner?.phone || restaurantDetails?.phone || 'Taleefan lama helin'}</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                          <FiServer size={14} /> Qorshaha & Nidaamka
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Qorshaha:</span> {restaurantDetails?.subscriptionPlan?.toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Xaaladda:</span> {restaurantDetails?.status}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Canshuurta (Tax):</span> {restaurantDetails?.taxRate}%
                        </p>
                      </div>
                    </div>

                    {/* Staff List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Shaqaalaha Maqayaddan ({restaurantDetails?.staff?.length || 0})
                      </h4>
                      {restaurantDetails?.staff?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Weli wax shaqaale ah looma diiwaangelin maqayaddan.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                          {restaurantDetails?.staff?.map((u) => (
                            <div key={u._id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 text-xs">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-slate-400">{u.email}</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 uppercase text-[10px]">
                                {u.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Orders */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Dalabaadkii ugu dambeeyay (Recent Orders)
                      </h4>
                      {restaurantDetails?.recentOrders?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Weli wax dalabaad ah kama dhicin maqayaddan.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                          {restaurantDetails?.recentOrders?.map((ord) => (
                            <div key={ord._id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900 text-xs">
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">#{ord.orderNumber}</span>
                                <span className="ml-2 text-slate-400">({ord.customerName || 'Customer'})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900 dark:text-white">{formatCurrency(ord.total)}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold"
                >
                  Xir (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {deleteModalOpen && selectedRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ma hubtaa inaad tirto maqayaddan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Waxaad tiraysaa <span className="font-bold text-slate-900 dark:text-white">"{selectedRestaurant.name}"</span>. Ficilkan dib looma celin karo.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  Ka noqo
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteSubmit}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {actionLoading ? 'Tirayaa...' : 'Haa, Tir Maqayadda'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Restaurants;
