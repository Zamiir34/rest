import { Outlet } from 'react-router-dom';
import { FiMoon, FiShield, FiSun, FiZap } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import heroAsset from '../assets/hero.png';

const AuthLayout = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="system-shell min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-sidebar text-white p-10 xl:p-12 flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-lg bg-white text-slate-950 flex items-center justify-center text-base font-black shadow-xl shadow-cyan-950/40">
              SB
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Savory Bites</h1>
              <p className="text-xs text-primary-300 uppercase tracking-widest font-semibold">Restaurant Command OS</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="system-kicker mb-4">Operations platform</p>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Control every order, table, and kitchen workflow from one console.
            </h2>
            <p className="text-slate-400 mt-6 text-base xl:text-lg max-w-lg leading-relaxed">
              Built for QR ordering, live kitchen status, cashier checkout, inventory signals, and role-based management.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-[1fr_180px] gap-6 items-end">
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: '10+', label: 'Managed tables' },
              { val: 'Live', label: 'Kitchen queue' },
              { val: 'RBAC', label: 'Staff access' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/[0.05] border border-white/10 p-4">
                <p className="text-2xl font-bold text-white">{item.val}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <img src={heroAsset} alt="" className="w-full opacity-90" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-10 relative">
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm hover:shadow-md transition-all"
          aria-label="Toggle theme"
        >
          {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="system-panel p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <FiShield />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Secure</p>
                <p className="text-[11px] text-slate-500">JWT access</p>
              </div>
            </div>
            <div className="system-panel p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-700 dark:text-primary-300">
                <FiZap />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Realtime</p>
                <p className="text-[11px] text-slate-500">Socket ready</p>
              </div>
            </div>
          </div>

          <div className="system-panel p-6 sm:p-7">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
