import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { adaptiveAPI } from '../../../services/api';

/**
 * Adaptive Screening — Results Dashboard.
 * Shows overall English/Math levels, per-skill score+level+band+recommended
 * practice, a Strong/Developing/Needs-Support summary, and the personalized
 * next Level-Test plan. Reads state passed from submit, or fetches by id.
 */

const BAND_COLOR = {
  'Strong': { bg: '#E7F6EC', fg: '#16A34A', bar: '#16A34A' },
  'Developing': { bg: '#FEF3E2', fg: '#F59E0B', bar: '#F59E0B' },
  'Needs Support': { bg: '#FDECEC', fg: '#EF4444', bar: '#EF4444' },
};

// Subject accent (English blue, Math teal) — matches the assessment UI.
const SUBJECT_COLOR = { English: '#2563EB', Mathematics: '#0EA5A4' };
const SUBJECT_SOFT  = { English: '#EAF1FB', Mathematics: '#E3F6F5' };
const SUBJECT_ICON  = { English: '📘', Mathematics: '➕' };

export default function AdaptiveResultPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) return;
    adaptiveAPI.result(sessionId)
      .then((r) => setData(r))
      .catch(() => setError('Could not load results.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div style={{ padding: 40 }}>Loading results…</div>;
  if (error) return <div style={{ padding: 40, color: '#b91c1c' }}>{error}</div>;

  const result = data.result || data;
  const nextTest = data.nextTest || data.next_test_plan;
  const overall = result.overall || {};
  const skills = result.skills || {};
  const summary = result.summary || { strong: [], developing: [], needsSupport: [] };

  return (
    <div style={{ background: '#F5F8FD', minHeight: '100vh', padding: '28px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ color: '#2563EB', margin: '0 0 4px', fontWeight: 800, letterSpacing: '-0.01em' }}>Your Screening Results</h1>
        <p style={{ color: '#64748b', marginTop: 0 }}>
          A skill-by-skill picture of your current level — not just a single score.
        </p>

        {/* Overall cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '18px 0' }}>
          {['English', 'Mathematics'].map((subj) => {
            const o = overall[subj] || { percent: 0, level: 'Beginner' };
            return (
              <div key={subj} style={{ background: '#fff', borderRadius: 20, padding: 22,
                boxShadow: '0 10px 30px rgba(15,60,107,0.10)', border: '1px solid #E2E8F0',
                borderTop: `4px solid ${SUBJECT_COLOR[subj]}` }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
                  fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                  background: SUBJECT_SOFT[subj], color: SUBJECT_COLOR[subj] }}>
                  <span aria-hidden="true">{SUBJECT_ICON[subj]}</span> {subj}
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: SUBJECT_COLOR[subj], marginTop: 8 }}>{o.percent}%</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>{o.level}</div>
              </div>
            );
          })}
        </div>

        {/* Strength / weakness summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <SummaryCard title="💪 Strong" items={summary.strong} band="Strong" />
          <SummaryCard title="📈 Developing" items={summary.developing} band="Developing" />
          <SummaryCard title="🎯 Needs Support" items={summary.needsSupport} band="Needs Support" />
        </div>

        {/* Per-subject skill breakdown */}
        {['English', 'Mathematics'].map((subj) => (
          <div key={subj} style={{ marginBottom: 22 }}>
            <h2 style={{ color: '#334155', fontSize: 18 }}>{subj} — Skills</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {Object.entries(skills[subj] || {}).map(([skill, v]) => {
                const c = BAND_COLOR[v.band] || BAND_COLOR['Developing'];
                return (
                  <div key={skill} style={{ background: '#fff', borderRadius: 16, padding: 16,
                    border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(15,60,107,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{skill}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: SUBJECT_COLOR[subj] || '#2563EB' }}>{v.score}%</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          background: c.bg, color: c.fg }}>{v.level} · {v.band}</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#EEF2F7', borderRadius: 999, margin: '10px 0' }}>
                      <div style={{ width: `${v.score}%`, height: '100%', background: c.bar, borderRadius: 999 }} />
                    </div>
                    {v.recommendedPractice && v.recommendedPractice.length > 0 && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Recommended: {v.recommendedPractice.join(' · ')}
                      </div>
                    )}
                    {v.aiPending > 0 && (
                      <div style={{ fontSize: 11, color: '#a16207' }}>
                        {v.aiPending} spoken/open answer(s) will be reviewed by AI shortly.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Personalized next Level Test */}
        {nextTest && nextTest.plan && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 20,
            border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(15,60,107,0.10)' }}>
            <h2 style={{ color: '#334155', fontSize: 18, marginTop: 0 }}>Your Personalized Next Level Test</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
              Built from your results — more questions on the skills you need most.
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {nextTest.plan.slice(0, 10).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 14 }}>
                  <span><b>{p.count}×</b> {p.subject} · {p.skill}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{p.targetDifficulty} — {p.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/student/practice')}
            style={{ flex: 1, minHeight: 48, padding: '14px', borderRadius: 999, border: 'none', fontWeight: 700,
              background: '#16A34A', color: '#fff', cursor: 'pointer', boxShadow: '0 6px 16px rgba(22,163,74,0.30)' }}>
            Start Recommended Practice →
          </button>
          <button onClick={() => navigate('/student')}
            style={{ minHeight: 48, padding: '14px 22px', borderRadius: 999, border: '2px solid #E2E8F0', fontWeight: 700,
              background: 'transparent', color: '#334155', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, items, band }) {
  const c = BAND_COLOR[band];
  return (
    <div style={{ background: c.bg, borderRadius: 16, padding: 14 }}>
      <div style={{ fontWeight: 800, color: c.fg, marginBottom: 6 }}>{title}</div>
      {items && items.length ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: c.fg, fontSize: 13 }}>
          {items.map((s) => <li key={s}>{s}</li>)}
        </ul>
      ) : <div style={{ fontSize: 12, color: c.fg, opacity: 0.7 }}>—</div>}
    </div>
  );
}
