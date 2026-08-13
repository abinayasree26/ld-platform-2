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
];

const FONT_OPTIONS = [
  { key: 'S', label: 'S — Small', zoom: 0.85 },
  { key: 'M', label: 'M — Medium', zoom: 1 },
  { key: 'L', label: 'L — Large', zoom: 1.15 },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, initTheme } = useThemeStore();
  const isAdmin = location.pathname.startsWith('/admin') || ['admin', 'super_admin', 'school_admin'].includes(user?.role);
  const nav = isAdmin ? NAV_ADMIN : NAV_TEACHER;
  const [fontIdx, setFontIdx] = useState(1);
  const [fontDropdown, setFontDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [settingsSubmenu, setSettingsSubmenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [savedSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_platform_settings');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => { initTheme(); }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => {
      setFontDropdown(false);
      setProfileDropdown(false);
      setSettingsSubmenu(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const appName = savedSettings?.platform?.name || 'LD Support';
  const adminEmail = savedSettings?.admin?.email || user?.email || 'admin@ldschools.in';

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
                {appName[0]?.toUpperCase() || 'L'}
              </div>
              <h1 className="text-white text-xl font-extrabold tracking-tight truncate">{appName}</h1>
            </div>
            {/* Close button on mobile */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white text-xl">✕</button>
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest px-1 mt-1">
            {isAdmin ? 'Admin Portal' : 'Student Portal'}
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
                onClick={(e) => { e.stopPropagation(); setFontDropdown(!fontDropdown); setProfileDropdown(false); }}
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

            {/* User Profile & Settings Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setProfileDropdown(!profileDropdown); setFontDropdown(false); }}
                className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow">
                  {(user?.role?.includes('admin') ? (user?.name || 'A') : 'A')[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Admin</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    Administrator <span className="text-[10px] text-slate-400">▾</span>
                  </span>
                </div>
              </button>

              {profileDropdown && (
                <div
                  className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Profile Card Header */}
                  <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-800/80">
                    <p className="text-xs font-bold text-white tracking-tight">
                      {user?.role?.includes('admin') ? (user?.name || 'Administrator') : 'Administrator'}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      <span>🛡️</span> Full System Access
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => { setShowProfileModal(true); setProfileDropdown(false); setSettingsSubmenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <span>👤</span> Admin Profile Details
                    </button>

                    {/* Collapsible Platform Settings */}
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettingsSubmenu(!settingsSubmenu);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700/80 hover:text-white flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <span>⚙️</span> Platform Settings
                        </span>
                        <span className={`text-[10px] text-slate-400 transition-transform ${settingsSubmenu ? 'rotate-90 text-purple-400' : ''}`}>▶</span>
                      </button>

                      {settingsSubmenu && (
                        <div className="bg-slate-900/80 py-1.5 px-3 space-y-1 my-1 border-y border-slate-700/40">
                          <Link to="/admin/settings#account" onClick={() => { setProfileDropdown(false); setSettingsSubmenu(false); }} className="block text-xs font-semibold text-slate-300 hover:text-purple-400 py-1 px-2 rounded hover:bg-slate-800 transition">🔐 Account & Security</Link>
                          <Link to="/admin/settings#platform" onClick={() => { setProfileDropdown(false); setSettingsSubmenu(false); }} className="block text-xs font-semibold text-slate-300 hover:text-purple-400 py-1 px-2 rounded hover:bg-slate-800 transition">🎨 Platform Setup</Link>
                          <Link to="/admin/settings#learning" onClick={() => { setProfileDropdown(false); setSettingsSubmenu(false); }} className="block text-xs font-semibold text-slate-300 hover:text-purple-400 py-1 px-2 rounded hover:bg-slate-800 transition">🧠 Learning & Subscriptions</Link>
                          <Link to="/admin/settings#integrations" onClick={() => { setProfileDropdown(false); setSettingsSubmenu(false); }} className="block text-xs font-semibold text-slate-300 hover:text-purple-400 py-1 px-2 rounded hover:bg-slate-800 transition">⚡ Integrations & Privacy</Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-1 mt-1 border-t border-slate-700/60">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to sign out?')) {
                          logout();
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)]" style={{ zoom: FONT_OPTIONS[fontIdx].zoom }}>
          {children}
        </main>
      </div>

      {/* Admin Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold">👤 Admin Profile Details</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-bold uppercase">Name</span>
                <span className="font-bold text-white">{user?.name || 'Demo admin'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-bold uppercase">Username</span>
                <span className="font-mono text-purple-400">@{savedSettings?.admin?.username || 'admin'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-bold uppercase">Role</span>
                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Admin</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-bold uppercase">Access Scope</span>
                <span className="text-emerald-400 font-bold">Full System Access</span>
              </div>
            </div>
            <div className="pt-3 flex justify-between items-center border-t border-slate-800">
              <Link
                to="/admin/settings"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <span>✏️</span> Edit Profile & Credentials
              </Link>
              <button onClick={() => setShowProfileModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
