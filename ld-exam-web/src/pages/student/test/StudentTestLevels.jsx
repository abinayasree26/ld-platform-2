import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../services/authStore';
import { maxUnlockedLevel } from '../subscriptionPlans';
import LevelAvatar from '../../../components/LevelAvatar';

const LEVEL_INFO = {
  1: { label: 'Starter', emoji: '🌱', bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-700', btn: 'bg-green-600 hover:bg-green-700', desc: 'Basic letters, sounds & number counting' },
  2: { label: 'Basic', emoji: '📘', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', desc: 'Simple reading, CVC words & arithmetic' },
  3: { label: 'Intermediate', emoji: '⚙️', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700', btn: 'bg-orange-500 hover:bg-orange-600', desc: 'Comprehension, fractions & sentence building' },
  4: { label: 'Advanced', emoji: '⭐', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700', desc: 'Grammar mastery & problem solving' },
  5: { label: 'Mastery', emoji: '🏆', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', desc: 'Critical thinking & complex maths' },
};

// Used when the backend isn't reachable, so the demo flow still works.
const DEMO_LEVELS = [
  { level: 1, unlocked: true,  isCurrent: false, everPassed: true,  bestScore: 90 },
  { level: 2, unlocked: true,  isCurrent: false, everPassed: true,  bestScore: 78 },
  { level: 3, unlocked: true,  isCurrent: true,  everPassed: false, bestScore: 55 },
  { level: 4, unlocked: false, isCurrent: false, everPassed: false, bestScore: null },
  { level: 5, unlocked: false, isCurrent: false, everPassed: false, bestScore: null },
];

// Used when the backend isn't reachable / no attempts yet, so the demo flow
// still shows a realistic history — every attempt from first to most recent,
// including retests, matching the best scores shown on DEMO_LEVELS above.
const DEFAULT_TEST_HISTORY = [
  { id: 'demo-1', level: 1, dateTime: '2026-04-01T10:15:00', scorePercent: 62, passed: false, correctCount: 12, totalQuestions: 20, timeTakenSeconds: 1270 },
  { id: 'demo-2', level: 1, dateTime: '2026-04-03T09:40:00', scorePercent: 90, passed: true, correctCount: 18, totalQuestions: 20, timeTakenSeconds: 1085 },
  { id: 'demo-3', level: 2, dateTime: '2026-04-10T11:05:00', scorePercent: 78, passed: true, correctCount: 16, totalQuestions: 20, timeTakenSeconds: 1190 },
  { id: 'demo-4', level: 3, dateTime: '2026-04-20T16:22:00', scorePercent: 55, passed: false, correctCount: 11, totalQuestions: 20, timeTakenSeconds: 1360 },
];

const formatScreenTime = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

const StudentTestLevels = ({ onStart }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const planMax = maxUnlockedLevel(user?.subscription || 'advanced');
  // Full attempt log — every test taken, including retests — oldest first ("first to till").
  const testHistory = [...(user?.test_history?.length ? user.test_history : DEFAULT_TEST_HISTORY)]
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/ld/tests/levels', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(({ levels: lvls }) => setLevels(lvls && lvls.length ? lvls : DEMO_LEVELS))
      .catch(() => setLevels(DEMO_LEVELS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        Loading levels…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <button
        onClick={() => navigate(-1)}
        className="bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2 rounded-xl shadow-sm mb-6"
      >
        Back
      </button>
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-800">Level Tests</h2>
        <p className="text-slate-500 text-base mt-2">
          Score <strong>70% or above</strong> to pass and unlock the next level. 20 questions per test.
        </p>
      </div>

      {/* ═══ TWO CONTAINERS: Level Tests + Test History (same size) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

      {/* ═══ LEFT: Level cards + info ═══ */}
      <div className="flex flex-col">
      <div className="space-y-5">
        {levels.map((lvl) => {
          const info = LEVEL_INFO[lvl.level];
          const planLocked = lvl.level > planMax;
          const locked = !lvl.unlocked || planLocked;
          return (
            <div
              key={lvl.level}
              className={`rounded-2xl border-2 p-4 sm:p-7 transition
                ${locked ? 'bg-slate-50 border-slate-100 opacity-60' : `${info.bg} ${info.border}`}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <LevelAvatar level={lvl.level} size={56} locked={locked} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-extrabold text-xl ${locked ? 'text-slate-400' : info.accent}`}>
                      Level {lvl.level} · {info.label}
                    </h3>
                    {lvl.isCurrent && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${info.btn.split(' ')[0]}`}>
                        Current
                      </span>
                    )}
                    {lvl.everPassed && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✅ Passed
                      </span>
                    )}
                    {planLocked && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ⭐ Plan upgrade needed
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${locked ? 'text-slate-400' : 'text-slate-500'}`}>
                    {info.desc}
                  </p>
                  {lvl.bestScore != null && (
                    <p className={`text-sm font-semibold mt-1 ${lvl.everPassed ? 'text-green-600' : 'text-amber-600'}`}>
                      Best score: {lvl.bestScore}%
                    </p>
                  )}
                  {locked && (
                    <p className="text-xs text-slate-400 mt-1">
                      {planLocked ? 'Upgrade your subscription plan to unlock this level' : `Pass Level ${lvl.level - 1} to unlock`}
                    </p>
                  )}
                </div>

                {planLocked ? (
                  <button
                    onClick={() => navigate('/student/profile')}
                    className="w-full sm:w-auto flex-shrink-0 text-white text-base font-bold px-6 py-3 rounded-xl transition bg-amber-500 hover:bg-amber-600"
                  >
                    Upgrade Plan
                  </button>
                ) : !locked && (
                  <button
                    onClick={() => onStart(lvl.level)}
                    className={`w-full sm:w-auto flex-shrink-0 text-white text-base font-bold px-6 py-3 rounded-xl transition ${info.btn}`}
                  >
                    {lvl.bestScore != null ? 'Retry ⟳' : 'Start ▶'}
                  </button>
                )}
              </div>

              {/* Progress bar for attempted levels */}
              {lvl.bestScore != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Best attempt</span>
                    <span>{lvl.bestScore}% / 70% needed</span>
                  </div>
                  <div className="h-2.5 bg-white/60 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${lvl.everPassed ? 'bg-green-500' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(lvl.bestScore, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-5">
        <p className="text-sm font-bold text-blue-800 mb-2">How it works</p>
        <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
          <li>20 multiple-choice questions per test</li>
          <li>25-minute timer — auto-submits when time runs out</li>
          <li>Score 70% or above to unlock the next level</li>
          <li>If you fail, you can retry after reviewing practice exercises</li>
          <li>AI feedback explains every wrong answer</li>
          <li>🧑‍🚀 Unlock a new illustrated avatar every time you level up</li>
        </ul>
      </div>
      </div>

      {/* ═══ RIGHT: Test History — every attempt, including retests, first to till ═══ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col">
        <h3 className="text-lg font-extrabold text-slate-800 mb-1">Test History</h3>
        <p className="text-xs text-slate-400 mb-4">Every test you've taken — including retests — from first to most recent.</p>

        {testHistory.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No tests taken yet. Start Level 1 to begin your history.</p>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            {testHistory.map((h, i) => {
              const info = LEVEL_INFO[h.level] || LEVEL_INFO[1];
              const dt = new Date(h.dateTime);
              return (
                <div key={h.id || i} className={`py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.bg} ${info.accent}`}>
                      Level {h.level} · {info.label}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.passed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {h.passed ? '✅ Passed' : '✕ Not passed'}
                    </span>
                    <span className="text-sm font-bold text-indigo-600 ml-auto">{h.scorePercent}%</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {h.correctCount}/{h.totalQuestions} correct · ⏱ {formatScreenTime(h.timeTakenSeconds)} screen time
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} at {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </div>
  );
};

export default StudentTestLevels;
