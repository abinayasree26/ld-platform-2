import React, { useState, useEffect } from 'react';
import { ldAPI, analyticsAPI } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import { getPlan } from '../../../data/subscriptionPlans';
import { GENERAL_TIPS } from '../../../data/recommendationsData';
import { currentAvatarLevel } from '../../../data/avatarSystem';
import { getDashboardProgress } from '../../../services/progressStore';
import AboutIcon from '../../../components/AboutIcon';

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

// Dynamic recommendations based on LD type + weak areas from practice/test history
const buildRecommendations = (ldType, weakCategories) => {
  const LD_RECS = {
    math: [
      { icon: '🔢', title: 'Number Line Games', tip: 'Use a physical or digital number line to visualise addition and subtraction.', category: 'Math', key: 'math' },
      { icon: '➗', title: 'Times Table Practice', tip: 'Practice one times table at a time using flashcards, 5 minutes daily.', category: 'Math', key: 'math' },
      { icon: '🧮', title: 'Counting Exercises', tip: 'Practice skip-counting (2s, 5s, 10s) to strengthen number sense.', category: 'Math', key: 'math' },
    ],
    dyslexia: [
      { icon: '📖', title: 'Daily Read-Aloud', tip: 'Read a short passage out loud for 10 minutes a day to build word-sound connections.', category: 'Reading', key: 'reading' },
      { icon: '🔤', title: 'Phonics Drills', tip: 'Practice blending letter sounds — start with 3-letter words before moving to longer ones.', category: 'Phonics', key: 'phonics' },
      { icon: '🎧', title: 'Audiobooks + Text', tip: "Follow along with the text while listening to an audiobook to strengthen word recognition.", category: 'Reading', key: 'reading' },
    ],
    dysgraphia: [
      { icon: '✍️', title: 'Letter Formation Practice', tip: 'Spend 5 minutes tracing letters that commonly get reversed (b/d, p/q).', category: 'Writing', key: 'writing' },
      { icon: '⌨️', title: 'Typing Practice', tip: 'Use typing instead of handwriting for longer assignments to reduce fatigue.', category: 'Writing', key: 'writing' },
      { icon: '📝', title: 'Spelling Patterns', tip: 'Focus on common spelling patterns and word families to build muscle memory.', category: 'Writing', key: 'writing' },
    ],
    dyscalculia: [
      { icon: '🔢', title: 'Number Line Games', tip: 'Use a physical or digital number line to visualise addition and subtraction.', category: 'Math', key: 'math' },
      { icon: '➗', title: 'Times Table Practice', tip: 'Practice one times table at a time using flashcards, 5 minutes daily.', category: 'Math', key: 'math' },
      { icon: '🧮', title: 'Counting Exercises', tip: 'Practice skip-counting (2s, 5s, 10s) to strengthen number sense.', category: 'Math', key: 'math' },
    ],
    mixed: [
      { icon: '⏱️', title: 'Short Focused Sessions', tip: 'Break practice into 10-minute focused sessions with a 2-minute break in between.', category: 'Focus' },
      { icon: '🎯', title: 'One Skill at a Time', tip: "Pick a single weak category from Practice each day rather than mixing everything.", category: 'Focus' },
    ],
    not_detected: [
      { icon: '🌟', title: 'Keep Up the Streak', tip: "You\'re doing great — keep practicing a little every day to stay sharp.", category: 'General' },
    ],
  };

  let recs = LD_RECS[ldType] || LD_RECS.not_detected;

  // If we have weak categories from actual data, build recommendations for ALL weak areas
  if (weakCategories.length > 0) {
    // Map category keys to LD_RECS keys
    const keyMap = { math: 'math', arithmetic: 'math', number_sense: 'math', counting: 'math',
                     reading: 'dyslexia', phonics: 'dyslexia', letter_recognition: 'dyslexia',
                     writing: 'dysgraphia', sequencing: 'dysgraphia', tracing: 'dysgraphia' };

    // Find all weak areas below 70% — these need recommendations
    const weakAreas = weakCategories.filter(c => c.accuracy < 70);
    
    // Collect recommendations from all weak area types (deduplicated)
    const allWeakRecs = [];
    const addedTitles = new Set();
    for (const weak of weakAreas) {
      const recsKey = keyMap[weak.key] || ldType;
      const areaRecs = LD_RECS[recsKey] || [];
      for (const r of areaRecs) {
        if (!addedTitles.has(r.title)) {
          allWeakRecs.push(r);
          addedTitles.add(r.title);
        }
      }
    }
    
    // Put weak area recs first, then any remaining LD type recs
    const remainingLdRecs = recs.filter(r => !addedTitles.has(r.title));
    recs = [...allWeakRecs, ...remainingLdRecs];
  }

  return recs;
};

