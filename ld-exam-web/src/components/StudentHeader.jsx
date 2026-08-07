import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../services/authStore';
import { currentAvatarLevel } from '../data/avatarSystem';
import LevelAvatar from './LevelAvatar';
import useSidebarStore from '../services/sidebarStore';
import useThemeStore from '../services/themeStore';

const FONT_OPTIONS = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'big', label: 'Big' },
];

const StudentHeader = ({ showBell = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggle } = useSidebarStore();
  const { mode, toggleMode, fontSize, setFontSize } = useThemeStore();
  const fullName = user?.name || 'Demo Student';
  const firstName = fullName.split(' ')[0];
  const avatarLevel = currentAvatarLevel(user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fontRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (fontRef.current && !fontRef.current.contains(e.target)) setFontMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const menuItems = [
    { icon: '👤', label: 'User Profile', path: '/student/profile' },
    { icon: '💳', label: 'Payment', path: '/student/profile/payment' },
    { icon: '🆘', label: 'Help & Support', path: '/student/help' },
  ];

  const notifications = [
    { id: 1, title: 'Screening Completed', desc: 'Your screening profile has been calculated.', time: 'Today' },
    { id: 2, title: 'Practice Level 1 Unlocked', desc: 'Keep practicing to earn your next badge!', time: '1 day ago' },
  ];

  const iconBtnStyle = {
    background: 'none', border: '1px solid #e2e8f0', borderRadius: 10,
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 18, transition: 'background 0.15s',
  };

  return (
    <header className="sp-header" style={{ flexShrink: 0, background: mode === 'dark' ? '#1e293b' : '#fff', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
      <button
        onClick={toggle}
        title="Toggle sidebar"
        style={{ background: 'none', border: 'none', fontSize: 20, color: mode === 'dark' ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: 4, lineHeight: 1 }}
      >
        ☰
      </button>

      {/* Right side — Icons + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Notifications Bell */}
        {showBell && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              title="Notifications"
              style={{ ...iconBtnStyle, position: 'relative', background: notifMenuOpen ? '#e0e7ff' : (mode === 'dark' ? '#334155' : '#f8fafc'), color: mode === 'dark' ? '#fbbf24' : '#64748b' }}
            >
              🔔
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
            </button>

            {/* Notification Dropdown Menu */}
            {notifMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: mode === 'dark' ? '#1e293b' : '#fff', borderRadius: 14, padding: '12px 0',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                minWidth: 280, zIndex: 100,
              }}>
                <div style={{ padding: '0 16px 8px', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: mode === 'dark' ? '#f1f5f9' : '#1e293b' }}>Notifications</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', padding: '2px 6px', borderRadius: 6 }}>2 New</span>
                </div>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#f8fafc'}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: mode === 'dark' ? '#f1f5f9' : '#1e293b', margin: 0 }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{n.desc}</p>
                    <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleMode}
          title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{ ...iconBtnStyle, background: mode === 'dark' ? '#334155' : '#f8fafc', color: mode === 'dark' ? '#fbbf24' : '#64748b' }}
          onMouseOver={(e) => e.currentTarget.style.background = mode === 'dark' ? '#475569' : '#f1f5f9'}
          onMouseOut={(e) => e.currentTarget.style.background = mode === 'dark' ? '#334155' : '#f8fafc'}
        >
          {mode === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Font Size Toggle */}
        <div ref={fontRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setFontMenuOpen(!fontMenuOpen)}
            title="Font Size"
            style={{ ...iconBtnStyle, background: fontMenuOpen ? '#e0e7ff' : (mode === 'dark' ? '#334155' : '#f8fafc'), color: mode === 'dark' ? '#e2e8f0' : '#64748b', fontSize: 14, fontWeight: 800 }}
            onMouseOver={(e) => e.currentTarget.style.background = mode === 'dark' ? '#475569' : '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = fontMenuOpen ? '#e0e7ff' : (mode === 'dark' ? '#334155' : '#f8fafc')}
          >
            Aa
          </button>

          {/* Font size dropdown */}
          {fontMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: mode === 'dark' ? '#1e293b' : '#fff', borderRadius: 12, padding: '6px 0',
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)', border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              minWidth: 130, zIndex: 100,
            }}>
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setFontSize(opt.key); setFontMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: fontSize === opt.key ? 700 : 500,
                    color: fontSize === opt.key ? '#4f46e5' : (mode === 'dark' ? '#e2e8f0' : '#475569'),
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = mode === 'dark' ? '#334155' : '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  {opt.label}
                  {fontSize === opt.key && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile area */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 12, transition: 'background 0.2s', background: menuOpen ? (mode === 'dark' ? '#334155' : '#f1f5f9') : 'transparent' }}
            onMouseOver={(e) => { if (!menuOpen) e.currentTarget.style.background = mode === 'dark' ? '#334155' : '#f8fafc'; }}
            onMouseOut={(e) => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <div onClick={() => navigate('/student/profile')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <LevelAvatar level={avatarLevel} size={34} showBadge={false} />
              <div className="sp-hide-xs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, color: mode === 'dark' ? '#f1f5f9' : '#334155', fontSize: 13 }}>{firstName}</span>
                <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>Student</span>
              </div>
            </div>
            <span
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', padding: '4px 6px', borderRadius: 6 }}
            >
              {menuOpen ? '▲' : '▼'}
            </span>
            {showBell && (
              <span style={{ fontSize: 18, position: 'relative', marginLeft: 4 }}>
                🔔<span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
              </span>
            )}
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: mode === 'dark' ? '#1e293b' : '#fff', borderRadius: 14, padding: '8px 0',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              minWidth: 220, zIndex: 100,
            }}>
              {/* User info */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#f1f5f9'}` }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: mode === 'dark' ? '#f1f5f9' : '#1e293b', margin: 0 }}>{fullName}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{user?.email || 'student@demo.ldschools.app'}</p>
              </div>

              {/* Menu items */}
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: mode === 'dark' ? '#e2e8f0' : '#475569',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = mode === 'dark' ? '#334155' : '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              {/* Logout */}
              <div style={{ borderTop: `1px solid ${mode === 'dark' ? '#334155' : '#f1f5f9'}`, padding: '4px 0 0' }}>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#dc2626',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = mode === 'dark' ? '#3b1c1c' : '#fef2f2'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 16 }}>↩</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
