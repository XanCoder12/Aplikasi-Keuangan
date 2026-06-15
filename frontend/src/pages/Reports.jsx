import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Card from '../components/Card';
import { getSummary } from '../api/client';

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSummary(month, year).then(setSummary).finally(() => setLoading(false));
  }, [month, year]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

  const barData = summary?.by_category
    ?.filter((c) => c.total > 0)
    .map((c) => ({
      name: c.category_name,
      Pemasukan: c.category_name.includes('Pemasukan') ? c.total : 0,
      Pengeluaran: c.category_name.includes('Pemasukan') ? 0 : c.total,
      fill: c.category_color,
    })) || [];

  const incomePie = summary?.by_category
    ?.filter((c) => c.total > 0)
    .filter((c) => c.category_name.includes('Pemasukan') || (!c.category_name.includes('Pemasukan') && barData.length > 0))
    || [];

  // Separate expense categories for pie
  const expensePie = summary?.by_category
    ?.filter((c) => c.total > 0 && !c.category_name.includes('Pemasukan'))
    .map((c) => ({
      name: c.category_name,
      value: c.total,
      color: c.category_color,
    })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id', { month: 'long' })}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            Rp {formatCurrency(summary?.total_income || 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            Rp {formatCurrency(summary?.total_expense || 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${(summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Rp {formatCurrency(summary?.balance || 0)}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Pie Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pengeluaran per Kategori</h2>
          {expensePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensePie}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expensePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`Rp ${formatCurrency(value)}`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-gray-400 text-center py-12">Tidak ada data pengeluaran</p>
          )}
        </Card>

        {/* Bar Chart - Income vs Expense by Category */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Perbandingan per Kategori</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`Rp ${formatCurrency(value)}`, '']} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Tidak ada data</p>
          )}
        </Card>
      </div>

      {/* Detail by Category */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Detail per Kategori</h2>
        {summary?.by_category?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Jumlah Transaksi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_category.map((c) => (
                  <tr key={c.category_id} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.category_color }} />
                        <span className="text-gray-700">{c.category_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.count}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      c.category_name.includes('Pemasukan') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Rp {formatCurrency(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Belum ada data bulan ini</p>
        )}
      </Card>
    </div>
  );
}
