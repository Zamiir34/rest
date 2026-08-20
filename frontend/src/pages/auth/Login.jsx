import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { login, clearError } from '../../redux/slices/authSlice';
import { getRoleDashboard } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    dispatch(clearError());
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate(getRoleDashboard(result.payload.role));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-sm font-black">
          SB
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white">Savory Bites</h1>
          <p className="text-xs text-slate-500">Restaurant Command OS</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="system-kicker mb-3">Staff access</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Sign in to open your restaurant control console
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="admin@restaurant.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? <LoadingSpinner size="sm" /> : (
            <>
              Sign in
              <FiArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-6 px-4 py-3 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
        Demo: <span className="font-medium text-slate-500">admin@restaurant.com</span> / admin123
      </p>
    </motion.div>
  );
};

export default Login;