const BADGE_COLORS = [
  { bg: '#E1E0FB', fg: '#5B3FBD' },
  { bg: '#D8F2E7', fg: '#0F9D66' },
];

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();

  const [ldType, setLdType] = useState(user?.ld_type || 'not_detected');
  const [weakCategories, setWeakCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch screening result
    ldAPI.screeningStatus()
      .then(s => { if (s?.ld_type_detected) setLdType(s.ld_type_detected); })
      .catch(() => {});

    // Also try analytics API for category mastery (most reliable source)
    const studentId = user?.id;
    if (studentId) {
      // Use the current-student endpoint (by-id path 404s in real mode)
      analyticsAPI.me()
        .then(data => {
          if (data?.categoryMastery?.length && weakCategories.length === 0) {
            const sorted = data.categoryMastery
              .map(c => ({ key: c.category, accuracy: c.mastery, count: 1 }))
              .sort((a, b) => a.accuracy - b.accuracy);
            setWeakCategories(sorted);
          }
        })
        .catch(() => {});
    }

    // Fetch practice history to find weak areas
    ldAPI.practiceHistory()
      .then(data => {
        if (data?.sessions?.length) {
          // Group by category, calculate average accuracy
          const categoryScores = {};
          data.sessions.forEach(s => {
            const cat = s.session_type;
            if (!categoryScores[cat]) categoryScores[cat] = { total: 0, correct: 0, count: 0 };
            categoryScores[cat].total += s.exercises_total || 0;
            categoryScores[cat].correct += s.exercises_correct || 0;
            categoryScores[cat].count++;
          });
          // Sort by accuracy (lowest first = weakest)
          const sorted = Object.entries(categoryScores)
            .map(([key, v]) => ({ key, accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0, count: v.count }))
            .sort((a, b) => a.accuracy - b.accuracy);
          setWeakCategories(sorted);
        } else {
          // Fall back to local progressStore data
          const local = getDashboardProgress();
          if (local.categoryMastery.length > 0) {
            const sorted = local.categoryMastery
              .map(c => ({ key: c.category, accuracy: c.mastery, count: 1 }))
              .sort((a, b) => a.accuracy - b.accuracy);
            setWeakCategories(sorted);
          }
        }
      })
      .catch(() => {
        // API failed — use local progressStore
        const local = getDashboardProgress();
        if (local.categoryMastery.length > 0) {
          const sorted = local.categoryMastery
            .map(c => ({ key: c.category, accuracy: c.mastery, count: 1 }))
            .sort((a, b) => a.accuracy - b.accuracy);
          setWeakCategories(sorted);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const subscription = user?.subscription || 'advanced';
  const hasAccess = getPlan(subscription).limits.recommendations;
  const avatarLevel = currentAvatarLevel(user);

  const personalRecs = buildRecommendations(ldType, weakCategories);
  const allRecs = [...personalRecs, ...GENERAL_TIPS];
  const primary = allRecs[0];
  const suggested = allRecs.slice(1, 6);
  const island = ISLAND_NAMES[ldType] || ISLAND_NAMES.not_detected;

  // Add test recommendation if student has practiced enough
  const testReady = (user?.highestPassedLevel || 0) < 5;
  const testRec = testReady ? {
    icon: '🏆',
    title: `Take Level ${(user?.highestPassedLevel || 0) + 1} Test`,
    tip: `You've been practicing well! Try the Level ${(user?.highestPassedLevel || 0) + 1} test to unlock the next stage.`,
    category: 'Test',
    key: 'test',
  } : null;
  const updatedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Group weak categories into broader areas for display
  const mathCats = ['math', 'arithmetic', 'number_sense', 'counting', 'patterns'];
  const readingCats = ['reading', 'phonics', 'letter_recognition', 'rhyme_detection', 'phoneme_blending'];
  const writingCats = ['writing', 'sequencing', 'tracing'];

  const getWeakestGroup = () => {
    if (weakCategories.length === 0) return null;
    const mathWeak = weakCategories.filter(c => mathCats.includes(c.key));
    const readingWeak = weakCategories.filter(c => readingCats.includes(c.key));
    const writingWeak = weakCategories.filter(c => writingCats.includes(c.key));
    const mathAvg = mathWeak.length > 0 ? Math.round(mathWeak.reduce((a, c) => a + c.accuracy, 0) / mathWeak.length) : 100;
    const readingAvg = readingWeak.length > 0 ? Math.round(readingWeak.reduce((a, c) => a + c.accuracy, 0) / readingWeak.length) : 100;
    const writingAvg = writingWeak.length > 0 ? Math.round(writingWeak.reduce((a, c) => a + c.accuracy, 0) / writingWeak.length) : 100;
    const lowest = Math.min(mathAvg, readingAvg, writingAvg);
    if (lowest === mathAvg) return { name: 'Math', accuracy: mathAvg, count: mathWeak.length };
    if (lowest === readingAvg) return { name: 'Reading & Phonics', accuracy: readingAvg, count: readingWeak.length };
    return { name: 'Writing', accuracy: writingAvg, count: writingWeak.length };
  };

  const weakestGroup = getWeakestGroup();

  // Dynamic mascot message based on actual data
  const getMascotMessage = () => {
    if (weakestGroup) {
      if (weakestGroup.accuracy < 60) {
        return `"I noticed your ${weakestGroup.name} scores need some work — let's improve that together today!"`;
      }
      return `"Your ${weakestGroup.name} could use a bit more practice — let's keep building! 💪"`;
    }
    if (ldType === 'not_detected') return `"You're doing great! Let's keep that streak going today! 🌟"`;
    return `"Let's focus on your ${primary?.category?.toLowerCase() || 'skills'} today — small steps lead to big wins!"`;
  };

  // Dynamic "why" message
  const getWhyMessage = () => {
    if (weakestGroup) {
      return `${weakestGroup.name} is your weakest area (${weakestGroup.accuracy}% average) — a focused session today will help improve it.`;
    }
    return `${primary?.category || 'This'} practice helps strengthen skills based on your learning profile.`;
  };

  const startPractice = (rec) => {
    if (rec?.key === 'test') {
      navigate('/student/tests');
    } else {
      navigate('/student/practice', rec?.key ? { state: { category: rec.key } } : undefined);
    }
  };

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
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F3C6B', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                  Today's AI Recommendation
                  <AboutIcon
                    title="About Recommendations"
                    description="AI-powered suggestions to help you focus on the right areas for improvement."
                    items={['Personalized daily recommendations based on your performance', 'Tips for improving weak areas', 'Suggested practice activities', 'Updated each time you visit']}
                  />
                </h1>
                <p style={{ fontSize: 13, color: '#4A6B85', margin: '6px 0 0' }}>🧠 Powered by on-device AI · Updated {updatedAt}</p>
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
                    {getMascotMessage()}
                  </p>
                </div>
              </div>

              {/* Why this recommendation */}
              <div style={{ background: '#FDF2EE', border: '1px solid #E9C9BB', borderRadius: 14, padding: '14px 18px', margin: '20px 0' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#B23A1A', margin: '0 0 4px' }}>Why this recommendation</p>
                <p style={{ fontSize: 13, color: '#8A4632', margin: 0, lineHeight: 1.5 }}>
                  {getWhyMessage()}
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
                {weakCategories.length > 0 && (
                  <>
                    <div style={{ height: 8, background: '#e8eef5', borderRadius: 20, overflow: 'hidden', margin: '16px 0 8px' }}>
                      <div style={{ width: `${weakCategories[0].accuracy}%`, height: '100%', background: weakCategories[0].accuracy >= 70 ? '#16a34a' : weakCategories[0].accuracy >= 40 ? '#d97706' : '#dc2626', borderRadius: 20 }} />
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>Current mastery: {weakCategories[0].accuracy}% — let's push it higher!</p>
                  </>
                )}
                {weakCategories.length === 0 && (
                  <>
                    <div style={{ height: 8, background: '#e8eef5', borderRadius: 20, overflow: 'hidden', margin: '16px 0 8px' }}>
                      <div style={{ width: '35%', height: '100%', background: '#1E4FA0', borderRadius: 20 }} />
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>Matches your learning profile</p>
                  </>
                )}
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

              {/* Level Test recommendation */}
              {testRec && (
                <div style={{ ...card, padding: 16, marginBottom: 16, background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>🏆</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#166534', margin: 0 }}>{testRec.title}</p>
                      <p style={{ fontSize: 12, color: '#4d7c0f', margin: '4px 0 0', lineHeight: 1.5 }}>{testRec.tip}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => startPractice(testRec)}
                    style={{ width: '100%', fontSize: 13, fontWeight: 700, color: '#fff', background: '#16a34a', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 8 }}
                  >
                    Take Test →
                  </button>
                </div>
              )}

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
                Begin Today\'s Plan
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecommendationsPage;
