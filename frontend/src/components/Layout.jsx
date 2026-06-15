import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, Tags, BarChart3, Menu, X, LogOut, UserCircle, Target,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { to: '/categories', label: 'Kategori', icon: Tags },
  { to: '/savings', label: 'Tabungan', icon: Target },
  { to: '/reports', label: 'Laporan', icon: BarChart3 },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const SidebarContent = ({ onItemClick }) => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Catatan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Personal Finance</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {/* User section at bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle size={20} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
            title="Keluar"
          >
            <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <SidebarContent onItemClick={() => {}} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Catatan Keuangan</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div
            className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onItemClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-0 pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
