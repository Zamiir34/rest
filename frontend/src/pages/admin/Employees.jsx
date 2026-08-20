import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';
import { ROLE_LABELS } from '../../utils/constants';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetch = async () => {
    const { data } = await api.get('/employees');
    setEmployees(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/employees', formData);
    setShowModal(false);
    reset();
    fetch();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
          <FiPlus /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp._id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                {emp.user?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{emp.user?.name}</h3>
                <p className="text-sm text-gray-500">{emp.position || ROLE_LABELS[emp.user?.role]}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <Badge variant="primary">{ROLE_LABELS[emp.user?.role]}</Badge>
              <span className="text-gray-500">{emp.employeeId}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">Add Employee</h2>
            <input {...register('name', { required: true })} placeholder="Full Name" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('email', { required: true })} type="email" placeholder="Email" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('password', { required: true })} type="password" placeholder="Password" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <select {...register('role', { required: true })} className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
              {['manager', 'cashier', 'chef', 'waiter'].map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <input {...register('position')} placeholder="Position" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('salary')} type="number" placeholder="Salary" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl">Save</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Employees;
