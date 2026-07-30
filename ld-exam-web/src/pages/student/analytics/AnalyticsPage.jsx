import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import { CERTIFICATE_TYPES } from '../../../data/certificateTypes';
import AboutIcon from '../../../components/AboutIcon';

const card = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(15, 60, 107, 0.08)' };

const DOMAINS = [
  { key: 'phonics', label: 'Phonics', color: '#4f46e5', icon: '🔤' },
  { key: 'reading', label: 'Reading', color: '#0f766e', icon: '📖' },
  { key: 'writing', label: 'Writing', color: '#c2410c', icon: '✍️' },
  { key: 'math', label: 'Math', color: '#16a34a', icon: '➗' },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BADGE_COLORS = [
  { bg: '#FCE9C5', fg: '#C88A1E' },
  { bg: '#D8F2E7', fg: '#0F9D66' },
  { bg: '#E7E1FB', fg: '#6D4FE0' },
];

const StudentAnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const [weekActive, setWeekActive] = useState([null, null, null, null, null, null, null]);
  const [domainTrends, setDomainTrends] = useState([]);
  const [streak, setStreak] = useState(user?.streak_count ?? 0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    // Fetch real analytics to get weekDays
    const uid = user?.id || user?.user_id;
    if (uid) {
      analyticsAPI.student(uid)
        .then(data => {
          if (data?.weekDays) setWeekActive(data.weekDays);
          if (data?.streak) setStreak(data.streak);
          if (data?.totalPractices != null) setTotalSessions(data.totalPractices + (data?.totalTests || 0));
          if (data?.avgScore != null) setAvgScore(data.avgScore);
        })
        .catch(() => {});

      // Fetch practice history to build domain trends
      import('../../../services/api').then(({ ldAPI }) => {
        ldAPI.practiceHistory()
          .then(data => {
            if (data?.sessions?.length) {
              // Group by category, calculate score per session as trend points
              const byCategory = {};
              data.sessions.forEach(s => {
                const cat = s.session_type;
                if (!byCategory[cat]) byCategory[cat] = [];
                const score = s.exercises_total > 0 ? Math.round((s.exercises_correct / s.exercises_total) * 100) : 0;
                byCategory[cat].push({ date: s.completed_at || s.created_at, score });
              });
              setDomainTrends(byCategory);
            }
          })
          .catch(() => {});
      });
    }
  }, [user]);

  const fullName = user?.name || 'Demo Student';
  const earnedBadges = CERTIFICATE_TYPES.filter((c) => c.earned);
  const lockedBadge = CERTIFICATE_TYPES.find((c) => !c.earned);
  const recentBadges = earnedBadges.slice(0, 3);
  const activeDays = weekActive.filter(v => v === true).length;

  const stats = [
    { value: streak, label: 'Day streak', color: '#1D4ED8' },
    { value: totalSessions, label: 'Total sessions', color: '#0F9D58' },
    { value: earnedBadges.length, label: 'Badges', color: '#5B3FBD' },
    { value: `${avgScore}%`, label: 'Avg score', color: '#C2410C' },
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
          background: '#f8fafc',
        }}
      >
        <StudentHeader />

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 40px 48px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              alignSelf: 'flex-start', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(79,70,229,0.25)', marginBottom: 16
            }}
          >
              ← Back
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F3C6B', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
              Your Progress Analytics
              <AboutIcon
                title="About Analytics"
                description="Track your learning journey over the last 4 weeks with detailed stats and charts."
                items={['View skill progress across all subjects', 'See weekly activity trends', 'Check earned badges and certificates', 'Monitor your overall mastery percentage']}
              />
            </h1>
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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3C6B', margin: '0 0 12px' }}>Skill Progress</h2>
          <div style={{ ...card, padding: '20px 24px 12px', marginBottom: 32 }}>
            {Object.keys(domainTrends).length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>
                Complete some practice sessions to see your skill progress here!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {DOMAINS.filter(d => domainTrends[d.key]).map(d => {
                  const sessions = domainTrends[d.key] || [];
                  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0;
                  const latest = sessions.length > 0 ? sessions[0].score : 0;
                  const first = sessions.length > 1 ? sessions[sessions.length - 1].score : latest;
                  const trend = latest - first;
                  return (
                    <div key={d.key} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{d.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{d.label}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>({sessions.length} session{sessions.length !== 1 ? 's' : ''})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: avgScore >= 80 ? '#16a34a' : avgScore >= 50 ? '#d97706' : '#dc2626' }}>
                            {avgScore}%
                          </span>
                          {trend !== 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: trend > 0 ? '#16a34a' : '#dc2626' }}>
                              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{
                          width: `${avgScore}%`, height: '100%', borderRadius: 20,
                          background: `linear-gradient(90deg, ${d.color}88, ${d.color})`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Activity */}
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3C6B', margin: '0 0 12px' }}>Weekly Activity</h2>
          <div style={{ ...card, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {WEEK_DAYS.map((day, i) => (
                <div key={day} style={{ textAlign: 'center' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: weekActive[i] === true ? '#0F7A5C' : weekActive[i] === false ? '#CDEEE1' : '#e2e8f0' }} />
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
              <div key={b.key} onClick={() => navigate('/student/certification')} style={{ textAlign: 'center', width: 84, cursor: 'pointer' }}>
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
              <div onClick={() => navigate('/student/certification')} style={{ textAlign: 'center', width: 84, cursor: 'pointer' }}>
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
