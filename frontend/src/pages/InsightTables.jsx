import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Table2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, CalendarDays, ListChecks } from 'lucide-react';
import { getSummary, getCategoryTrend, getTransactions } from '../api/client';
import { formatRupiah, formatCompact, MONTH_FULL } from '../utils/format';

// Mini sparkline for weekly trend in the category table
function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="expense"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function InsightTables() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [catTrend, setCatTrend] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSummary(month, year),
      getCategoryTrend(month, year),
      getTransactions({ month, year, limit: 100, page: 1 }),
    ]).then(([s, ct, tx]) => {
      setSummary(s);
      setCatTrend(ct);
      setTransactions(tx.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [month, year]);

  // Category split (same logic as the charts page)
  const incomeCats = summary?.by_category?.filter(c => c.total > 0 && !c.category_name.includes('Pengeluaran') && !c.category_name.includes('Lainnya (Peng'))
    .filter(c => !['Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Pendidikan', 'Tempat Tinggal'].includes(c.category_name))
    .sort((a, b) => b.total - a.total) || [];
  const expenseCats = summary?.by_category?.filter(c => c.total > 0 && (
    c.category_name.includes('Pengeluaran') ||
    ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Pendidikan', 'Tempat Tinggal'].includes(c.category_name)
  )).sort((a, b) => b.total - a.total) || [];

  const weeklyMap = {};
  catTrend?.categories?.forEach(c => { weeklyMap[c.category_id] = c.weekly; });

  const totalCatExpense = expenseCats.reduce((s, c) => s + c.total, 0);
  const totalCatIncome = incomeCats.reduce((s, c) => s + c.total, 0);

  // Daily summary aggregation from fetched transactions
  const dailyMap = {};
  transactions.forEach((t) => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { date: t.date, income: 0, expense: 0, count: 0 };
    if (t.type === 'income') dailyMap[t.date].income += t.amount;
    else dailyMap[t.date].expense += t.amount;
    dailyMap[t.date].count += 1;
  });
  const dailyRows = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  let runningBalance = 0;
  dailyRows.forEach((d) => { runningBalance += (d.income - d.expense); d.balance = runningBalance; });

  const txIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const txExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Table2 className="text-blue-500" size={24} />
            Table Data
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Rincian transaksi & kategori dalam bentuk tabel</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
            <button onClick={() => setYear(year - 1)} className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(year + 1)} className="px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A: Category breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
            Detail Pengeluaran & Pemasukan - {MONTH_FULL[month - 1]} {year}
          </h2>
        </div>

        {/* Income Section */}
        {incomeCats.length > 0 && (
          <div className="border-b border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-3 bg-green-50/50 dark:bg-green-900/20 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-green-500" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">Pemasukan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-gray-400 text-xs">
                    <th className="text-left px-4 sm:px-6 py-2.5 font-medium">Kategori</th>
                    <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Transaksi</th>
                    <th className="text-right px-3 py-2.5 font-medium">Jumlah</th>
                    <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">Persentase</th>
                    <th className="text-right px-3 sm:px-6 py-2.5 font-medium hidden md:table-cell">Tren Mingguan</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeCats.map((c) => {
                    const pct = totalCatIncome > 0 ? Math.round((c.total / totalCatIncome) * 100) : 0;
                    const weekly = weeklyMap[c.category_id] || [{ expense: 0 }, { expense: 0 }, { expense: 0 }, { expense: 0 }];
                    const sparkData = weekly.map(w => ({ expense: w.expense }));
                    return (
                      <tr key={c.category_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.category_color }} />
                            <span className="font-medium text-gray-700">{c.category_name}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 text-gray-400 dark:text-gray-500 hidden sm:table-cell">{c.count}</td>
                        <td className="text-right px-3 py-3 font-semibold text-green-600 dark:text-green-400">Rp {formatRupiah(c.total)}</td>
                        <td className="text-right px-3 py-3 hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="text-right px-3 sm:px-6 py-3 hidden md:table-cell">
                          <MiniSparkline data={sparkData} color={c.category_color} />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-green-50/30 dark:bg-green-900/20 font-semibold">
                    <td className="px-4 sm:px-6 py-3 text-green-700 dark:text-green-400">Total Pemasukan</td>
                    <td className="text-center px-3 py-3 text-green-600 hidden sm:table-cell">{incomeCats.reduce((s, c) => s + c.count, 0)}</td>
                    <td className="text-right px-3 py-3 text-green-700">Rp {formatRupiah(totalCatIncome)}</td>
                    <td className="text-right px-3 py-3 text-green-600 hidden sm:table-cell">100%</td>
                    <td className="px-3 sm:px-6 py-3 hidden md:table-cell" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expense Section */}
        {expenseCats.length > 0 && (
          <div>
            <div className="px-4 sm:px-6 py-3 bg-red-50/50 dark:bg-red-900/20 flex items-center gap-2">
              <ArrowDownRight size={16} className="text-red-500" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">Pengeluaran</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs">
                    <th className="text-left px-4 sm:px-6 py-2.5 font-medium">Kategori</th>
                    <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Transaksi</th>
                    <th className="text-right px-3 py-2.5 font-medium">Jumlah</th>
                    <th className="text-right px-3 py-2.5 font-medium hidden sm:table-cell">Persentase</th>
                    <th className="text-right px-3 sm:px-6 py-2.5 font-medium hidden md:table-cell">Tren Mingguan</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseCats.map((c) => {
                    const pct = totalCatExpense > 0 ? Math.round((c.total / totalCatExpense) * 100) : 0;
                    const weekly = weeklyMap[c.category_id] || [{ expense: 0 }, { expense: 0 }, { expense: 0 }, { expense: 0 }];
                    const sparkData = weekly.map(w => ({ expense: w.expense }));
                    return (
                      <tr key={c.category_id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.category_color }} />
                            <span className="font-medium text-gray-700 dark:text-gray-200">{c.category_name}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 text-gray-400 dark:text-gray-500 hidden sm:table-cell">{c.count}</td>
                        <td className="text-right px-3 py-3 font-semibold text-red-600 dark:text-red-400">Rp {formatRupiah(c.total)}</td>
                        <td className="text-right px-3 py-3 hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="text-right px-3 sm:px-6 py-3 hidden md:table-cell">
                          <MiniSparkline data={sparkData} color={c.category_color} />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-red-50/30 dark:bg-red-900/20 font-semibold">
                    <td className="px-4 sm:px-6 py-3 text-red-700 dark:text-red-400">Total Pengeluaran</td>
                    <td className="text-center px-3 py-3 text-red-600 hidden sm:table-cell">{expenseCats.reduce((s, c) => s + c.count, 0)}</td>
                    <td className="text-right px-3 py-3 text-red-700">Rp {formatRupiah(totalCatExpense)}</td>
                    <td className="text-right px-3 py-3 text-red-600 hidden sm:table-cell">100%</td>
                    <td className="px-3 sm:px-6 py-3 hidden md:table-cell" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {incomeCats.length === 0 && expenseCats.length === 0 && (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            Belum ada data transaksi untuk bulan ini
          </div>
        )}
      </div>

      {/* SECTION B: Detailed transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ListChecks size={18} className="text-gray-400" />
            Daftar Transaksi - {MONTH_FULL[month - 1]} {year}
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">{transactions.length} transaksi</span>
        </div>
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            Belum ada transaksi pada bulan ini
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium">Keterangan</th>
                  <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Tipe</th>
                  <th className="text-right px-4 py-3 font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.category_color || '#6b7280' }} />
                        <span className="text-gray-700 dark:text-gray-200">{t.category_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{t.description || '-'}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {t.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}Rp {formatRupiah(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300" colSpan={2}>Total</td>
                  <td className="px-4 py-3 hidden sm:table-cell" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-600 dark:text-green-400 mr-2">+Rp {formatCompact(txIncome)}</span>
                    <span className="text-red-600 dark:text-red-400">-Rp {formatCompact(txExpense)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* SECTION C: Daily summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays size={18} className="text-gray-400" />
            Ringkasan Harian - {MONTH_FULL[month - 1]} {year}
          </h2>
        </div>
        {dailyRows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            Belum ada data harian
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Transaksi</th>
                  <th className="text-right px-4 py-3 font-medium">Pemasukan</th>
                  <th className="text-right px-4 py-3 font-medium">Pengeluaran</th>
                  <th className="text-right px-4 py-3 font-medium">Saldo Harian</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 dark:text-gray-500 hidden sm:table-cell">{d.count}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">{d.income > 0 ? `Rp ${formatRupiah(d.income)}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">{d.expense > 0 ? `Rp ${formatRupiah(d.expense)}` : '-'}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${(d.income - d.expense) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {d.income - d.expense >= 0 ? '+' : ''}Rp {formatCompact(d.income - d.expense)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium hidden md:table-cell whitespace-nowrap ${d.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      Rp {formatCompact(d.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
