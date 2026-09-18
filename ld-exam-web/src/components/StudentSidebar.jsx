import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSidebarStore from '../services/sidebarStore';

const NAV_ITEMS = [
  { icon: '📊', label: 'My Dashboard', path: '/student' },
  { icon: '🧠', label: 'Screening', path: '/student/screening' },
  { icon: '📝', label: 'Tests', path: '/student/tests' },
  { icon: '⭐', label: 'Recommendations', path: '/student/recommendations' },
  { icon: '📈', label: 'Progress Analytics', path: '/student/analytics' },
  { icon: '🎓', label: 'Certification', path: '/student/certification' },
];

const StudentSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { collapsed, close } = useSidebarStore();

  const goTo = (path) => {
    navigate(path);
    // On phone-sized screens the sidebar overlays content, so close it after navigating.
    if (typeof window !== 'undefined' && window.innerWidth <= 768) close();
  };

  return (
    <>
      {!collapsed && <div className="sp-sidebar-backdrop" onClick={close} />}
      <aside style={{
        width: 220, background: '#0F1B33', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30,
        transform: collapsed ? 'translateX(-100%)' : 'translateX(0)', transition: 'transform 0.2s ease',
      }}>
      {/* Brand — LD Learn */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5A4 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
        }}>🌱</div>
        <div style={{ lineHeight: 1.15 }}>
          <h1 style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>LD Learn</h1>
          <p style={{ color: '#7C8DB0', fontSize: 10.5, margin: '2px 0 0', fontWeight: 600, letterSpacing: 0.3 }}>Learn · Grow · Shine</p>
        </div>
      </div>

      <div style={{ padding: '18px 18px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#5A6B8C', textTransform: 'uppercase', letterSpacing: 1.2, margin: 0 }}>Student Portal</p>
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path === '/student' && pathname.endsWith('/student'));
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              aria-current={active ? 'page' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 600, marginBottom: 5, textAlign: 'left',
                minHeight: 44,
                background: active ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                color: active ? '#fff' : '#AEBBD4',
                boxShadow: active ? '0 6px 16px rgba(37,99,235,0.30)' : 'none',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#AEBBD4'; } }}
            >
              <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>{item.icon}</span>{item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer tag */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: 10, color: '#5A6B8C', margin: 0, fontWeight: 600 }}>Learning support platform</p>
      </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
