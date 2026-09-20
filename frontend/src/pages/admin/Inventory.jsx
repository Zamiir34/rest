import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiPackage,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiX,
  FiCheck,
  FiTrendingUp,
  FiCalendar,
  FiLayers,
} from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/constants';

const COMMON_UNITS = ['kg', 'g', 'liters', 'ml', 'pcs', 'packs', 'boxes', 'bottles', 'cans'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'low' | 'healthy'

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockExpiry, setRestockExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchInventory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/inventory?${params}`);
      setItems(data.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  // Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter((i) => i.quantity <= i.minStock && i.quantity > 0).length;
    const outOfStock = items.filter((i) => i.quantity <= 0).length;
    const healthy = items.filter((i) => i.quantity > i.minStock).length;
    const totalValue = items.reduce((acc, i) => acc + (i.quantity || 0) * (i.costPerUnit || 0), 0);
    return { total, lowStock, outOfStock, healthy, totalValue };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isLow = item.quantity <= item.minStock;
      if (statusFilter === 'low') return isLow;
      if (statusFilter === 'healthy') return !isLow;
      return true;
    });
  }, [items, statusFilter]);

  // Open Add Item Modal
  const handleOpenAdd = () => {
    setEditItem(null);
    reset({
      name: '',
      sku: '',
      category: '',
      quantity: 10,
      minStock: 5,
      costPerUnit: 0,
      unit: 'kg',
      expiryDate: '',
    });
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const handleOpenEdit = (item) => {
    setEditItem(item);
    reset({
      name: item.name,
      sku: item.sku || '',
      category: item.category || '',
      quantity: item.quantity,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit || 0,
      unit: item.unit || 'kg',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    });
    setShowItemModal(true);
  };

  // Submit Add / Edit
  const onSubmitItem = async (formData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        minStock: Number(formData.minStock) || 0,
        costPerUnit: Number(formData.costPerUnit) || 0,
      };

      if (editItem) {
        await api.put(`/inventory/${editItem._id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setShowItemModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDelete = async (id) => {
    if (confirm('Deactivate and delete this inventory item?')) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchInventory();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  // Open Restock Modal
  const handleOpenRestock = (item) => {
    setRestockModalItem(item);
    setRestockQty(10);
    setRestockExpiry('');
  };

  // Submit Restock
  const handleConfirmRestock = async () => {
    if (!restockModalItem || restockQty <= 0) return;
    setSubmitting(true);
    try {
      await api.patch(`/inventory/${restockModalItem._id}/restock`, {
        quantity: Number(restockQty),
        expiryDate: restockExpiry || undefined,
      });
      setRestockModalItem(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="ds-page">
      {/* Page Header */}
      <PageHeader
        title="Inventory & Stock Control"
        subtitle="Manage restaurant ingredients, monitor low stock thresholds, and record quick restocks"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInventory(true)}
              disabled={refreshing}
              className="ds-btn-secondary py-2 text-xs"
              title="Refresh inventory"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
              <span>Refresh</span>
            </button>
            <button onClick={handleOpenAdd} className="ds-btn-primary py-2 text-xs">
              <FiPlus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          </div>
        }
      />

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="!p-4 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Items</span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FiPackage className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 dark:text-white mt-2">{metrics.total}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active stock lines</span>
        </Card>

        <Card className="!p-4 border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Low Stock</span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">{metrics.lowStock}</p>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">Need reordering</span>
        </Card>

        <Card className="!p-4 border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Out of Stock</span>
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <FiX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">{metrics.outOfStock}</p>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1 block">Critical shortage</span>
        </Card>

        <Card className="!p-4 border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Optimal Stock</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{metrics.healthy}</p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Sufficient supply</span>
        </Card>

        <Card className="!p-4 border-primary-200/60 dark:border-primary-900/40 bg-primary-50/20 dark:bg-primary-950/10 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Est. Stock Value</span>
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-primary-700 dark:text-primary-300 mt-2 truncate">
            {formatCurrency(metrics.totalValue)}
          </p>
          <span className="text-[11px] text-primary-600/80 dark:text-primary-400/80 mt-1 block">Inventory assets</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Items ({metrics.total})
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'low'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            ⚠️ Low Stock ({metrics.lowStock + metrics.outOfStock})
          </button>
          <button
            onClick={() => setStatusFilter('healthy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'healthy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            In Stock ({metrics.healthy})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients..." />
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="ds-table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th>Ingredient / Item</th>
              <th>Current Stock</th>
              <th>Min Alert</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Expiry</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FiLayers className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-sm">No inventory items found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try changing your search or filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isOutOfStock = item.quantity <= 0;
                const isLow = item.quantity <= item.minStock && !isOutOfStock;
                const percent = item.minStock > 0 ? Math.min(Math.round((item.quantity / (item.minStock * 2)) * 100), 100) : 100;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Item Name */}
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.sku && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.sku}
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[11px] text-slate-400">{item.category}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Current Quantity with Progress Bar */}
                    <td>
                      <div className="space-y-1 max-w-[130px]">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-sm font-black ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{item.unit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOutOfStock
                                ? 'bg-rose-500'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Min Stock */}
                    <td>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {item.minStock} {item.unit}
                      </span>
                    </td>

                    {/* Unit Cost */}
                    <td>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.costPerUnit ? formatCurrency(item.costPerUnit) : '-'}
                      </span>
                    </td>

                    {/* Total Value */}
                    <td>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.costPerUnit ? formatCurrency(item.quantity * item.costPerUnit) : '-'}
                      </span>
                    </td>

                    {/* Expiry Date */}
                    <td>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {item.expiryDate ? formatDate(item.expiryDate) : '-'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          <FiX className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <FiAlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <FiCheckCircle className="w-3 h-3" /> Optimal
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors inline-flex items-center gap-1"
                        >
                          <FiTrendingUp className="w-3 h-3" />
                          <span>Restock</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit item"
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete item"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-3.5">
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item / Ingredient Name *
                  </label>
                  <input
                    {...register('name', { required: true })}
                    placeholder="e.g. Chicken Breast, Olive Oil, Flour"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* SKU and Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      SKU / Code
                    </label>
                    <input
                      {...register('sku')}
                      placeholder="e.g. CHK-001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      {...register('category')}
                      placeholder="e.g. Meat, Dairy, Produce"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Quantity *
                    </label>
                    <input
                      {...register('quantity', { required: true })}
                      type="number"
                      step="any"
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit of Measure *
                    </label>
                    <select
                      {...register('unit', { required: true })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Min Stock & Cost Per Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Min. Stock Alert Level
                    </label>
                    <input
                      {...register('minStock')}
                      type="number"
                      step="any"
                      placeholder="10"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cost per Unit ($)
                    </label>
                    <input
                      {...register('costPerUnit')}
                      type="number"
                      step="0.01"
                      placeholder="4.50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date (optional)
                  </label>
                  <input
                    {...register('expiryDate')}
                    type="date"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-primary-500 dark:hover:bg-primary-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editItem ? 'Update Stock' : 'Create Stock Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Quick Restock Modal */}
      <AnimatePresence>
        {restockModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Restock Ingredient
                    </h3>
                    <p className="text-xs text-slate-400">{restockModalItem.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRestockModalItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Current Stock info pill */}
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {restockModalItem.quantity} {restockModalItem.unit}
                  </span>
                </div>

                {/* Quick Increment Buttons */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Quick Add Amount
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setRestockQty(amount)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition-colors ${
                          restockQty === amount
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity to Add ({restockModalItem.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Projected Stock Total */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                    New Projected Total:
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-black text-sm">
                    {Number(restockModalItem.quantity || 0) + Number(restockQty || 0)} {restockModalItem.unit}
                  </span>
                </div>

                {/* Expiry Date (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={restockExpiry}
                    onChange={(e) => setRestockExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestockModalItem(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestock}
                    disabled={submitting || restockQty <= 0}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Confirm Restock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
