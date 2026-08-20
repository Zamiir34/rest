import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          {...register('password', { required: true, minLength: 6 })}
          type="password"
          placeholder="New password"
          className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          {...register('confirmPassword', {
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
          type="password"
          placeholder="Confirm password"
          className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold">
          Reset Password
        </button>
      </form>
      <Link to="/login" className="block text-center text-primary-600 mt-4 text-sm">Back to login</Link>
    </div>
  );
};

export default ResetPassword;
