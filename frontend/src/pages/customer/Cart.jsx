import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import {
  updateQuantity, removeFromCart, clearCart, setCustomerInfo, selectCartTotal,
} from '../../redux/slices/cartSlice';
import { formatCurrency } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, tableNumber, customerName, customerPhone } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (!name.trim()) return alert('Please enter your name');
    if (items.length === 0) return alert('Cart is empty');

    setLoading(true);
    try {
      dispatch(setCustomerInfo({ name, phone }));
      const { data } = await api.post('/orders/public', {
        tableNumber,
        customerName: name,
        customerPhone: phone,
        items: items.map((i) => ({
          food: i.food._id,
          quantity: i.quantity,
          notes: i.notes,
        })),
      });
      dispatch(clearCart());
      navigate(`/track-order/${data.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !tableNumber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <p className="text-sm text-gray-400">Scan a table QR code to start ordering</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-32">
      <h1 className="text-2xl font-bold mb-2">Your Cart</h1>
      {tableNumber && <p className="text-gray-500 mb-6">Table {tableNumber}</p>}

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.food._id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 flex gap-4">
            <img src={item.food.images?.[0] || 'https://placehold.co/100x100?text=Food'} alt="" className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="font-semibold">{item.food.name}</h3>
              <p className="text-primary-600 font-bold">{formatCurrency(item.price)}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity - 1 }))}
                  className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800"><FiMinus /></button>
                <span className="font-medium">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity + 1 }))}
                  className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800"><FiPlus /></button>
                <button onClick={() => dispatch(removeFromCart(item.food._id))} className="ml-auto text-red-500"><FiTrash2 /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 space-y-3 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *"
          className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-800" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)"
          className="w-full px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-800" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between mb-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
          </div>
          <button onClick={placeOrder} disabled={loading}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
