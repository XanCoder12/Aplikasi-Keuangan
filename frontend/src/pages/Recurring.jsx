import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Repeat, Zap, CalendarClock, CheckCircle2, PauseCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { getRecurring, getCategories, createRecurring, updateRecurring, deleteRecurring, processRecurring } from '../api/client';
import { formatRupiah } from '../utils/format';

const FREQUENCY_LABEL = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

const FREQUENCY_STYLE = {
  daily: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  weekly: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  monthly: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  yearly: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

const emptyForm = {
  category_id: '',
  amount: '',
  description: '',
  type: 'expense',
  frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  is_active: true,
};

export default function Recurring() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const fetchItems = () => {
    setLoading(true);
    getRecurring()
      .then((res) => setItems(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openAdd = () => {
    setEditItem(null);
    setFormError('');
    setForm({ ...emptyForm, start_date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormError('');
    setForm({
      category_id: item.category_id,
      amount: item.amount,
      description: item.description,
      type: item.type,
      frequency: item.frequency,
      start_date: item.start_date,
      end_date: item.end_date || '',
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.category_id) { setFormError('Pilih kategori terlebih dahulu'); return; }
    if (!form.amount || parseInt(form.amount) <= 0) { setFormError('Masukkan jumlah yang valid'); return; }
    if (!form.start_date) { setFormError('Pilih tanggal mulai'); return; }

    setFormError('');
    setSaving(true);

    const payload = {
      category_id: parseInt(form.category_id),
      amount: parseInt(form.amount),
      description: form.description,
      type: form.type,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || '',
      is_active: form.is_active,
    };

    try {
      if (editItem) {
        await updateRecurring(editItem.id, payload);
      } else {
        await createRecurring(payload);
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Gagal menyimpan transaksi berulang';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi berulang ini?')) return;
    await deleteRecurring(id);
    setItems(items.filter((i) => i.id !== id));
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await processRecurring();
      const count = res?.processed || 0;
      showToast(count > 0 ? `${count} transaksi berhasil dibuat` : 'Tidak ada transaksi yang perlu diproses');
      fetchItems();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Gagal memproses');
    } finally {
      setProcessing(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateRecurring(item.id, {
        category_id: item.category_id,
        amount: item.amount,
        description: item.description,
        type: item.type,
        frequency: item.frequency,
        start_date: item.start_date,
        end_date: item.end_date || '',
        is_active: !item.is_active,
      });
      fetchItems();
    } catch {
      showToast('Gagal mengubah status');
    }
  };

  const categoryById = {};
  categories.forEach((c) => { categoryById[c.id] = c; });

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Repeat className="text-blue-500" size={24} />
            Transaksi Berulang
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {activeCount} aktif dari {items.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm font-medium"
            title="Proses transaksi berulang yang sudah jatuh tempo"
          >
            <Zap size={16} />
            <span className="hidden sm:inline">Proses Sekarang</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-3.5 flex items-start gap-3">
        <CalendarClock size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
          Transaksi berulang otomatis dibuat saat server dimulai. Gunakan tombol <span className="font-semibold">Proses Sekarang</span> untuk memproses segera.
        </p>
      </div>

      {/* Mobile: Card List */}
      <div className="sm:hidden space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Repeat size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi berulang</p>
          </div>
        ) : (
          items.map((item) => {
            const cat = categoryById[item.category_id] || {};
            return (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (cat.color || item.category_color || '#6b7280') + '15' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || item.category_color || '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => openEdit(item)}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {item.description || item.category_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.category_name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${FREQUENCY_STYLE[item.frequency]}`}>
                        {FREQUENCY_LABEL[item.frequency]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(item); }}
                      className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium"
                    >
                      {item.is_active ? (
                        <span className="text-green-500 flex items-center gap-0.5"><CheckCircle2 size={11} /> Aktif</span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-0.5"><PauseCircle size={11} /> Nonaktif</span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-700/50">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    Berikutnya: {formatDateShort(item.next_date)}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Pencil size={14} className="text-gray-400 dark:text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Repeat size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Belum ada transaksi berulang</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Frekuensi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Mulai</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Berikutnya</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const cat = categoryById[item.category_id] || {};
                  return (
                    <tr key={item.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || item.category_color || '#6b7280' }} />
                          <div className="min-w-0">
                            <p className="text-gray-700 dark:text-gray-200 truncate">{item.category_name}</p>
                            {item.description && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FREQUENCY_STYLE[item.frequency]}`}>
                          {FREQUENCY_LABEL[item.frequency]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateShort(item.start_date)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateShort(item.next_date)}</td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.type === 'income' ? '+' : '-'}Rp {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleActive(item)} className="inline-flex items-center gap-1 text-xs font-medium">
                          {item.is_active ? (
                            <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={13} /> Aktif</span>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1"><PauseCircle size={13} /> Nonaktif</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Pencil size={16} className="text-gray-400 dark:text-gray-500" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
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
      </div>

      {/* FAB - Mobile only */}
      <button
        onClick={openAdd}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
      >
        <Plus size={26} />
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-gray-800 dark:bg-gray-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tipe</label>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.type === 'expense'
                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.type === 'income'
                    ? 'bg-green-50 border-green-200 text-green-700 shadow-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Kategori</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200"
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
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 text-lg font-semibold"
              placeholder="100000"
              required
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Frekuensi</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(FREQUENCY_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, frequency: key })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    form.frequency === key
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Mulai</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Berakhir (opsional)</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Deskripsi</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-200"
              placeholder="Contoh: Sewa bulanan, Langganan internet..."
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Aktif</span>
          </label>

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-2.5">
              {formError}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
          >
            {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Transaksi Berulang'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
