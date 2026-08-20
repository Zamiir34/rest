import { useEffect, useState } from 'react';
import { FiPlus, FiDownload } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { PageLoader } from '../../components/LoadingSpinner';

const statusVariant = { available: 'success', reserved: 'warning', occupied: 'danger' };

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const fetch = async () => {
    const { data } = await api.get('/tables?limit=50');
    setTables(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const onSubmit = async (formData) => {
    await api.post('/tables', formData);
    setShowModal(false);
    reset();
    fetch();
  };

  const downloadQR = async (id, tableNumber) => {
    const { data } = await api.get(`/tables/${id}/download-qr`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${tableNumber}.png`;
    a.click();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl">
          <FiPlus /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table._id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{table.tableNumber}</h3>
                <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
              </div>
              <Badge variant={statusVariant[table.status]}>{table.status}</Badge>
            </div>
            <div className="flex justify-center my-4 cursor-pointer" onClick={() => setSelectedQR(table)}>
              {table.qrCodeUrl && <QRCodeSVG value={table.qrCodeUrl} size={120} />}
            </div>
            <p className="text-xs text-gray-400 text-center truncate">{table.qrCodeUrl}</p>
            <button onClick={() => downloadQR(table._id, table.tableNumber)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 border rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              <FiDownload /> Download QR
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">Add Table</h2>
            <input {...register('tableNumber', { required: true })} placeholder="Table Number (e.g. T01)" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <input {...register('capacity', { required: true })} type="number" placeholder="Capacity" className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 dark:bg-gray-800" />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-xl">Create & Generate QR</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedQR(null)}>
          <div className="bg-white p-8 rounded-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG value={selectedQR.qrCodeUrl} size={256} />
            <p className="mt-4 font-bold">{selectedQR.tableNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
