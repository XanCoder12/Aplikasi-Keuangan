import { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
  BarChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { getYearlyTrend, getCategoryTrend, getSummary } from '../api/client';
import { formatRupiah, formatCompact, MONTH_NAMES, MONTH_FULL } from '../utils/format';

// Custom tooltip for the mixed chart
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">Rp {formatCompact(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function InsightCharts() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [yearlyTrend, setYearlyTrend] = useState(null);
  const [catTrend, setCatTrend] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getYearlyTrend(year),
      getCategoryTrend(month, year),
      getSummary(month, year),
    ]).then(([yt, ct, s]) => {
      setYearlyTrend(yt);
      setCatTrend(ct);
      setSummary(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [year, month]);

  // Prepare mixed chart data
  const chartData = yearlyTrend?.months?.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Pemasukan: m.income,
    Pengeluaran: m.expense,
    Saldo: m.balance,
    Selisih: m.income - m.expense,
  })) || [];

  // Cumulative cash flow data
  let cumulative = 0;
  const cashFlowData = yearlyTrend?.months?.map((m) => {
    cumulative += (m.income - m.expense);
    return {
      name: MONTH_NAMES[m.month - 1],
      'Cash Flow': cumulative,
      Income: m.income,
      Expense: m.expense,
    };
  }) || [];

  // Monthly comparison data (for dual-axis chart)
  const monthlyComparison = yearlyTrend?.months?.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    income: m.income,
    expense: m.expense,
    ratio: m.income > 0 ? Math.round((m.expense / m.income) * 100) : 0,
  })) || [];

  // Summary stats
  const totalIncome = yearlyTrend?.total_income || 0;
  const totalExpense = yearlyTrend?.total_expense || 0;
  const yearBalance = yearlyTrend?.balance || 0;
  const monthIncome = summary?.total_income || 0;
  const monthExpense = summary?.total_expense || 0;

  // Category data for charts
  const incomeCats = summary?.by_category?.filter(c => c.total > 0 && !c.category_name.includes('Pengeluaran') && !c.category_name.includes('Lainnya (Peng'))
    .filter(c => !['Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Pendidikan', 'Tempat Tinggal'].includes(c.category_name))
    .sort((a, b) => b.total - a.total) || [];
  const expenseCats = summary?.by_category?.filter(c => c.total > 0 && (
    c.category_name.includes('Pengeluaran') ||
    ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Pendidikan', 'Tempat Tinggal'].includes(c.category_name)
  )).sort((a, b) => b.total - a.total) || [];

  const totalCatExpense = expenseCats.reduce((s, c) => s + c.total, 0);
  const totalCatIncome = incomeCats.reduce((s, c) => s + c.total, 0);

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
            <Sparkles className="text-amber-500" size={24} />
            Chart Data
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Visualisasi tren keuangan</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg"><ArrowUpRight size={16} className="text-green-500" /></div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Pemasukan {year}</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-green-600">Rp {formatCompact(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg"><ArrowDownRight size={16} className="text-red-500" /></div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Pengeluaran {year}</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-red-600">Rp {formatCompact(totalExpense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Wallet size={16} className="text-blue-500" /></div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Saldo {year}</span>
          </div>
          <p className={`text-base sm:text-xl font-bold ${yearBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Rp {formatCompact(yearBalance)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 shadow-sm text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/20 rounded-lg"><Calendar size={16} className="text-white" /></div>
            <span className="text-xs text-white/70">Bulan ini</span>
          </div>
          <p className="text-base sm:text-xl font-bold">Rp {formatCompact(monthIncome - monthExpense)}</p>
          <p className="text-[10px] sm:text-xs text-white/60 mt-0.5">{MONTH_FULL[month - 1]}</p>
        </div>
      </div>

      {/* Row 1: Yearly Trend + Cash Flow */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Mixed Chart - Yearly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Tren Keuangan Tahunan</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-3 h-3 rounded bg-green-400" /> Masuk</span>
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-3 h-3 rounded bg-red-400" /> Keluar</span>
              <span className="flex items-center gap-1.5 hidden sm:flex text-gray-600 dark:text-gray-300"><span className="w-3 h-1.5 rounded-full bg-blue-500" /> Saldo</span>
            </div>
          </div>
          {chartData.some(d => d.Pemasukan > 0 || d.Pengeluaran > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Pemasukan" fill="url(#incomeGrad)" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="Pengeluaran" fill="url(#expenseGrad)" radius={[4, 4, 0, 0]} barSize={18} />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">
              Belum ada data untuk tahun {year}
            </div>
          )}
        </div>

        {/* Cash Flow Area Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Akumulasi Cash Flow</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-3 h-3 rounded-full bg-indigo-500" /> Akumulasi</span>
            </div>
          </div>
          {cashFlowData.some(d => d.Income > 0 || d.Expense > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Cash Flow"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#cashFlowGrad)"
                  dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">
              Belum ada data untuk tahun {year}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Expense Ratio Mixed Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Rasio Pengeluaran terhadap Pemasukan</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-3 h-3 rounded bg-emerald-500" /> Pemasukan</span>
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-3 h-3 rounded bg-rose-500" /> Pengeluaran</span>
            <span className="flex items-center gap-1.5 hidden sm:flex text-gray-600 dark:text-gray-300"><span className="w-3 h-1.5 rounded-full bg-amber-500" /> Rasio %</span>
          </div>
        </div>
        {monthlyComparison.some(d => d.income > 0 || d.expense > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyComparison} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={formatCompact} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} domain={[0, 150]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Pemasukan" />
              <Bar yAxisId="left" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} name="Pengeluaran" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ratio"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                name="Rasio"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500 text-sm">
            Belum ada data untuk tahun {year}
          </div>
        )}
      </div>

      {/* Row 3: Category Horizontal Bar + Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Categories Horizontal Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Kategori Pengeluaran</h2>
          {expenseCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={expenseCats.slice(0, 8).map(c => ({ name: c.category_name, total: c.total, color: c.category_color }))}
                layout="vertical"
                margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatCompact} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20} name="Total">
                  {expenseCats.slice(0, 8).map((c, i) => <Cell key={i} fill={c.category_color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">
              Belum ada data pengeluaran
            </div>
          )}
        </div>

        {/* Category Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
          <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Distribusi Kategori (Radar)</h2>
          {expenseCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={expenseCats.slice(0, 8).map(c => ({
                category: c.category_name.length > 12 ? c.category_name.substring(0, 12) + '...' : c.category_name,
                value: c.total,
                fullMark: Math.max(...expenseCats.map(e => e.total)),
              }))}>
                <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-600" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} tickFormatter={formatCompact} />
                <Radar
                  name="Pengeluaran"
                  dataKey="value"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v) => `Rp ${formatRupiah(v)}`} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              Belum ada data pengeluaran
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Pie Charts - Income & Expense Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Expense Distribution */}
        {expenseCats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Distribusi Pengeluaran</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={expenseCats.map(c => ({ name: c.category_name, value: c.total, color: c.category_color }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseCats.map((c, i) => <Cell key={i} fill={c.category_color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `Rp ${formatRupiah(v)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                {expenseCats.slice(0, 8).map(c => (
                  <div key={c.category_id} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.category_color }} />
                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{c.category_name}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{totalCatExpense > 0 ? Math.round((c.total / totalCatExpense) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Income Distribution */}
        {incomeCats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 shadow-sm transition-colors">
            <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Distribusi Pemasukan</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={incomeCats.map(c => ({ name: c.category_name, value: c.total, color: c.category_color }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incomeCats.map((c, i) => <Cell key={i} fill={c.category_color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `Rp ${formatRupiah(v)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                {incomeCats.slice(0, 8).map(c => (
                  <div key={c.category_id} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.category_color }} />
                    <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{c.category_name}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{totalCatIncome > 0 ? Math.round((c.total / totalCatIncome) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
