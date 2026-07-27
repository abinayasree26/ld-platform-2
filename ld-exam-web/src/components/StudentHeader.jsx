import React from 'react';
import useAuthStore from '../services/authStore';
import useSidebarStore from '../services/sidebarStore';

const StudentHeader = ({ showBell = false }) => {
  const { user } = useAuthStore();
  const { toggle } = useSidebarStore();
  const fullName = user?.name || 'Demo Student';

  return (
    <header style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
      <button
        onClick={toggle}
        title="Toggle sidebar"
        style={{ background: 'none', border: 'none', fontSize: 20, color: '#64748b', cursor: 'pointer', padding: 4, lineHeight: 1 }}
      >
        ☰
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 600, color: '#334155' }}>{fullName}</span>
        <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>student</span>
        {showBell && (
          <span style={{ fontSize: 18, position: 'relative' }}>
            🔔<span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
          </span>
        )}
      </div>
    </header>
  );
};

export default StudentHeader;
