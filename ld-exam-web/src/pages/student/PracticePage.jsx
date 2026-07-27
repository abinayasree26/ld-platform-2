import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../services/authStore';
import useSidebarStore from '../../services/sidebarStore';
import StudentSidebar from '../../components/StudentSidebar';
import StudentHeader from '../../components/StudentHeader';
import { isCategoryUnlocked } from './subscriptionPlans';
import { RECOMMENDATIONS_BY_LD_TYPE } from './recommendationsData';

const card = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

const COMPLIMENTS = [
  'Great job! 🎉', 'Nice work! 👏', "You've got it! ⭐", 'Correct — well done! 💪', 'Awesome! Keep it up! 🌟',
];

// Illustrated skill-card icons — one per Practice category, matching each
// category's accent colour so the picker reads as a set rather than random clipart.
const PhonicsIcon = ({ color }) => (
  <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
    <text x="30" y="66" fontSize="38" fontWeight="700" fill={color} opacity="0.45" fontFamily="Georgia, serif">s</text>
    <circle cx="58" cy="44" r="18" stroke={color} strokeWidth="5" fill="#fff" fillOpacity="0.6" />
    <line x1="71" y1="57" x2="83" y2="69" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </svg>
);
const ReadingIcon = ({ color }) => (
  <svg width="82" height="66" viewBox="0 0 120 90" fill="none">
    <path d="M60 20 C50 12 30 10 14 14 V70 C30 66 50 68 60 76 C70 68 90 66 106 70 V14 C90 10 70 12 60 20 Z" stroke={color} strokeWidth="4" fill="#fff" fillOpacity="0.55" strokeLinejoin="round" />
    <line x1="60" y1="20" x2="60" y2="76" stroke={color} strokeWidth="3" />
    <line x1="24" y1="28" x2="46" y2="26" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <line x1="24" y1="38" x2="46" y2="36" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <line x1="74" y1="26" x2="96" y2="28" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <line x1="74" y1="36" x2="96" y2="38" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
  </svg>
);
const WritingIcon = ({ color }) => (
  <svg width="86" height="70" viewBox="0 0 120 100" fill="none">
    <path d="M8 58 Q 24 38 40 58 T 72 58" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
    <g transform="translate(80,26) rotate(45)">
      <rect x="-6" y="0" width="12" height="34" rx="3" fill={color} />
      <polygon points="-6,34 6,34 0,44" fill={color} />
      <rect x="-6" y="-7" width="12" height="8" rx="2" fill="#fbbf24" />
    </g>
  </svg>
);
const MathIcon = ({ color }) => (
  <svg width="86" height="70" viewBox="0 0 120 100" fill="none">
    <rect x="8" y="55" width="18" height="30" rx="3" fill={color} opacity="0.5" />
    <rect x="34" y="40" width="18" height="45" rx="3" fill={color} opacity="0.68" />
    <rect x="60" y="25" width="18" height="60" rx="3" fill={color} />
    <rect x="86" y="48" width="18" height="37" rx="3" fill={color} opacity="0.84" />
    <text x="17" y="98" fontSize="12" fontWeight="700" fill={color} textAnchor="middle">2</text>
    <text x="43" y="98" fontSize="12" fontWeight="700" fill={color} textAnchor="middle">5</text>
    <text x="69" y="98" fontSize="12" fontWeight="700" fill={color} textAnchor="middle">7</text>
    <text x="95" y="98" fontSize="12" fontWeight="700" fill={color} textAnchor="middle">4</text>
  </svg>
);
const CATEGORY_ICONS = { phonics: PhonicsIcon, reading: ReadingIcon, writing: WritingIcon, math: MathIcon };

