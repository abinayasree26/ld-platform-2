import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../services/authStore';
import useSidebarStore from '../services/sidebarStore';
import LevelAvatar from './LevelAvatar';
import { currentAvatarLevel } from '../pages/student/avatarSystem';

const NAV_ITEMS = [
  { icon: '📊', label: 'My Dashboard', path: '/student' },
  { icon: '🧠', label: 'Screening', path: '/student/screening' },
  { icon: '✨', label: 'Practice', path: '/student/practice' },
  { icon: '📝', label: 'Tests', path: '/student/tests' },
  { icon: '⭐', label: 'Recommendations', path: '/student/recommendations' },
  { icon: '📈', label: 'Progress Analytics', path: '/student/analytics' },
  { icon: '🎓', label: 'Certification', path: '/student/certification' },
  { icon: '👤', label: 'User Profile', path: '/student/profile' },
  { icon: '💳', label: 'Payment', path: '/student/profile/payment' },
  { icon: '🆘', label: 'Help & Support', path: '/student/help' },
];

const StudentSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { collapsed, close } = useSidebarStore();

  const fullName = user?.name || 'Demo Student';
  const avatarLevel = currentAvatarLevel(user);

  const goTo = (path) => {
    navigate(path);
    // On phone-sized screens the sidebar overlays content, so close it after navigating.
    if (typeof window !== 'undefined' && window.innerWidth <= 768) close();
  };

  return (
    <>
      {!collapsed && <div className="sp-sidebar-backdrop" onClick={close} />}
      <aside style={{
        width: 220, background: '#1e293b', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30,
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)', transition: 'transform 0.2s ease',
      }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ color: '#fff', fontSize: 14, fontWeight: 800, margin: 0 }}>LD Schools ERP</h1>
        <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>School Management Platform</p>
      </div>
      <div style={{ padding: '20px 16px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>LD Platform</p>
      </div>
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path === '/student' && pathname.endsWith('/student'));
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, marginBottom: 4, textAlign: 'left',
                background: active ? '#4f46e5' : 'transparent',
                color: active ? '#fff' : '#cbd5e1',
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 16, borderTop: '1px solid #334155' }}>
        <button
          onClick={() => goTo('/student/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <LevelAvatar level={avatarLevel} size={36} showBadge={false} />
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{fullName}</p>
            <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Student</p>
          </div>
        </button>
        <button onClick={logout} style={{ marginTop: 12, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: 0 }}>↩ Logout</button>
      </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
