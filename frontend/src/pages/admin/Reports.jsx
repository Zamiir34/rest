import { useState } from 'react';
import { FiDownload, FiFileText, FiChevronDown, FiLoader } from 'react-icons/fi';
import api from '../../services/api';

const REPORT_TYPES = ['sales', 'orders', 'inventory', 'food', 'employee', 'customer'];
const PERIODS      = ['daily', 'weekly', 'monthly', 'yearly'];
const FORMATS      = ['json', 'csv', 'excel', 'pdf'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const PillGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          value === opt
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {cap(opt)}
      </button>
    ))}
  </div>
);

const Reports = () => {
  const [type, setType]     = useState('sales');
  const [period, setPeriod] = useState('monthly');
  const [format, setFormat] = useState('json');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      if (format === 'json') {
        const { data: res } = await api.get(`/reports?type=${type}&period=${period}&format=json`);
        setData(res);
      } else {
        const { data: blob } = await api.get(`/reports?type=${type}&period=${period}&format=${format}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
        a.click();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Generate and export business reports</p>
      </div>

      {/* Config card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6">
        {/* Report type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Report Type</p>
          <PillGroup options={REPORT_TYPES} value={type} onChange={setType} />
        </div>

        {/* Period */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Period</p>
          <PillGroup options={PERIODS} value={period} onChange={setPeriod} />
        </div>

        {/* Format */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Export Format</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                  format === f
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
          <FiFileText className="text-violet-500" size={18} />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Generating <span className="font-semibold text-gray-900 dark:text-white">{cap(period)}</span> {' '}
            <span className="font-semibold text-violet-600 dark:text-violet-400">{cap(type)}</span> report as{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{format}</span>
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all duration-200"
        >
          {loading ? <FiLoader className="animate-spin" size={16} /> : <FiDownload size={16} />}
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* JSON Preview */}
      {data && format === 'json' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Preview <span className="text-gray-400 font-normal">— {data.meta?.count} records</span>
            </p>
            <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-2.5 py-0.5 rounded-full font-semibold">JSON</span>
          </div>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-gray-700 dark:text-gray-300 scrollbar-thin">
            {JSON.stringify(data.data?.slice(0, 10), null, 2)}
          </pre>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .animate-fadeIn  { animation: fadeIn .35s ease both }
        @keyframes spin   { to { transform: rotate(360deg) } }
        .animate-spin     { animation: spin 1s linear infinite }
      `}</style>
    </div>
  );
};

export default Reports;
