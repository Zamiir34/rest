import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import api from '../../services/api';

const REPORT_TYPES = ['sales', 'orders', 'inventory', 'food', 'employee', 'customer'];
const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const FORMATS = ['json', 'csv', 'excel', 'pdf'];

const Reports = () => {
  const [type, setType] = useState('sales');
  const [period, setPeriod] = useState('monthly');
  const [format, setFormat] = useState('json');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      if (format === 'json') {
        const { data: res } = await api.get(`/reports?type=${type}&period=${period}&format=json`);
        setData(res);
      } else {
        const { data: blob } = await api.get(`/reports?type=${type}&period=${period}&format=${format}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Report Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
              {PERIODS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800">
              {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <button onClick={generate} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold disabled:opacity-50">
          <FiDownload /> {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {data && format === 'json' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-2">{data.meta?.count} records found</p>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            {JSON.stringify(data.data?.slice(0, 10), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Reports;
