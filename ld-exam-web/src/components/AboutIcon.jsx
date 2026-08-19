import React, { useState, useRef, useEffect } from 'react';

/**
 * AboutIcon — A reusable info icon that shows a popup explaining the page.
 * 
 * Usage:
 *   <AboutIcon title="About Practice" description="Practice helps you..." />
 */
const AboutIcon = ({ title, description, items = [] }) => {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: '2px solid #94a3b8',
          background: open ? '#4f46e5' : '#fff', color: open ? '#fff' : '#64748b',
          fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        }}
        title={title}
      >
        i
      </button>

      {open && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute', top: 36, left: 0, zIndex: 1000,
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
            width: 300, animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0 }}>ℹ️ {title}</h4>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: 16, color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>{description}</p>
          {items.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
};

export default AboutIcon;
