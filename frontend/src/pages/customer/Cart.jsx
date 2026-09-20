import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCheck,
  FiAlertCircle,
  FiEdit3,
} from 'react-icons/fi';
import api from '../../services/api';
import {
  updateQuantity,
  updateNotes,
  removeFromCart,
  clearCart,
  setCustomerInfo,
  selectCartTotal,
  selectCartCount,
} from '../../redux/slices/cartSlice';
import { formatCurrency } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getFoodImageUrl, handleImageError } from '../../utils/imageUtils';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, tableNumber, customerName, customerPhone } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);

  const [name, setName] = useState(customerName || '');
  const [phone, setPhone] = useState(customerPhone || '');
  const [table, setTableInput] = useState(tableNumber || '');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const menuUrl = tableNumber ? `/menu/table/${tableNumber}` : table ? `/menu/table/${table}` : '/';

  const handleOpenNote = (item) => {
    setEditingNoteId(item.food._id);
    setNoteText(item.notes || '');
  };

  const handleSaveNote = (foodId) => {
    dispatch(updateNotes({ foodId, notes: noteText.trim() }));
    setEditingNoteId(null);
    setNoteText('');
  };

  const placeOrder = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Please enter your name to complete the order.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add some dishes first.');
      return;
    }

    const currentTable = tableNumber || table || 'Walk-in';

    setLoading(true);
    try {
      dispatch(setCustomerInfo({ name: name.trim(), phone: phone.trim() }));
      const { data } = await api.post('/orders/public', {
        tableNumber: currentTable,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: items.map((i) => ({
          food: i.food._id,
          name: i.food.name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity,
          notes: i.notes || '',
        })),
      });
      dispatch(clearCart());
      navigate(`/track-order/${data.data._id}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-950/50 text-primary-500 flex items-center justify-center text-4xl mb-5 shadow-inner">
            🛒
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Your Cart is Empty
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            Looks like you haven't added any appetizing dishes to your cart yet. Browse our menu to start ordering!
          </p>
          <div className="mt-7">
            <Link
              to={menuUrl}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-primary-500 dark:hover:bg-primary-400 text-white dark:text-slate-950 font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <FiShoppingBag className="w-4 h-4" />
              <span>Explore Restaurant Menu</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3.5 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Link
            to={menuUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Order Cart
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Clear all items from your cart?')) {
                dispatch(clearCart());
              }
            }}
            title="Clear cart"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95"
            aria-label="Clear cart"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Table Badge Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <FiMapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ordering For</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {tableNumber ? `Table ${tableNumber}` : table ? `Table ${table}` : 'Dine In / Walk-in'}
              </p>
            </div>
          </div>
          <Link
            to={menuUrl}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
          >
            + Add More Dishes
          </Link>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-xs"
          >
            <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Cart Items List */}
        <div className="space-y-3.5">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.food._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* High Quality Dish Image with Error Handling */}
                  <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                    <img
                      src={getFoodImageUrl(item.food)}
                      alt={item.food.name}
                      loading="lazy"
                      onError={(e) => handleImageError(e, item.food)}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Food Info & Controls */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {item.food.name}
                        </h3>
                        <button
                          onClick={() => dispatch(removeFromCart(item.food._id))}
                          title="Remove item"
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-[11px] text-slate-400">each</span>
                      </div>
                    </div>

                    {/* Quantity Selector & Item Subtotal */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity - 1 }))
                          }
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-2xs active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity + 1 }))
                          }
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-2xs active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm sm:text-base font-black text-primary-600 dark:text-primary-400">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cooking Instructions / Special Request Note */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {editingNoteId === item.food._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="e.g. No spicy, sauce on side, allergy notes..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-primary-400 dark:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNote(item.food._id)}
                        className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-bold shadow-xs hover:bg-primary-500"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenNote(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <FiEdit3 className="w-3 h-3" />
                      {item.notes ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold truncate max-w-xs">
                          Note: {item.notes}
                        </span>
                      ) : (
                        <span className="text-slate-400 hover:underline">+ Add special instructions</span>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Customer Information Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Customer Details
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your name so the kitchen can identify your order.
            </p>
          </div>

          <div className="space-y-3">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohamed Ali"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Customer Phone (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +252 61 123 4567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            {/* Table Number if missing */}
            {!tableNumber && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Table Number <span className="text-slate-400 font-normal">(optional if walk-in)</span>
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={table}
                    onChange={(e) => setTableInput(e.target.value)}
                    placeholder="e.g. T05"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Receipt Summary Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Order Summary
          </h3>

          <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Items Total ({count})</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax & Service</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-base font-black text-slate-900 dark:text-white">
              <span>Total to Pay</span>
              <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Order Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Amount
            </span>
            <span className="text-xl sm:text-2xl font-black text-primary-600 dark:text-primary-400 tracking-tight">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={placeOrder}
            disabled={loading || items.length === 0}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary-500 dark:hover:bg-primary-400 dark:text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FiCheck className="w-5 h-5 stroke-[2.5]" />
                <span>Place Order Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
