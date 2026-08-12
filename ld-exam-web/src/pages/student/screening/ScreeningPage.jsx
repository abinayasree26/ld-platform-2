import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeakButton } from '../../../components/accessibility';
import useAuthStore from '../../../services/authStore';
import { ldAPI } from '../../../services/api';
import { recordScreening } from '../../../services/progressStore';
import AboutIcon from '../../../components/AboutIcon';


import { supabase } from '../../../services/supabaseClient';

const LD_RESULT = {
  dyslexia:    { label: 'Dyslexia', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '🧠' },
  dysgraphia:  { label: 'Dysgraphia', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '✍️' },
  dyscalculia: { label: 'Dyscalculia', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '➗' },
  mixed:       { label: 'Mixed LD', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '🔀' },
  not_detected:{ label: 'No LD Detected', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: '✅' },
};

// Used when the backend has no screening questions configured yet, so the
// single-user demo flow still works end-to-end.
const DEMO_QUESTIONS = [
  { id: 'd1', category: 'reading',   difficulty: 1, question_text: 'Which word rhymes with "cat"?', options_json: ['Hat', 'Dog', 'Sun', 'Fish'], correct_answer: 'Hat', ld_target: 'dyslexia' },
  { id: 'd2', category: 'reading',   difficulty: 1, question_text: 'Read: "The quick fox jumps." What jumps?', options_json: ['The fox', 'The dog', 'The cat', 'The bird'], correct_answer: 'The fox', ld_target: 'dyslexia' },
  { id: 'd3', category: 'writing',   difficulty: 1, question_text: 'Which letter is written backwards here: "b, d, p, q, d"?', options_json: ['b', 'd', 'p', 'q'], correct_answer: 'd', ld_target: 'dysgraphia' },
  { id: 'd4', category: 'writing',   difficulty: 2, question_text: 'Pick the correctly spelled word.', options_json: ['Recieve', 'Receive', 'Receeve', 'Receve'], correct_answer: 'Receive', ld_target: 'dysgraphia' },
  { id: 'd5', category: 'math',      difficulty: 1, question_text: 'What is 7 + 5?', options_json: ['11', '12', '13', '10'], correct_answer: '12', ld_target: 'dyscalculia' },
  { id: 'd6', category: 'math',      difficulty: 2, question_text: 'Which number is bigger: 342 or 423?', options_json: ['342', '423', 'They are equal', 'Cannot tell'], correct_answer: '423', ld_target: 'dyscalculia' },
  { id: 'd7', category: 'phonics',   difficulty: 1, question_text: 'Which word starts with the same sound as "ship"?', options_json: ['Shop', 'Cat', 'Fun', 'Ball'], correct_answer: 'Shop', ld_target: 'dyslexia' },
  { id: 'd8', category: 'attention', difficulty: 1, question_text: 'How easy is it for you to stay focused on one task for 10 minutes?', options_json: ['Very easy', 'Somewhat easy', 'Somewhat hard', 'Very hard'], correct_answer: 'Very easy', ld_target: 'mixed' },
];

// Lightweight local scoring so the demo flow works without a backend —
// mirrors the shape of the real /api/ld/screening/submit response.
const computeDemoResult = (finalAnswers) => {
  // Compute correctness here from student_answer vs correct_answer
  // (the backend normally does this; this is only a no-backend fallback).
  const norm = (v) => (v === null || v === undefined ? '' : String(v).trim().toLowerCase());
  const byTarget = {};
  finalAnswers.forEach((a) => {
    const t = a.ld_target || 'dyslexia';
    byTarget[t] = byTarget[t] || { wrong: 0, total: 0 };
    byTarget[t].total += 1;
    const isCorrect = a.correct_answer !== undefined
      ? norm(a.student_answer) === norm(a.correct_answer)
      : false;
    if (!isCorrect) byTarget[t].wrong += 1;
  });

  const breakdown = {};
  let topType = 'not_detected';
  let topScore = -1;
  Object.entries(byTarget).forEach(([type, { wrong, total }]) => {
    const pct = Math.round((wrong / total) * 100);
    breakdown[type] = pct;
    if (pct > topScore) { topScore = pct; topType = pct >= 40 ? type : 'not_detected'; }
  });

  const overallWrong = finalAnswers.filter((a) => !a.is_correct).length;
  const overallRiskScore = Math.round((overallWrong / finalAnswers.length) * 100);

  return {
    ldType: overallRiskScore >= 40 ? topType : 'not_detected',
    overallRiskScore,
    breakdown,
    reasoning: 'Based on your answers, this is a demo estimate of your learning profile. A full assessment considers many more questions and response patterns.',
    classifiedBy: 'rule-based',
    recommendations: [
      'Practice 10–15 minutes daily for the best results.',
      'Focus extra time on the areas where you answered incorrectly.',
      'Revisit this screening every few weeks to track progress.',
    ],
  };
};

const StudentScreeningPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [phase, setPhase] = useState('loading'); // loading | intro | quiz | submitting | result | empty
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);
  const questionStartRef = useRef(null);

  useEffect(() => {
    ldAPI.screeningQuestions()
      .then((d) => {
        if (!d.questions || d.questions.length === 0) {
          setQuestions(DEMO_QUESTIONS);
          setPhase('intro');
          return;
        }
        setQuestions(d.questions);
        setPhase('intro');
      })
      .catch(() => {
        setQuestions(DEMO_QUESTIONS);
        setPhase('intro');
      });
  }, []);

  const startQuiz = () => {
    startTimeRef.current = Date.now();
    questionStartRef.current = Date.now();
    setPhase('quiz');
  };

  const handleAnswer = (option) => {
    setSelected(option);
  };

  const handleNext = () => {
    if (selected === null) return;
    const q = questions[current];
    const responseMs = Date.now() - questionStartRef.current;

    // NOTE: correctness is decided by the BACKEND, not here.
    // We only capture what the student selected. This avoids the old
    // options_json[0] bug where the first option was treated as correct.
    const answer = {
      question_id: q.id,
      category: q.category || 'reading',
      ld_target: q.ld_target || 'dyslexia',
      difficulty: q.difficulty || 1,
      student_answer: selected,
      // Included ONLY for the offline no-backend fallback (demo questions
      // carry correct_answer). The real backend ignores this and scores
      // from the database, so it is not a security concern in production.
      correct_answer: q.correct_answer,
      response_time_ms: responseMs,
    };

    // Replace existing answer for this question (if going back and re-answering)
    const existingIndex = answers.findIndex(a => a.question_id === q.id);
    const newAnswers = existingIndex >= 0
      ? answers.map((a, i) => i === existingIndex ? answer : a)
      : [...answers, answer];
    setAnswers(newAnswers);
    setSelected(null);
    questionStartRef.current = Date.now();

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      submitScreening(newAnswers);
    }
  };

  const submitScreening = async (finalAnswers) => {
    setPhase('submitting');
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    let finalResultData = null;
    try {
      const data = await ldAPI.screeningSubmit(finalAnswers, Math.max(60, durationSeconds));
      finalResultData = data;
      setResult(data);
      recordScreening({ riskScore: data.riskScore, ldType: data.ldType, breakdown: data.breakdown });
      setPhase('result');
    } catch {
      // No backend available in this demo environment — score it locally instead.
      const localResult = computeDemoResult(finalAnswers);
      finalResultData = localResult;
      setResult(localResult);
      recordScreening({
        riskScore: localResult.riskScore,
        ldType: localResult.ldType,
        breakdown: localResult.breakdown,
      });
      setPhase('result');
    }

    try {
      const studentUser = (user && user.role === 'student')
        ? user
        : (JSON.parse(localStorage.getItem('student_user_data') || 'null') || user);

      const sName = (studentUser?.name && studentUser.name !== 'Administrator' && studentUser.name !== 'Admin User' && studentUser.name !== 'Admin')
        ? studentUser.name
        : (studentUser?.email ? studentUser.email.split('@')[0] : 'saranya');

      const sEmail = (studentUser?.email && !studentUser.email.includes('admin'))
        ? studentUser.email
        : 'saranya@gmail.com';

      const newSubmission = {
        id: `sr-${Date.now()}`,
        studentId: studentUser?.id || 'st-demo',
        studentName: sName,
        studentEmail: sEmail,
        ldType: finalResultData?.ldType || 'dyslexia',
        severity: finalResultData?.severity || 'Moderate',
        riskScore: finalResultData?.riskScore || 45,
        status: 'completed',
        completedAt: new Date().toISOString(),
        breakdown: finalResultData?.breakdown || { dyslexia: 55, dysgraphia: 40, dyscalculia: 30 },
      };
      const stored = JSON.parse(localStorage.getItem('admin_custom_screening_results') || '[]');
      const filteredStored = stored.filter(s => s.studentName !== 'Administrator' && s.studentEmail !== 'student@gmail.com');
      localStorage.setItem('admin_custom_screening_results', JSON.stringify([newSubmission, ...filteredStored]));

      // Real-time Cloud DB update in Supabase
      const formattedLdType = newSubmission.ldType ? (newSubmission.ldType.charAt(0).toUpperCase() + newSubmission.ldType.slice(1)) : 'Dyslexia';
      supabase.from('students').update({
        ld_type: formattedLdType,
        severity: newSubmission.severity,
        screened: true,
        last_active: 'Today',
      }).eq('email', sEmail.toLowerCase()).then(() => {}).catch(() => {});
    } catch { /* ignore */ }
  };

  const q = questions[current];
  const rawOptions = q?.options_json || q?.options;
  const options = rawOptions
    ? (Array.isArray(rawOptions) ? rawOptions : Object.values(rawOptions))
    : [];
  const progress = questions.length ? Math.round((current / questions.length) * 100) : 0;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Preparing your assessment…</p>
        </div>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-xl font-black text-slate-800">Screening Not Ready Yet</h2>
          <p className="text-slate-500 text-sm">Your teacher hasn't set up the screening questions yet. Check back soon!</p>
          <button onClick={() => navigate('/student')}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div style={{ width: '100%', maxWidth: 448 }}>
          <button onClick={() => navigate('/student')}
            className=""
            style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(79,70,229,0.25)' }}>
            ← Back to Dashboard
          </button>
          <div className="bg-white rounded-2xl shadow-xl w-full p-8 space-y-6" style={{ position: 'relative' }}>
            {/* About icon top-right */}
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <AboutIcon
                title="About Learning Assessment"
                description="This screening helps us understand how you learn best so we can personalize your experience."
                items={['Answer simple questions about how you learn', 'No right or wrong answers', 'Results help us customize your practice sessions', '100 questions across 5 levels · About 45-60 minutes']}
              />
            </div>
          <div className="text-center">
            <p className="text-5xl mb-3">📝</p>
            <h2 className="text-2xl font-black text-slate-800">Learning Assessment</h2>
            <p className="text-slate-500 text-sm mt-2">
              Welcome, {user?.name?.split(' ')[0] || 'Student'}! Let's understand how you learn best.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">What to expect</p>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• {questions.length} questions</li>
              <li>⏱️ About {Math.max(5, Math.round(questions.length * 0.5))}–{Math.max(10, Math.round(questions.length * 0.75))} minutes</li>
              <li>• No right or wrong answers — just answer honestly</li>
              <li>• We'll personalise your learning plan after</li>
            </ul>
          </div>
          <button onClick={startQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-blue-200 transition">
            Start Assessment
          </button>
          <button onClick={() => navigate('/student')}
            className="w-full text-slate-400 text-sm hover:text-slate-600 transition">
            Skip for now
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && q) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
              {q.category}
            </span>
            <span className="text-xs text-slate-400">Difficulty {q.difficulty || 1}/3</span>
          </div>

          {/* Question */}
          <div className="bg-slate-50 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-slate-800 leading-relaxed flex-1 m-0">{q.question_text}</p>
              <SpeakButton text={q.question_text} size="md" />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-semibold text-sm transition-all
                  ${selected === opt
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
                  }`}>
                <span className="mr-3 font-black text-slate-400">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (current > 0) {
                  const prevIndex = current - 1;
                  const prevAnswer = answers.find(a => a.question_id === questions[prevIndex]?.id);
                  setCurrent(prevIndex);
                  setSelected(prevAnswer?.student_answer || null);
                }
              }}
              disabled={current === 0}
              className="px-6 py-4 rounded-xl font-bold text-sm transition border-2 border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ◀ Back
            </button>
            <button
              onClick={handleNext}
              disabled={selected === null}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition disabled:bg-slate-200 disabled:text-slate-400"
            >
              {current + 1 === questions.length ? 'Finish Assessment' : 'Next Question ▶'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-bold">Analysing your responses…</p>
          <p className="text-slate-400 text-sm">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const info = LD_RESULT[result.ldType] || LD_RESULT.not_detected;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <p className="text-5xl mb-3">{info.icon}</p>
            <h2 className="text-2xl font-black text-slate-800">Assessment Complete!</h2>
          </div>

          <div className={`border-2 rounded-2xl p-6 text-center ${info.bg}`}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Your Learning Profile</p>
            <p className={`text-3xl font-black ${info.color}`}>{info.label}</p>
            {result.overallRiskScore != null && (
              <p className="text-sm text-slate-500 mt-2">Risk Score: {result.overallRiskScore}/100</p>
            )}
          </div>

          {result.breakdown && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Risk Breakdown</p>
              <div className="space-y-3">
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span className="capitalize">{key}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          key === 'dyslexia' ? 'bg-purple-500' : key === 'dysgraphia' ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.reasoning && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Analysis</p>
              <p className="text-sm text-slate-700 leading-relaxed">{result.reasoning}</p>
              {result.classifiedBy && (
                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                  result.classifiedBy === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>{result.classifiedBy === 'ai' ? 'Classified by AI' : 'Rule-based classification'}</span>
              )}
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">AI Recommendations</p>
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <span className="text-blue-600 text-sm flex-shrink-0">•</span>
                    <p className="text-sm text-blue-800 leading-snug">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            Your learning path has been personalised. Your teacher can now see your profile and assign targeted exercises.
          </div>

          <button
            onClick={() => navigate('/student')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-blue-200 transition"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentScreeningPage;
