import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import { CERTIFICATE_TYPES } from './certificateTypes';

const card = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(15, 60, 107, 0.08)' };

// Demo trend data — a real backend would compute this from stored session results.
const DOMAIN_TRENDS = [
  { week: 'Wk1', reading: 38, math: 30, attention: 62 },
  { week: 'Wk2', reading: 34, math: 42, attention: 60 },
  { week: 'Wk3', reading: 30, math: 58, attention: 56 },
  { week: 'Wk4', reading: 45, math: 68, attention: 58 },
];
const DOMAINS = [
  { key: 'reading', label: 'Dyslexia (reading)', color: '#B23A1A' },
  { key: 'math', label: 'Dyscalculia (math)', color: '#0F7A5C' },
  { key: 'attention', label: 'Attention', color: '#8A6D1B' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_ACTIVE = [true, true, false, true, true, false, true];

const BADGE_COLORS = [
  { bg: '#FCE9C5', fg: '#C88A1E' },
  { bg: '#D8F2E7', fg: '#0F9D66' },
  { bg: '#E7E1FB', fg: '#6D4FE0' },
];

const StudentAnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const fullName = user?.name || 'Demo Student';
  const streak = user?.streak_count ?? 7;
  const earnedBadges = CERTIFICATE_TYPES.filter((c) => c.earned);
  const lockedBadge = CERTIFICATE_TYPES.find((c) => !c.earned);
  const recentBadges = earnedBadges.slice(0, 3);
  const activeDays = WEEK_ACTIVE.filter(Boolean).length;

  const stats = [
    { value: streak, label: 'Day streak', color: '#1D4ED8' },
    { value: '1,240', label: 'Total XP', color: '#0F9D58' },
    { value: earnedBadges.length, label: 'Badges', color: '#5B3FBD' },
    { value: '62%', label: 'Overall growth', color: '#C2410C' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        className="sp-main"
        style={{
          flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'linear-gradient(180deg, #6EC6E8 0%, #A9DCEF 35%, #E8F6FB 75%, #F7FCFE 100%)',
        }}
      >
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 32px 48px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.7)', border: 'none', color: '#0F3C6B', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', padding: '7px 14px', borderRadius: 10, marginBottom: 20,
            }}
          >
            Back
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F3C6B', margin: 0 }}>Your Progress Analytics</h1>
            <p style={{ fontSize: 14, color: '#4A6B85', margin: '6px 0 0' }}>Last 4 weeks · {fullName}</p>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ ...card, padding: '18px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Domain Trends */}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3C6B', margin: '0 0 12px' }}>Domain Trends</h2>
          <div style={{ ...card, padding: '20px 24px 12px', marginBottom: 32 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              {DOMAINS.map((d) => (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>{d.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DOMAIN_TRENDS} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  {DOMAINS.map((d) => (
                    <Line
                      key={d.key}
                      type="monotone"
                      dataKey={d.key}
                      name={d.label}
                      stroke={d.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: d.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Activity */}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3C6B', margin: '0 0 12px' }}>Weekly Activity</h2>
          <div style={{ ...card, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {WEEK_DAYS.map((day, i) => (
                <div key={day} style={{ textAlign: 'center' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: WEEK_ACTIVE[i] ? '#0F7A5C' : '#CDEEE1' }} />
                  <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>{day}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: '#334155', fontWeight: 600, margin: 0 }}>
              {activeDays} of {WEEK_DAYS.length} days<br />practiced this week
            </p>
          </div>

          {/* Recent Badges */}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3C6B', margin: '0 0 14px' }}>Recent Badges</h2>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 36 }}>
            {recentBadges.map((b, i) => (
              <div key={b.key} style={{ textAlign: 'center', width: 84 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: BADGE_COLORS[i % BADGE_COLORS.length].bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto',
                }}>
                  {b.icon}
                </div>
                <p style={{ fontSize: 12, color: '#334155', fontWeight: 600, margin: '8px 0 0' }}>{b.title}</p>
              </div>
            ))}
            {lockedBadge && (
              <div style={{ textAlign: 'center', width: 84 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: '#E5E5E5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#9CA3AF', margin: '0 auto',
                }}>
                  ?
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, margin: '8px 0 0' }}>Locked</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/student')}
            style={{
              display: 'block', width: '100%', maxWidth: 420, margin: '0 auto', background: '#1E4FA0', color: '#fff',
              fontWeight: 800, fontSize: 15, padding: '15px 0', borderRadius: 30, border: 'none', cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(30, 79, 160, 0.3)',
            }}
          >
            View Full Report
          </button>
        </div>
      </main>
    </div>
  );
};

export default StudentAnalyticsPage;
