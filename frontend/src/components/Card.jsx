export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {new Intl.NumberFormat('id-ID').format(value)}
          </p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
