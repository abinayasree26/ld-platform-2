import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import { CERTIFICATE_TYPES, HOW_TO_EARN } from './certificateTypes';
import { getPlan } from './subscriptionPlans';
import LevelAvatar from '../../components/LevelAvatar';
import { currentAvatarLevel } from './avatarSystem';

const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

const CertificationPage = () => {
  const navigate = useNavigate();
  const { certKey } = useParams();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const subscription = user?.subscription || 'advanced';
  const hasAccess = getPlan(subscription).limits.certification;
  const avatarLevel = currentAvatarLevel(user);

  const [filter, setFilter] = useState('all'); // 'all' | 'earned'
  const earnedCerts = CERTIFICATE_TYPES.filter((c) => c.earned);
  const visibleCerts = filter === 'earned' ? earnedCerts : CERTIFICATE_TYPES;
  const viewCertificate = (title) => toast.success(`Opening "${title}" certificate…`);

  const cert = certKey ? CERTIFICATE_TYPES.find((c) => c.key === certKey) : null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 40, maxWidth: 1200 }}>
          {!hasAccess ? (
            <>
            <button
              onClick={() => navigate(-1)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              Back
            </button>
            <div style={{ ...card, textAlign: 'center', padding: 40 }}>
              <span style={{ fontSize: 48 }}>🔒</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '12px 0 4px' }}>Certification is a paid feature</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Upgrade to the Advanced or Pro plan to unlock badges and certificates for your achievements.
              </p>
              <button
                onClick={() => navigate('/student/profile')}
                style={{ background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
              >
                View Plans
              </button>
            </div>
            </>
          ) : cert ? (
            <>
              <button onClick={() => navigate('/student/certification')} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                All Certificates
              </button>

              <div style={{ ...card, textAlign: 'center', padding: 48, marginBottom: 24, maxWidth: 520, border: cert.earned ? '1px solid #ddd6fe' : '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 72 }}>{cert.icon}</span>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', margin: '16px 0 6px' }}>{cert.title}</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px' }}>{cert.description}</p>
                {cert.earned ? (
                  <>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>
                      ✓ Earned on {cert.date}
                    </span>
                    <div>
                      <button
                        onClick={() => viewCertificate(cert.title)}
                        style={{ width: '100%', marginTop: 24, background: '#4f46e5', color: '#fff', fontWeight: 800, fontSize: 14, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}
                      >
                        View / Download Certificate
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>
                      🔒 Not yet earned
                    </span>
                    <div style={{ maxWidth: 340, margin: '20px auto 0' }}>
                      <div style={{ height: 9, background: '#f1f5f9', borderRadius: 50, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 50, background: '#4f46e5', width: `${cert.progress}%` }} />
                      </div>
                      <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0' }}>{cert.progress}% complete</p>
                    </div>
                  </>
                )}
              </div>

              <div style={{ ...card, maxWidth: 520 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 10px' }}>How to earn this badge</h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{HOW_TO_EARN[cert.key]}</p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(-1)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                Back
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <LevelAvatar level={avatarLevel} size={52} />
                  <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 }}>🎓 Certification</h2>
                    <p style={{ fontSize: 15, color: '#94a3b8', margin: '6px 0 0' }}>Badges and certificates you've earned along the way.</p>
                  </div>
                </div>
                <div style={{ ...card, padding: '14px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#4f46e5', margin: 0 }}>{earnedCerts.length}/{CERTIFICATE_TYPES.length}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Earned</p>
                </div>
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 12, cursor: 'pointer',
                    border: filter === 'all' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    background: filter === 'all' ? '#eef2ff' : '#fff', color: filter === 'all' ? '#4338ca' : '#64748b',
                  }}
                >
                  All ({CERTIFICATE_TYPES.length})
                </button>
                <button
                  onClick={() => setFilter('earned')}
                  style={{
                    fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 12, cursor: 'pointer',
                    border: filter === 'earned' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: filter === 'earned' ? '#dcfce7' : '#fff', color: filter === 'earned' ? '#16a34a' : '#64748b',
                  }}
                >
                  Earned ({earnedCerts.length})
                </button>
              </div>

              {visibleCerts.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: 56 }}>
                  <span style={{ fontSize: 48 }}>🎯</span>
                  <p style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '16px 0 6px' }}>No badges earned yet</p>
                  <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Complete practice, tests, and streaks to start earning certificates.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                  {visibleCerts.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => navigate(`/student/certification/${c.key}`)}
                      style={{
                        ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', cursor: 'pointer',
                        opacity: c.earned ? 1 : 0.75,
                        border: c.earned ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 40 }}>{c.icon}</span>
                        {c.earned ? (
                          <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20 }}>
                            Earned
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20 }}>
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>{c.title}</p>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>{c.description}</p>
                      </div>
                      {c.earned ? (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Earned on {c.date}</p>
                      ) : (
                        <div>
                          <div style={{ height: 7, background: '#f1f5f9', borderRadius: 50, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 50, background: '#94a3b8', width: `${c.progress}%` }} />
                          </div>
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0' }}>{c.progress}% complete</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CertificationPage;
