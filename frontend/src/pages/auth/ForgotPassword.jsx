import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
      {sent ? (
        <p className="text-green-600 text-center">Reset link sent to your email.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            {...register('email', { required: true })}
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold">
            Send Reset Link
          </button>
        </form>
      )}
      <Link to="/login" className="block text-center text-primary-600 mt-4 text-sm">Back to login</Link>
    </div>
  );
};

export default ForgotPassword;
