import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsAPI } from '../../services/api';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import LevelAvatar from '../../components/LevelAvatar';
import { currentAvatarLevel } from './avatarSystem';

const LEVEL_LABELS = ['', 'Starter', 'Basic', 'Intermediate', 'Advanced', 'Mastery'];

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const StudentDashboardWeb = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = user?.id;
    if (!studentId) { setLoading(false); return; }
    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };

    // Only ever redirect on an explicit "not screened yet" — never on a failed
    // request or an endpoint the backend doesn't implement in demo mode, both of
    // which would otherwise look identical to a real "unscreened" response.
    fetch('/api/ld/screening/status', { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s?.screened === false) navigate('/student/screening'); })
      .catch(() => {});

    Promise.all([
      fetch('/api/students/me', { headers }).then((r) => r.json()).catch(() => ({})),
      analyticsAPI.student(studentId).catch(() => null),
    ])
      .then(([studentData, analyticsData]) => {
        setProfile(studentData?.profile || null);
        setAnalytics(analyticsData);
      })
      .catch(() => toast.error('Could not load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  const trend = analytics?.trend || [];
  const recentSessions = analytics?.recentSessions || [];
  const categoryMastery = analytics?.categoryMastery || [];
  const totalPractices = analytics?.totalPractices ?? 23;
  const totalMinutes = analytics?.totalMinutes ?? 444;
  const totalTests = analytics?.totalTests ?? 4;
  const avgScore = analytics?.avgScore ?? 72;
  const weeklyPracticeDays = analytics?.weeklyPracticeDays || [true, true, true, false, false];
  const mastery = analytics?.mastery ?? avgScore;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading your dashboard…</p>
      </div>
    );
  }

  const firstName = profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Student';
  const avatarLevel = currentAvatarLevel(user);
  const level = profile?.current_level ?? 3;
  const streak = profile?.streak_count ?? 5;
  const practiceHours = Math.floor(totalMinutes / 60);
  const practiceMinutes = totalMinutes % 60;

  const defaultCategories = [
    { category: 'Letter Recognition', mastery: 85, trend: '↑' },
    { category: 'Phonics', mastery: 68, trend: '↑' },
    { category: 'Rhyme Detection', mastery: 72, trend: '→' },
    { category: 'Phoneme Blending', mastery: 55, trend: '↑' },
    { category: 'Reading', mastery: 42, trend: '↑' },
    { category: 'Number Sense', mastery: 78, trend: '→' },
    { category: 'Arithmetic', mastery: 65, trend: '↓' },
    { category: 'Sequencing', mastery: 60, trend: '↑' },
    { category: 'Writing', mastery: 48, trend: '↑' },
  ];

  const defaultSessions = [
    { date: '2026-06-10', duration: '14 min', score: 85 },
    { date: '2026-06-09', duration: '12 min', score: 78 },
    { date: '2026-06-08', duration: '15 min', score: 82 },
    { date: '2026-06-06', duration: '11 min', score: 72 },
    { date: '2026-06-05', duration: '13 min', score: 68 },
  ];

  const categories = categoryMastery.length > 0 ? categoryMastery : defaultCategories;
  const sessions = recentSessions.length > 0 ? recentSessions.slice(0, 5) : defaultSessions;

  const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader showBell />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, padding: '14px 24px', maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* ═══ ROW 1: Hero Banner + Stats ═══ */}
          <div className="sp-grid-2" style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: 16, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
              <LevelAvatar level={avatarLevel} size={64} />
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Hi {firstName}! 🌟</h2>
                <p style={{ color: '#e0e7ff', fontSize: 13, margin: '6px 0 0' }}>Every expert was once a beginner. Keep going! 🌟</p>
              </div>
            </div>
            <div className="sp-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: '📋', value: `Lv ${level}`, label: 'Current Level', color: '#4338ca' },
                { icon: '🔥', value: streak, label: 'Day Streak', color: '#ea580c' },
                { icon: '🕐', value: `${practiceHours}h`, label: 'Practice Time', color: '#0f766e' },
                { icon: '💎', value: `${mastery}%`, label: 'Mastery', color: '#16a34a' },
              ].map((s) => (
                <div key={s.label} style={{ ...card, textAlign: 'center', padding: 10 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <p style={{ fontSize: 16, fontWeight: 800, color: s.color, margin: '2px 0 1px' }}>{s.value}</p>
                  <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ ROW 2: Weekly Goal + Mastery Progress ═══ */}
          <div className="sp-grid-2" style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 12 }}>
            <div style={{ ...card, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, color: '#334155', margin: 0 }}>📅 Weekly Goal: Practice 5 days</h3>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5' }}>{weeklyPracticeDays.filter(Boolean).length}/5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
                {DAYS.map((day, i) => {
                  const practiced = weeklyPracticeDays[i] === true;
                  const missed = !practiced && i < 5 && i >= weeklyPracticeDays.filter(Boolean).length;
                  const future = i >= 5;
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#fff',
                        background: practiced ? '#22c55e' : missed ? '#f87171' : '#e2e8f0',
                      }}>
                        {practiced ? '✓' : missed ? '✗' : '—'}
                      </div>
                      <span style={{ fontSize: 8, color: '#64748b', marginTop: 2, display: 'block' }}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...card, padding: 8 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>📈 Mastery Progress (Last 30 Days)</h3>
              {trend.length > 1 ? (
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d?.slice(5)} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="avg_score" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>
                  Practice more to see your progress chart!
                </div>
              )}
            </div>
          </div>

          {/* ═══ ROW 3: Category Mastery + Recent Practice + Side Cards ═══ */}
          <div className="sp-grid-3 sp-flexrow" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: 20 }}>
            {/* Category Mastery */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 14 }}>
              <h3 style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 10px' }}>🎯 Category Mastery</h3>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#475569', width: 110, flexShrink: 0 }}>{cat.category?.replace(/_/g, ' ')}</span>
                    <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 50, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 50, background: '#f97316', width: `${cat.mastery || cat.score || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b', width: 38, textAlign: 'right' }}>{cat.trend || '↑'} {cat.mastery || cat.score || 0}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Practice */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 14 }}>
              <h3 style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 10px' }}>🕐 Recent Practice</h3>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 12, color: '#475569' }}>{s.date}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>{s.duration || `${s.duration_minutes || 0} min`}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: (s.score || 0) >= 80 ? '#16a34a' : (s.score || 0) >= 60 ? '#ea580c' : '#dc2626' }}>
                      {s.score || s.accuracy || 0}%
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => {}} style={{ flexShrink: 0, marginTop: 8, background: 'none', border: 'none', color: '#4f46e5', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                View All →
              </button>
            </div>

            {/* Side Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
              {/* Level Test CTA */}
              <div style={{ flexShrink: 0, background: '#16a34a', borderRadius: 18, padding: 22, color: '#fff', textAlign: 'center' }}>
                <span style={{ fontSize: 30 }}>🏆</span>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '8px 0 0' }}>Level Test</h4>
                <p style={{ fontSize: 12, color: '#dcfce7', margin: '6px 0 14px' }}>You're ready for the Level {Math.min(level + 1, 5)} test!</p>
                <button
                  onClick={() => navigate('/student/tests')}
                  style={{ width: '100%', background: '#fff', color: '#16a34a', fontWeight: 800, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14 }}
                >
                  Take Test →
                </button>
              </div>

              {/* Last Screening */}
              <div style={{ ...card, flexShrink: 0, padding: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>📋 Last Screening</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {profile?.ld_type && (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                        background: profile.ld_type === 'dyslexia' ? '#f3e8ff' : profile.ld_type === 'dyscalculia' ? '#dcfce7' : '#ffedd5',
                        color: profile.ld_type === 'dyslexia' ? '#7c3aed' : profile.ld_type === 'dyscalculia' ? '#16a34a' : '#ea580c',
                      }}>
                        {profile.ld_type.replace('_', ' ')}
                      </span>
                    )}
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>{profile?.last_screened_at?.slice(0, 10) || '2026-05-15'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{profile?.ld_risk_score ?? 45}</span>
                    <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>risk score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 4: Activity Summary ═══ */}
          <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Activity Summary */}
            <div style={{ ...card, padding: 8 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>Activity Summary</h3>
              <div className="sp-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { icon: '✅', value: totalPractices, label: 'Total Practices', sub: 'This Month' },
                  { icon: '🕐', value: `${practiceHours}h ${practiceMinutes}m`, label: 'Total Time', sub: 'This Month' },
                  { icon: '📝', value: totalTests, label: 'Tests Taken', sub: 'This Month' },
                  { icon: '📊', value: `${avgScore}%`, label: 'Average Score', sub: 'This Month' },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 8, padding: 5, textAlign: 'center' }}>
                    <span style={{ fontSize: 11 }}>{stat.icon}</span>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', margin: '1px 0 0' }}>{stat.value}</p>
                    <p style={{ fontSize: 8, color: '#64748b', margin: 0, fontWeight: 500 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default StudentDashboardWeb;
