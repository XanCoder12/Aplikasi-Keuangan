import { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatCard } from '../components/Card';
import { getSummary, getTransactions } from '../api/client';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    Promise.all([
      getSummary(month, year),
      getTransactions({ limit: 10, month, year }),
    ]).then(([s, t]) => {
      setSummary(s);
      setRecent(t.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const expenseByCategory = summary?.by_category
    ?.filter((c) => c.total > 0)
    .filter((c) => recent.some((r) => r.category_id === c.category_id && r.type === 'expense'))
    .length > 0
    ? summary.by_category.filter((c) => c.total > 0)
    : summary?.by_category?.slice(0, 5) || [];

  const pieData = expenseByCategory
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.category_name,
      value: c.total,
      color: c.category_color,
    }));

  const formatCurrency = (val) =>
    new Intl.NumberFormat('id-ID').format(val || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Saldo"
          value={summary?.balance || 0}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Pemasukan"
          value={summary?.total_income || 0}
          icon={ArrowUpCircle}
          color="green"
        />
        <StatCard
          title="Pengeluaran"
          value={summary?.total_expense || 0}
          icon={ArrowDownCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pengeluaran per Kategori</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`Rp ${formatCurrency(value)}`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">
              Belum ada data pengeluaran bulan ini
            </p>
          )}
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaksi Terbaru</h2>
          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {t.description || t.category_name}
                      </p>
                      <p className="text-xs text-gray-400">{t.category_name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      t.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}Rp {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">
              Belum ada transaksi bulan ini
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
