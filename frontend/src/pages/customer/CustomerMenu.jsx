import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiShoppingCart } from 'react-icons/fi';
import api from '../../services/api';
import { setTable, addToCart } from '../../redux/slices/cartSlice';
import { selectCartCount } from '../../redux/slices/cartSlice';
import Badge from '../../components/Badge';
import SearchInput from '../../components/SearchInput';
import { formatCurrency } from '../../utils/constants';
import { PageLoader, Skeleton } from '../../components/LoadingSpinner';
import { getFoodImageUrl, handleImageError } from '../../utils/imageUtils';

const CustomerMenu = () => {
  const { tableNumber } = useParams();
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [table, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    dispatch(setTable(tableNumber));
    Promise.all([
      api.get(`/tables/public/${tableNumber}`),
      api.get('/categories'),
      api.get(`/foods?isAvailable=true&limit=50`),
    ]).then(([tableRes, catRes, foodRes]) => {
      setTableData(tableRes.data.data);
      setCategories(catRes.data.data);
      setFoods(foodRes.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tableNumber, dispatch]);

  const filtered = foods.filter((f) => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || f.category?._id === category || f.category === category;
    return matchSearch && matchCat;
  });

  if (loading) return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-lg shadow-md">
              🍽️
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Savory Bites</h1>
              <p className="text-xs font-semibold text-primary-600">Table {tableNumber}</p>
            </div>
          </div>
          <Link
            to="/cart"
            className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-shadow"
          >
            <FiShoppingCart className="w-4 h-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search menu..." />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              !category
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setCategory(cat._id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                category === cat._id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((food, index) => (
            <motion.div
              key={food._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.98 }}
              className="ds-card-hover overflow-hidden !p-0"
            >
              <div className="relative overflow-hidden group">
                <img
                  src={getFoodImageUrl(food)}
                  alt={food.name}
                  loading="lazy"
                  onError={(e) => handleImageError(e, food)}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {food.isPopular && (
                  <span className="absolute top-3 left-3 shadow-md">
                    <Badge variant="primary">Popular</Badge>
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 dark:text-white">{food.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{food.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(food.price)}</span>
                  <button
                    onClick={() => dispatch(addToCart({ food }))}
                    className="px-4 py-2 bg-slate-900 dark:bg-primary-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerMenu;
