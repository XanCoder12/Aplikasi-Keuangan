import {
  Code2, Database, Globe, Rocket, BookOpen, ArrowLeftRight, Wallet, Target,
  BarChart3, Sparkles, PieChart, Filter, Shield, Smartphone,
  GraduationCap, Building2, Calendar, Layers, Zap, Cloud,
} from 'lucide-react';

const stack = [
  { name: 'Gin (Golang)', img: '/Gin(golang).png', desc: 'Backend API server — cepat, ringan, dan efisien untuk handle ribuan request.' },
  { name: 'React Native', img: '/ReactNative.png', desc: 'Frontend UI library — komponen modular dengan hot reload & responsive design.' },
  { name: 'PostgreSQL', img: '/PostagresSQL.png', desc: 'Database relasional — menyimpan data transaksi, kategori, anggaran, dll.' },
];

const deployments = [
  {
    name: 'Supabase',
    role: 'Database',
    desc: 'PostgreSQL terkelola dengan dashboard, backup otomatis, dan row-level security.',
    color: 'from-emerald-500 to-green-600',
    icon: Database,
  },
  {
    name: 'Railway',
    role: 'Backend',
    desc: 'Platform deploy Go API dengan auto-scaling, SSL gratis, dan monitoring built-in.',
    color: 'from-purple-500 to-violet-600',
    icon: Cloud,
  },
  {
    name: 'Vercel',
    role: 'Frontend',
    desc: 'Hosting React dengan CDN global, auto-deploy dari Git, dan preview deployment.',
    color: 'from-gray-700 to-gray-900 dark:from-gray-500 dark:to-gray-700',
    icon: Globe,
  },
];

const features = [
  { icon: ArrowLeftRight, name: 'Transaksi', desc: 'Catat pemasukan & pengeluaran harian dengan kategori, filter bulan/tahun, dan pagination.' },
  { icon: PieChart, name: 'Dashboard', desc: 'Ringkasan saldo, pie chart pengeluaran per kategori, dan daftar transaksi terbaru.' },
  { icon: Wallet, name: 'Anggaran', desc: 'Atur batas pengeluaran per kategori tiap bulan dengan progress ring visual.' },
  { icon: Target, name: 'Target Tabungan', desc: 'Buat goal menabung dengan foto target, deadline, dan chart cash flow tahunan.' },
  { icon: Sparkles, name: 'Insight', desc: 'Analisis tren keuangan: mixed chart, radar, rasio pengeluaran, dan sparkline mingguan.' },
  { icon: BarChart3, name: 'Laporan', desc: 'Laporan bulanan: cash flow chart, pie pengeluaran, dan detail per kategori.' },
  { icon: Filter, name: 'Filter & Search', desc: 'Filter transaksi berdasarkan bulan, tahun, tipe, dan kategori.' },
  { icon: Shield, name: 'Autentikasi', desc: 'Register, login dengan JWT token. Proteksi route dan middleware di backend.' },
  { icon: Smartphone, name: 'Responsive', desc: 'Desain mobile-first dengan bottom navigation, bottom sheet modal, dan dark mode.' },
];

export default function Docs() {
  return (
    <div className="space-y-8 sm:space-y-10 max-w-4xl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-10 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <BookOpen size={20} />
            </div>
            <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">Dokumentasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Catatan Keuangan</h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-xl">
            Aplikasi pencatat keuangan pribadi berbasis web — dibangun sebagai project magang oleh siswa SMK.
          </p>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <GraduationCap size={18} className="text-blue-200" />
              <div>
                <p className="text-sm font-semibold">Muhammad Yusuf Akrom</p>
                <p className="text-[11px] text-blue-200">Developer & DevOps</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <Building2 size={18} className="text-blue-200" />
              <div>
                <p className="text-sm font-semibold">SMK Alfalah Bandung</p>
                <p className="text-[11px] text-blue-200">Kelas XI-K2</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-blue-200">
            <Calendar size={14} />
            <span>Magang di Direktorat Metrologi</span>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <Layers size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Tech Stack</h2>
        </div>

        {/* Stack visual row */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-8 shadow-sm mb-4 transition-colors">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            {stack.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center p-3 shadow-sm transition-colors">
                    <img src={s.img} alt={s.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">{s.name}</span>
                </div>
                {i < stack.length - 1 && (
                  <img src="/tandaPlus.png" alt="+" className="w-5 h-5 sm:w-6 sm:h-6 opacity-40 dark:opacity-60 -mt-5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stack detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stack.map((s) => (
            <div key={s.name} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <img src={s.img} alt={s.name} className="w-8 h-8 object-contain" />
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{s.name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
            <Rocket size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Deployment</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {deployments.map((d) => (
            <div key={d.name} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
              <div className={`bg-gradient-to-r ${d.color} px-4 py-3 flex items-center gap-3`}>
                <d.icon size={20} className="text-white" />
                <div>
                  <p className="font-bold text-white text-sm">{d.name}</p>
                  <p className="text-[11px] text-white/70">{d.role}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Alur Deploy</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
              Code di-push ke GitHub → Vercel auto-build frontend, Railway auto-deploy backend. Database PostgreSQL di-host terpisah di Supabase dengan koneksi via environment variables.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <Code2 size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Fitur Aplikasi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.name} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-start gap-3 transition-colors group hover:shadow-md">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                <f.icon size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{f.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Dibangun dengan ❤️ oleh <span className="font-semibold text-gray-600 dark:text-gray-300">Muhammad Yusuf Akrom</span> — SMK Alfalah Bandung © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