const CATEGORIES = [
  {
    key: 'phonics', icon: '🔤', title: 'Phonics', color: '#4f46e5', bg: '#EAEAFE',
    description: 'Match sounds to letters and words',
    questions: [
      { q: 'Which word starts with the same sound as "ship"?', options: ['Shop', 'Cat', 'Fun', 'Ball'], answer: 'Shop', explanation: '"Ship" and "Shop" both start with the "sh" sound.' },
      { q: 'Which word rhymes with "light"?', options: ['Night', 'Log', 'Cup', 'Run'], answer: 'Night', explanation: '"Light" and "Night" both end in the "-ight" sound.' },
      { q: 'Which letters make the "ch" sound in "chair"?', options: ['ch', 'sh', 'th', 'ph'], answer: 'ch', explanation: 'The letters "ch" together make the sound heard at the start of "chair".' },
      { q: 'Which word has a short "a" sound?', options: ['Cat', 'Cake', 'Car', 'Coat'], answer: 'Cat', explanation: '"Cat" has a short "a" sound, like in "hat". "Cake" and "Car" sound different.' },
      { q: 'Which word ends with the same sound as "bell"?', options: ['Fall', 'Boat', 'Sun', 'Cup'], answer: 'Fall', explanation: '"Bell" and "Fall" both end with the "l" sound.' },
    ],
  },
  {
    key: 'reading', icon: '📖', title: 'Reading', color: '#0f766e', bg: '#E1F5F0',
    description: 'Understand words, sentences and stories',
    questions: [
      { q: 'Read: "The cat sat on the mat." Where did the cat sit?', options: ['On the mat', 'On the bed', 'On the chair', 'On the roof'], answer: 'On the mat', explanation: 'The sentence says "sat on the mat" — so the cat sat on the mat.' },
      { q: 'Which word means the opposite of "big"?', options: ['Small', 'Tall', 'Fast', 'Loud'], answer: 'Small', explanation: '"Small" is the opposite of "big". "Tall", "fast", and "loud" mean something different.' },
      { q: '"She was happy." What did she feel?', options: ['Happy', 'Sad', 'Angry', 'Tired'], answer: 'Happy', explanation: 'The sentence tells us directly: "she was happy".' },
      { q: 'Which of these is a complete sentence?', options: ['The dog ran fast.', 'Running the dog', 'Fast the dog', 'Dog running'], answer: 'The dog ran fast.', explanation: 'A complete sentence needs a subject ("The dog") and an action ("ran fast").' },
      { q: 'Which word comes first alphabetically?', options: ['Apple', 'Banana', 'Cherry', 'Date'], answer: 'Apple', explanation: '"A" comes before "B", "C", and "D" in the alphabet, so "Apple" is first.' },
    ],
  },
  {
    key: 'writing', icon: '✍️', title: 'Writing', color: '#c2410c', bg: '#FCEADD',
    description: 'Spelling, grammar and letter formation',
    questions: [
      { q: 'Which letter is written backwards: b, d, p, q, d?', options: ['b', 'd', 'p', 'q'], answer: 'd', explanation: '"d" appears twice — the second one is the reversed/repeated letter to spot.' },
      { q: 'Pick the correctly spelled word.', options: ['Recieve', 'Receive', 'Receeve', 'Receve'], answer: 'Receive', explanation: 'Remember the rule "i before e except after c" — so it\'s "Receive".' },
      { q: 'Which sentence starts with a capital letter correctly?', options: ['The sun is bright.', 'the sun is bright.', 'THE sun is bright.', 'thE sun is bright.'], answer: 'The sun is bright.', explanation: 'Only the first letter of a sentence should be capitalised: "The sun is bright."' },
      { q: 'What punctuation ends a question?', options: ['?', '.', '!', ','], answer: '?', explanation: 'A question mark "?" is used to end a question.' },
      { q: 'Which word is plural?', options: ['Cats', 'Cat', 'Catty', 'Cating'], answer: 'Cats', explanation: 'Adding "s" to "Cat" makes it plural: "Cats" means more than one.' },
    ],
  },
  {
    key: 'math', icon: '➗', title: 'Math', color: '#16a34a', bg: '#E3F7E9',
    description: 'Numbers, counting and basic operations',
    questions: [
      { q: 'What is 7 + 5?', options: ['11', '12', '13', '10'], answer: '12', explanation: '7 + 5 = 12. Try counting up from 7: 8, 9, 10, 11, 12.' },
      { q: 'Which number is bigger: 342 or 423?', options: ['342', '423', 'Equal', "Can't tell"], answer: '423', explanation: 'Compare the hundreds digit first: 4 (in 423) is bigger than 3 (in 342).' },
      { q: 'What is 9 - 4?', options: ['4', '5', '6', '13'], answer: '5', explanation: '9 - 4 = 5. Counting down from 9 by 4 lands on 5.' },
      { q: 'Which shape has 3 sides?', options: ['Triangle', 'Square', 'Circle', 'Pentagon'], answer: 'Triangle', explanation: 'A triangle has exactly 3 sides — "tri" means three.' },
      { q: 'What is half of 10?', options: ['5', '2', '10', '20'], answer: '5', explanation: 'Half means dividing by 2, and 10 ÷ 2 = 5.' },
    ],
  },
];

const PracticePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const subscription = user?.subscription || 'advanced';
  const ldType = user?.ld_type || 'dyslexia';
  const relatedRecs = RECOMMENDATIONS_BY_LD_TYPE[ldType] || RECOMMENDATIONS_BY_LD_TYPE.not_detected;

  const [active, setActive] = useState(null);      // category key or null (category picker)
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [compliment, setCompliment] = useState('');

  const category = CATEGORIES.find((c) => c.key === active);

  const startCategory = (key) => {
    if (!isCategoryUnlocked(subscription, key)) {
      navigate('/student/profile');
      return;
    }
    setActive(key);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  // Deep-link support: Recommendations page can send { state: { category } }
  // to jump straight into a skill instead of landing on the picker.
  useEffect(() => {
    const deepLinkCategory = location.state?.category;
    if (deepLinkCategory && CATEGORIES.some((c) => c.key === deepLinkCategory)) {
      startCategory(deepLinkCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const backToCategories = () => setActive(null);

  const answer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === category.questions[current].answer) {
      setScore((s) => s + 1);
      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
    }
  };

  const next = () => {
    setCompliment('');
    if (current + 1 < category.questions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pop-bounce {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.3) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes confetti-burst {
          0%   { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-38px) scale(1.1) rotate(var(--rot, 45deg)); opacity: 0; }
        }
        @keyframes shake-x {
          0%, 100% { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
        }
        .pp-confetti-wrap { position: relative; display: inline-block; }
        .pp-confetti-wrap span.pp-particle {
          position: absolute; top: 6px; left: 50%; font-size: 14px;
          animation: confetti-burst 0.8s ease-out forwards;
        }
      `}</style>

      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        {!category ? (
          <div className="sp-content sp-flexrow" style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                flexShrink: 0, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                background: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', padding: '8px 16px', borderRadius: 10, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              Back
            </button>
            <h2 style={{ flexShrink: 0, fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>✨ Practice</h2>
            <p style={{ flexShrink: 0, fontSize: 14, color: '#94a3b8', margin: '0 0 24px' }}>Pick a skill to practice — 5 quick questions each.</p>

            <div className="sp-grid-2 sp-flexrow" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>

              {/* ═══ LEFT: Skills, one by one ═══ */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 24 }}>
                <h3 style={{ flexShrink: 0, fontSize: 17, fontWeight: 700, color: '#334155', margin: '0 0 16px' }}>Choose a Skill</h3>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {CATEGORIES.map((c) => {
                    const unlocked = isCategoryUnlocked(subscription, c.key);
                    const Icon = CATEGORY_ICONS[c.key];
                    return (
                      <button
                        key={c.key}
                        onClick={() => startCategory(c.key)}
                        style={{
                          display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer',
                          border: `1.5px solid ${c.color}33`, borderRadius: 18, overflow: 'hidden',
                          background: '#fff', opacity: unlocked ? 1 : 0.7, padding: 0, minHeight: 168,
                        }}
                      >
                        <div style={{ padding: '12px 14px 6px' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: c.color, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            {c.icon} {c.title}
                          </span>
                          <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: '3px 0 0' }}>{c.description}</p>
                        </div>
                        <div style={{ flex: 1, minHeight: 92, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <Icon color={c.color} />
                          <span style={{
                            position: 'absolute', bottom: 8, right: 10, fontSize: 10.5, fontWeight: 800,
                            color: unlocked ? '#fff' : '#64748b', background: unlocked ? c.color : '#fff',
                            padding: '4px 10px', borderRadius: 20,
                          }}>
                            {unlocked ? 'Start' : '🔒 Locked'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ RIGHT: Related recommendations ═══ */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 24 }}>
                <h3 style={{ flexShrink: 0, fontSize: 17, fontWeight: 700, color: '#334155', margin: '0 0 2px' }}>⭐ Recommended for You</h3>
                <p style={{ flexShrink: 0, fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>Based on your learning profile.</p>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {relatedRecs.map((rec) => (
                    <div key={rec.title} style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{rec.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{rec.title}</p>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 10px', lineHeight: 1.5 }}>{rec.tip}</p>
                        </div>
                      </div>
                      {rec.key && (
                        <button
                          onClick={() => startCategory(rec.key)}
                          style={{ width: '100%', fontSize: 12, fontWeight: 800, color: '#fff', background: '#4f46e5', padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer' }}
                        >
                          Start Practice
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
        <div className="sp-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 700 }}>
          {finished ? (
            <div style={{ ...card, textAlign: 'center', padding: 36 }}>
              <span style={{ fontSize: 48 }}>{score >= 4 ? '🎉' : score >= 3 ? '👍' : '💪'}</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '12px 0 4px' }}>Practice Complete!</h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>
                You scored <strong style={{ color: category.color }}>{score} / {category.questions.length}</strong> in {category.title}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => startCategory(active)}
                  style={{ background: category.color, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                >
                  Practice Again
                </button>
                <button
                  onClick={backToCategories}
                  style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                >
                  Choose Another Skill
                </button>
              </div>
            </div>
          ) : (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button onClick={backToCategories} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>← Back</button>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {category.icon} {category.title} · Question {current + 1} of {category.questions.length}
                </span>
              </div>

              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 50, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', borderRadius: 50, background: category.color, width: `${((current + (selected !== null ? 1 : 0)) / category.questions.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>

              <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 18px' }}>{category.questions[current].q}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {category.questions[current].options.map((opt) => {
                  const isCorrect = opt === category.questions[current].answer;
                  const isSelected = opt === selected;
                  let bg = '#fff', border = '#e2e8f0', color = '#334155';
                  if (selected !== null) {
                    if (isCorrect) { bg = '#dcfce7'; border = '#86efac'; color = '#166534'; }
                    else if (isSelected) { bg = '#fee2e2'; border = '#fca5a5'; color = '#991b1b'; }
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => answer(opt)}
                      disabled={selected !== null}
                      style={{
                        textAlign: 'left', padding: '12px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                        background: bg, border: `2px solid ${border}`, color, cursor: selected === null ? 'pointer' : 'default',
                      }}
                    >
                      {opt}
                      {selected !== null && isCorrect && ' ✓'}
                      {selected !== null && isSelected && !isCorrect && ' ✕'}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <>
                  {selected === category.questions[current].answer ? (
                    <div style={{ marginTop: 16, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="pp-confetti-wrap">
                        <span style={{ fontSize: 20, display: 'inline-block', animation: 'pop-bounce 0.5s ease-out' }}>🎉</span>
                        <span className="pp-particle" style={{ '--rot': '-35deg', left: '10%', animationDelay: '0.05s' }}>✨</span>
                        <span className="pp-particle" style={{ '--rot': '20deg', left: '80%', animationDelay: '0.1s' }}>🎊</span>
                        <span className="pp-particle" style={{ '--rot': '50deg', left: '45%', animationDelay: '0.15s' }}>⭐</span>
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: 0 }}>{compliment}</p>
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, display: 'inline-block', animation: 'shake-x 0.5s ease-out' }}>💡</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
                          Not quite — the correct answer is "{category.questions[current].answer}".
                        </p>
                        <p style={{ fontSize: 12, color: '#a16207', margin: '4px 0 0', lineHeight: 1.5 }}>
                          {category.questions[current].explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={next}
                    style={{ marginTop: 12, width: '100%', background: category.color, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    {current + 1 === category.questions.length ? 'Finish' : 'Next Question →'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default PracticePage;
