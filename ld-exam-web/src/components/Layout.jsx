import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../services/authStore';
import useThemeStore from '../services/themeStore';

const NAV_TEACHER = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Messages', path: '/messages', icon: '💬' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

const NAV_ADMIN = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Students', path: '/admin/students', icon: '👥' },
  { label: 'Screening', path: '/admin/screening', icon: '🧠' },
  { label: 'Content CMS', path: '/admin/cms', icon: '📝' },
  { label: 'Analytics', path: '/admin/analytics', icon: '📈' },
  { label: 'Billing', path: '/admin/billing', icon: '💳' },
  { label: 'Support', path: '/admin/chats', icon: '💬' },
  { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
];

const FONT_OPTIONS = [
  { key: 'S', label: 'S — Small', zoom: 0.85 },
  { key: 'M', label: 'M — Medium', zoom: 1 },
  { key: 'L', label: 'L — Large', zoom: 1.15 },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, initTheme } = useThemeStore();
  const location = useLocation();
  const nav = user?.role === 'admin' ? NAV_ADMIN : NAV_TEACHER;
  const [fontIdx, setFontIdx] = useState(1);
  const [fontDropdown, setFontDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { initTheme(); }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close font dropdown on outside click
  useEffect(() => {
    if (!fontDropdown) return;
    const close = () => setFontDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [fontDropdown]);

  return (
    <div className="h-screen flex bg-[var(--bg-main)] transition-colors duration-300 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-slate-900 dark:bg-[#000000] flex flex-col flex-shrink-0 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 py-6 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl accent-gradient flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/30">
                L
              </div>
              <h1 className="text-white text-xl font-extrabold tracking-tight">LD Support</h1>
            </div>
            {/* Close button on mobile */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white text-xl">✕</button>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest px-1 mt-1">
            {user?.role === 'admin' ? 'Admin Portal' : 'Teacher Portal'}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {nav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'accent-gradient text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 border-b border-[var(--border-main)] bg-slate-900 flex-shrink-0">
          {/* Left: Hamburger (mobile only) */}
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white text-xl p-1">
            ☰
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Font Size Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setFontDropdown(!fontDropdown); }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                Aa <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded ml-1 text-slate-300">{FONT_OPTIONS[fontIdx].key}</span>
              </button>
              {fontDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                  {FONT_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.key}
                      onClick={() => { setFontIdx(i); setFontDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                        fontIdx === i ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} title={isDark ? 'Switch to Light' : 'Switch to Dark'}
              className="text-lg hover:scale-110 transition-transform">
              {isDark ? '🌙' : '☀️'}
            </button>

            {/* User Badge — hide text on small screens */}
            <div className="flex items-center gap-2 bg-slate-800 px-2 sm:px-4 py-1.5 rounded-full">
              <span className="text-white text-sm font-bold hidden sm:inline">Demo admin</span>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                {user?.role || 'ADMIN'}
              </span>
            </div>

            {/* Sign Out */}
            <button onClick={logout} className="text-blue-400 hover:text-red-400 text-xs sm:text-sm font-bold transition-colors">
              Sign out
            </button>
          </div>
        </header>

        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)]" style={{ zoom: FONT_OPTIONS[fontIdx].zoom }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
