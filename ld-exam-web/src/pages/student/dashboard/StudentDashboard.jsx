import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsAPI, ldAPI, studentAPI } from '../../../services/api';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import { getDashboardProgress } from '../../../services/progressStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import LevelAvatar from '../../../components/LevelAvatar';
import { currentAvatarLevel } from '../../../data/avatarSystem';
import AboutIcon from '../../../components/AboutIcon';

import { supabase } from '../../../services/supabaseClient';

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

    // Only ever redirect on an explicit "not screened yet" — never on a failed
    // request or an endpoint the backend doesn't implement in demo mode, both of
    // which would otherwise look identical to a real "unscreened" response.
    // Guard against the bounce loop: if the student has completed a screening
    // locally OR the server says screened, never auto-redirect. Only send a
    // brand-new student (no local record AND server confirms not screened) to
    // the assessment, and only once per session.
    const localScreened = !!getDashboardProgress()?.lastScreening;
    const alreadyRedirected = sessionStorage.getItem('screening_redirected') === '1';
    if (!localScreened && !alreadyRedirected) {
      ldAPI.screeningStatus()
        .then((s) => {
          if (s?.screened === false) {
            sessionStorage.setItem('screening_redirected', '1');
            navigate('/student/screening');
          }
        })
        .catch(() => {});
    }

    Promise.all([
      // Use the current-student endpoints (real DB). By-ID paths 404 in real mode.
      studentAPI.getMe().catch(() => ({})),
      analyticsAPI.me().catch(() => null),
    ])
      .then(([studentData, analyticsData]) => {
        setProfile(studentData?.profile || null);
        // Backend (real DB) is the source of truth. Fall back to local
        // progress only for fields the backend has no data for, so the
        // dashboard is consistent across devices/browsers/origins.
        const local = getDashboardProgress();
        const b = analyticsData || {};
        const pick = (dbVal, localVal) =>
          (dbVal !== undefined && dbVal !== null && dbVal !== 0) ? dbVal : localVal;
        const merged = {
          ...b,
          level:                pick(b.level, local.level),
          streak:               pick(b.streak, local.streak),
          totalPractices:       pick(b.totalPractices, local.totalPractices),
          totalPracticeMinutes: pick(b.totalPracticeMinutes, local.totalPracticeMinutes),
          totalTests:           pick(b.totalTests, local.totalTests),
          avgScore:             pick(b.avgScore, local.avgScore),
          mastery:              pick(b.mastery, local.mastery),
          categoryMastery:      (b.categoryMastery && b.categoryMastery.length) ? b.categoryMastery : local.categoryMastery,
          recentSessions:       (b.recentSessions && b.recentSessions.length) ? b.recentSessions : local.recentSessions,
          weekDays:             (b.weekDays && b.weekDays.some(d => d)) ? b.weekDays : local.weekDays,
          lastScreening:        b.lastScreening || local.lastScreening,
        };

        const activeScreening = merged.lastScreening;
        if (activeScreening?.ldType && user?.email) {
          const formattedLdType = activeScreening.ldType.charAt(0).toUpperCase() + activeScreening.ldType.slice(1);
          supabase.from('students').upsert([{
            id: user.id || `st-${Date.now()}`,
            name: user.name || user.email.split('@')[0],
            email: user.email.toLowerCase(),
            ld_type: formattedLdType,
            severity: activeScreening.severity || 'Moderate',
            screened: true,
            level: 'Level 1',
            status: 'active',
            last_active: 'Today',
            subscription: 'Free Tier',
          }], { onConflict: 'email' }).then(() => {}).catch(() => {});
        }

        setAnalytics(merged);
      })
      .catch(() => toast.error('Could not load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  const trend = analytics?.progressHistory || analytics?.trend || [];
  const recentSessions = analytics?.recentSessions || [];
  const categoryMastery = analytics?.categoryMastery || [];
  const totalPractices = analytics?.totalPractices ?? 0;
  const totalMinutes = analytics?.totalPracticeMinutes ?? 0;
  const totalTests = analytics?.totalTests ?? 0;
  const avgScore = analytics?.avgScore ?? 72;
  const weeklyPracticeDays = analytics?.weekDays || [];
  const mastery = analytics?.mastery ?? avgScore;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading your dashboard…</p>
      </div>
    );
  }

  const studentUser = (user && user.role === 'student')
    ? user
    : (JSON.parse(localStorage.getItem('student_user_data') || 'null') || user);

  const rawName = profile?.name || studentUser?.name;
  const fullName = (rawName && rawName !== 'Administrator' && rawName !== 'Admin User' && rawName !== 'Admin')
    ? rawName
    : (studentUser?.email ? studentUser.email.split('@')[0] : 'saranya');

  const firstName = fullName.split(' ')[0];
  const avatarLevel = currentAvatarLevel(studentUser);
  const level = profile?.current_level ?? 3;
  const streak = analytics?.streak || profile?.streak_count || 0;
  const practiceHours = Math.floor(totalMinutes / 60);
  const practiceMinutes = totalMinutes % 60;

  const defaultCategories = [
  ];

  const categories = categoryMastery.length > 0 ? categoryMastery : defaultCategories;
  const sessions = recentSessions.length > 0 ? recentSessions.slice(0, 5) : [];

  const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

  return (
    <div className="sp-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader showBell />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, padding: '14px 24px', maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

          {/* About icon */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🏠 Dashboard</h2>
            <AboutIcon
              title="About Dashboard"
              description="Your learning command center! See your progress, streaks, and upcoming activities at a glance."
              items={['View your level, streak, and mastery stats', 'Check recent test scores and practice history', 'See your weekly activity chart', 'Quick access to all learning areas']}
            />
          </div>

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
                  const val = weeklyPracticeDays[i]; // true = practiced, false = missed, null/undefined = future
                  const practiced = val === true;
                  const missed = val === false;
                  const future = val === null || val === undefined;
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
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>📈 My Score Progress</h3>
              {trend.length > 1 ? (
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={trend.map((t, i) => ({ ...t, label: t.label || (t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : `#${i + 1}`) }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, padding: '6px 10px' }}
                      formatter={(value) => [`${value}%`, '⭐ Score']}
                      labelFormatter={(label) => `📅 ${label}`}
                    />
                    <Area type="monotone" dataKey="mastery" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 11 }}>
                  Keep practicing to see your score go up! 🚀
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
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                        {s.name || s.type || 'Practice'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>
                        {s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} · {s.duration || s.duration_minutes || 0} min
                      </span>
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
              <div style={{ flexShrink: 0, background: '#16a34a', borderRadius: 14, padding: 14, color: '#fff', textAlign: 'center' }}>
                <span style={{ fontSize: 22 }}>🏆</span>
                <h4 style={{ fontSize: 13, fontWeight: 800, margin: '4px 0 0' }}>Level Test</h4>
                <p style={{ fontSize: 11, color: '#dcfce7', margin: '4px 0 10px' }}>Ready for Level {Math.min(level + 1, 5)}!</p>
                <button
                  onClick={() => navigate('/student/tests')}
                  style={{ width: '100%', background: '#fff', color: '#16a34a', fontWeight: 800, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12 }}
                >
                  Take Test →
                </button>
              </div>

              {/* Last Screening */}
              <div style={{ ...card, flexShrink: 0, padding: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>📋 Last Screening</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {(analytics?.lastScreening?.ldType || profile?.ld_type) && (
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                        background: (analytics?.lastScreening?.ldType || profile?.ld_type) === 'dyslexia' ? '#f3e8ff' : (analytics?.lastScreening?.ldType || profile?.ld_type) === 'dyscalculia' ? '#dcfce7' : '#ffedd5',
                        color: (analytics?.lastScreening?.ldType || profile?.ld_type) === 'dyslexia' ? '#7c3aed' : (analytics?.lastScreening?.ldType || profile?.ld_type) === 'dyscalculia' ? '#16a34a' : '#ea580c',
                      }}>
                        {(analytics?.lastScreening?.ldType || profile?.ld_type || 'none').replace('_', ' ')}
                      </span>
                    )}
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>
                      {analytics?.lastScreening?.date || profile?.last_screened_at?.slice(0, 10) || '—'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{analytics?.lastScreening?.riskScore ?? profile?.ld_risk_score ?? 45}</span>
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
