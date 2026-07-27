import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import { getPlan } from './subscriptionPlans';
import { RECOMMENDATIONS_BY_LD_TYPE, GENERAL_TIPS } from './recommendationsData';
import { currentAvatarLevel } from './avatarSystem';

const card = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(15, 60, 107, 0.08)' };

const ISLAND_NAMES = {
  dyslexia: 'Dyslexia Island',
  dysgraphia: 'Dysgraphia Island',
  dyscalculia: 'Dyscalculia Island',
  mixed: 'Focus Island',
  not_detected: 'Explorer Island',
};

const CATEGORY_META = {
  Reading: 'sight words + phonics pairing',
  Phonics: 'letter-sound blending practice',
  Writing: 'letter formation & tracing',
  Math: 'number sense & arithmetic',
  Focus: 'focus & attention training',
  Habit: 'consistent daily practice',
  Motivation: 'confidence-building review',
  General: 'skill reinforcement',
};

const BADGE_COLORS = [
  { bg: '#E1E0FB', fg: '#5B3FBD' },
  { bg: '#D8F2E7', fg: '#0F9D66' },
];

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const ldType = user?.ld_type || 'dyslexia';
  const subscription = user?.subscription || 'advanced';
  const hasAccess = getPlan(subscription).limits.recommendations;
  const avatarLevel = currentAvatarLevel(user);

  const personalRecs = RECOMMENDATIONS_BY_LD_TYPE[ldType] || RECOMMENDATIONS_BY_LD_TYPE.not_detected;
  const allRecs = [...personalRecs, ...GENERAL_TIPS];
  const primary = allRecs[0];
  const suggested = allRecs.slice(1, 3);
  const island = ISLAND_NAMES[ldType] || ISLAND_NAMES.not_detected;
  const updatedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const startPractice = (rec) => navigate('/student/practice', rec?.key ? { state: { category: rec.key } } : undefined);

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

        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 32px 48px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.7)', border: 'none', color: '#0F3C6B', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', padding: '7px 14px', borderRadius: 10, marginBottom: 20,
            }}
          >
            Back
          </button>

          {!hasAccess ? (
            <div style={{ ...card, textAlign: 'center', padding: 56 }}>
              <span style={{ fontSize: 56 }}>🔒</span>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '16px 0 6px' }}>Recommendations are a paid feature</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', margin: '0 0 24px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                Upgrade to the Advanced or Pro plan for AI-personalised recommendations based on your learning profile.
              </p>
              <button
                onClick={() => navigate('/student/profile')}
                style={{ background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
              >
                View Plans →
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F3C6B', margin: 0 }}>Today's AI Recommendation</h1>
                <p style={{ fontSize: 13, color: '#4A6B85', margin: '6px 0 0' }}>Powered by Gemini · Updated {updatedAt}</p>
              </div>

              {/* Mascot + speech bubble */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '28px 0 8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: -14, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(244,149,94,0.35) 0%, rgba(244,149,94,0) 70%)',
                  }} />
                  {/* antennae */}
                  <div style={{ position: 'absolute', top: -10, left: 18, width: 3, height: 20, background: '#F2895E', transform: 'rotate(-18deg)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: -14, left: 12, width: 10, height: 10, borderRadius: '50%', background: '#F6B93B' }} />
                  <div style={{ position: 'absolute', top: -10, right: 18, width: 3, height: 20, background: '#F2895E', transform: 'rotate(18deg)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', top: -14, right: 12, width: 10, height: 10, borderRadius: '50%', background: '#F6B93B' }} />
                  {/* body */}
                  <div style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', background: '#F2895E', boxShadow: '0 8px 18px rgba(242,137,94,0.4)' }}>
                    <div style={{ position: 'absolute', top: 36, left: 30, width: 8, height: 8, borderRadius: '50%', background: '#1e293b' }} />
                    <div style={{ position: 'absolute', top: 36, right: 30, width: 8, height: 8, borderRadius: '50%', background: '#1e293b' }} />
                    <div style={{ position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)', width: 26, height: 12, borderRadius: '0 0 50% 50%', background: '#1e293b' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 60, height: 10, borderRadius: '50%', background: 'rgba(15,60,107,0.12)' }} />
                </div>

                <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '14px 18px', maxWidth: 260, boxShadow: '0 4px 16px rgba(15,60,107,0.1)' }}>
                  <div style={{
                    position: 'absolute', left: -8, top: 22, width: 0, height: 0,
                    borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid #fff',
                  }} />
                  <p style={{ fontSize: 13.5, color: '#1e293b', margin: 0, lineHeight: 1.5 }}>
                    "I noticed {primary.category.toLowerCase()} scores dipped this week — let's fix that together today!"
                  </p>
                </div>
              </div>

              {/* Why this recommendation */}
              <div style={{ background: '#FDF2EE', border: '1px solid #E9C9BB', borderRadius: 14, padding: '14px 18px', margin: '20px 0' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#B23A1A', margin: '0 0 4px' }}>Why this recommendation</p>
                <p style={{ fontSize: 13, color: '#8A4632', margin: 0, lineHeight: 1.5 }}>
                  {primary.category} practice has slipped over your last few sessions — a focused session today gets you back on track.
                </p>
              </div>

              {/* Primary focus */}
              <div style={{ ...card, padding: '20px 22px', marginBottom: 24, borderLeft: '5px solid #1E4FA0' }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Primary Focus · {island}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F3C6B', margin: 0 }}>{primary.category} Drill — Level {avatarLevel}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>10 min · {CATEGORY_META[primary.category] || 'skill practice'}</p>
                  </div>
                  <button
                    onClick={() => startPractice(primary)}
                    style={{ flexShrink: 0, background: '#1E4FA0', color: '#fff', fontWeight: 800, fontSize: 13, padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
                  >
                    Start
                  </button>
                </div>
                <div style={{ height: 8, background: '#e8eef5', borderRadius: 20, overflow: 'hidden', margin: '16px 0 8px' }}>
                  <div style={{ width: '35%', height: '100%', background: '#1E4FA0', borderRadius: 20 }} />
                </div>
                <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>Matches your weakest tracked domain</p>
              </div>

              {/* Also suggested */}
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F3C6B', margin: '0 0 12px' }}>Also suggested today</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }}>
                {suggested.map((rec, i) => (
                  <div key={rec.title} style={{ ...card, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: BADGE_COLORS[i % BADGE_COLORS.length].bg, color: BADGE_COLORS[i % BADGE_COLORS.length].fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                      }}>
                        {i + 2}
                      </span>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0F3C6B', margin: 0 }}>{rec.title}</p>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{rec.tip}</p>
                    <button
                      onClick={() => startPractice(rec)}
                      style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#1E4FA0', background: '#eaf1fb', padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer' }}
                    >
                      Start Practice
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#4A6B85', margin: '28px 0 20px' }}>
                Recommendations refresh every morning based on yesterday's activity
              </p>

              <button
                onClick={() => startPractice(primary)}
                style={{
                  display: 'block', width: '100%', maxWidth: 420, margin: '0 auto', background: '#F6B93B', color: '#0F3C6B',
                  fontWeight: 800, fontSize: 15, padding: '15px 0', borderRadius: 30, border: 'none', cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(246, 185, 59, 0.4)',
                }}
              >
                Begin Today's Plan
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecommendationsPage;
