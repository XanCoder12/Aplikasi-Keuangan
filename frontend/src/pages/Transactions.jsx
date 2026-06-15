import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import { getTransactions, getCategories, createTransaction, updateTransaction, deleteTransaction } from '../api/client';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({ month: '', year: '', type: '', category_id: '' });
  const [form, setForm] = useState({ category_id: '', amount: '', description: '', date: '', type: 'expense' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const limit = 15;

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit };
    if (filters.month) params.month = parseInt(filters.month);
    if (filters.year) params.year = parseInt(filters.year);
    if (filters.type) params.type = filters.type;
    if (filters.category_id) params.category_id = parseInt(filters.category_id);

    getTransactions(params).then((res) => {
      setTransactions(res.data || []);
      setTotal(res.total || 0);
    }).finally(() => setLoading(false));
  }, [page, filters]);

  const openAdd = () => {
    setEditItem(null);
    setFormError('');
    setForm({ category_id: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'expense' });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditItem(t);
    setFormError('');
    setForm({
      category_id: t.category_id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      type: t.type,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Validate form
    if (!form.category_id) {
      setFormError('Pilih kategori terlebih dahulu');
      return;
    }
    if (!form.amount || parseInt(form.amount) <= 0) {
      setFormError('Masukkan jumlah yang valid');
      return;
    }
    if (!form.date) {
      setFormError('Pilih tanggal');
      return;
    }

    setFormError('');
    setSaving(true);

    const payload = {
      ...form,
      amount: parseInt(form.amount),
      category_id: parseInt(form.category_id),
    };

    try {
      if (editItem) {
        const updated = await updateTransaction(editItem.id, payload);
        setTransactions(transactions.map((t) => (t.id === editItem.id ? { ...t, ...updated } : t)));
      } else {
        const created = await createTransaction(payload);
        setTransactions([created, ...transactions]);
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Gagal menyimpan transaksi';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    await deleteTransaction(id);
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

  const categoryById = {};
  categories.forEach((c) => { categoryById[c.id] = c; });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Tambah Transaksi
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filter</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filters.month}
            onChange={(e) => { setFilters({ ...filters, month: e.target.value }); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Bulan</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id', { month: 'long' })}</option>
            ))}
          </select>
          <select
            value={filters.year}
            onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tahun</option>
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            value={filters.category_id}
            onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Belum ada transaksi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Deskripsi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Jumlah</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const cat = categoryById[t.category_id] || {};
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#6b7280' }} />
                          <span className="text-gray-700">{t.category_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {t.description || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                        t.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}Rp {formatCurrency(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Pencil size={16} className="text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {total} transaksi
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Transaksi' : 'Tambah Transaksi'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tipe</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.type === 'expense'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  form.type === 'income'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih kategori</option>
              {categories
                .filter((c) => c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Deskripsi</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
              {formError}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
