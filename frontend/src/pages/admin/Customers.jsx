import { useEffect, useState } from 'react';
import api from '../../services/api';
import SearchInput from '../../components/SearchInput';
import { PageLoader } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/constants';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(`/customers?search=${search}`).then(({ data }) => {
      setCustomers(data.data);
      setLoading(false);
    });
  }, [search]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customers</h1>
        <SearchInput value={search} onChange={setSearch} className="w-64" />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Name', 'Phone', 'Orders', 'Total Spent', 'Last Order'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4 text-gray-500">{c.phone || '-'}</td>
                <td className="px-6 py-4">{c.orderCount}</td>
                <td className="px-6 py-4">{formatCurrency(c.totalSpending)}</td>
                <td className="px-6 py-4 text-gray-500">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
