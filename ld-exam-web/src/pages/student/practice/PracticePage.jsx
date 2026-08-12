import React, { useState, useEffect } from 'react';
import { ldAPI } from '../../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { SpeakButton } from '../../../components/accessibility';
import useAuthStore from '../../../services/authStore';
import useSidebarStore from '../../../services/sidebarStore';
import { recordPractice } from '../../../services/progressStore';
import StudentSidebar from '../../../components/StudentSidebar';
import StudentHeader from '../../../components/StudentHeader';
import { isCategoryUnlocked } from '../../../data/subscriptionPlans';
import AboutIcon from '../../../components/AboutIcon';

import { supabase } from '../../../services/supabaseClient';

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
      { q: "Which word starts with the same sound as \"ship\"?", options: ["Shop", "Cat", "Fun", "Ball"], answer: "Shop", explanation: "\"Ship\" and \"Shop\" both start with the \"sh\" sound." },
      { q: "Which word rhymes with \"light\"?", options: ["Night", "Log", "Cup", "Run"], answer: "Night", explanation: "\"Light\" and \"Night\" both end in the \"-ight\" sound." },
      { q: "Which letters make the \"ch\" sound in \"chair\"?", options: ["ch", "sh", "th", "ph"], answer: "ch", explanation: "The letters \"ch\" make the sound at the start of \"chair\"." },
      { q: "Which word has a short \"a\" sound?", options: ["Cat", "Cake", "Car", "Coat"], answer: "Cat", explanation: "\"Cat\" has a short \"a\" sound like in \"hat\"." },
      { q: "Which word ends with the same sound as \"bell\"?", options: ["Fall", "Boat", "Sun", "Cup"], answer: "Fall", explanation: "\"Bell\" and \"Fall\" both end with the \"l\" sound." },
      { q: "Which word rhymes with \"cake\"?", options: ["Lake", "Cat", "Dog", "Sun"], answer: "Lake", explanation: "\"Cake\" and \"Lake\" both end in the \"-ake\" sound." },
      { q: "Which word starts with the same sound as \"thumb\"?", options: ["Think", "Table", "Sun", "Fan"], answer: "Think", explanation: "\"Thumb\" and \"Think\" both start with the \"th\" sound." },
      { q: "Which word has a long \"e\" sound?", options: ["Tree", "Ten", "Top", "Tap"], answer: "Tree", explanation: "\"Tree\" has a long \"e\" sound, like \"ee\"." },
      { q: "Which word rhymes with \"star\"?", options: ["Car", "Sit", "Run", "Dog"], answer: "Car", explanation: "\"Star\" and \"Car\" both end in the \"-ar\" sound." },
      { q: "Which letters make the \"sh\" sound?", options: ["sh", "ch", "th", "wh"], answer: "sh", explanation: "The letters \"sh\" make the sound in \"ship\"." },
      { q: "Which word begins with a \"b\" sound?", options: ["Ball", "Call", "Fall", "Tall"], answer: "Ball", explanation: "\"Ball\" starts with the \"b\" sound." },
      { q: "Which word rhymes with \"moon\"?", options: ["Spoon", "Man", "Sit", "Cup"], answer: "Spoon", explanation: "\"Moon\" and \"Spoon\" both end in \"-oon\"." },
      { q: "Which word has a short \"i\" sound?", options: ["Pig", "Pie", "Pine", "Pile"], answer: "Pig", explanation: "\"Pig\" has a short \"i\" sound." },
      { q: "Which word starts like \"whale\"?", options: ["Wheel", "Table", "Sun", "Cat"], answer: "Wheel", explanation: "\"Whale\" and \"Wheel\" both start with \"wh\"." },
      { q: "Which word rhymes with \"dog\"?", options: ["Log", "Cat", "Sun", "Pen"], answer: "Log", explanation: "\"Dog\" and \"Log\" both end in \"-og\"." },
      { q: "Which word has a long \"o\" sound?", options: ["Boat", "Box", "Bat", "Bug"], answer: "Boat", explanation: "\"Boat\" has a long \"o\" sound." },
      { q: "Which word starts with the \"f\" sound?", options: ["Fish", "Dish", "Wish", "Wash"], answer: "Fish", explanation: "\"Fish\" starts with the \"f\" sound." },
      { q: "Which word rhymes with \"hat\"?", options: ["Bat", "Bit", "But", "Bet"], answer: "Bat", explanation: "\"Hat\" and \"Bat\" both end in \"-at\"." },
    ],
  },
  {
    key: 'reading', icon: '📖', title: 'Reading', color: '#0f766e', bg: '#E1F5F0',
    description: 'Understand words, sentences and stories',
    questions: [
      { q: "Read: \"The cat sat on the mat.\" Where did the cat sit?", options: ["On the mat", "On the bed", "On the chair", "On the roof"], answer: "On the mat", explanation: "The sentence says \"sat on the mat\"." },
      { q: "Which word means the opposite of \"big\"?", options: ["Small", "Tall", "Fast", "Loud"], answer: "Small", explanation: "\"Small\" is the opposite of \"big\"." },
      { q: "\"She was happy.\" What did she feel?", options: ["Happy", "Sad", "Angry", "Tired"], answer: "Happy", explanation: "The sentence says \"she was happy\"." },
      { q: "Which of these is a complete sentence?", options: ["The dog ran fast.", "Running the dog", "Fast the dog", "Dog running"], answer: "The dog ran fast.", explanation: "A complete sentence has a subject and an action." },
      { q: "Which word comes first alphabetically?", options: ["Apple", "Banana", "Cherry", "Date"], answer: "Apple", explanation: "\"A\" comes before B, C, and D." },
      { q: "Which word means the opposite of \"hot\"?", options: ["Cold", "Warm", "Fast", "Big"], answer: "Cold", explanation: "\"Cold\" is the opposite of \"hot\"." },
      { q: "Read: \"Tom has a red ball.\" What color is the ball?", options: ["Red", "Blue", "Green", "Yellow"], answer: "Red", explanation: "The sentence says the ball is red." },
      { q: "Which word means \"a place to live\"?", options: ["House", "Car", "Tree", "Book"], answer: "House", explanation: "A house is a place where people live." },
      { q: "Which word is a naming word (noun)?", options: ["Table", "Run", "Jump", "Fast"], answer: "Table", explanation: "\"Table\" names a thing, so it is a noun." },
      { q: "Read: \"The sun is bright.\" What is bright?", options: ["The sun", "The moon", "The star", "The lamp"], answer: "The sun", explanation: "The sentence says the sun is bright." },
      { q: "Which word means the opposite of \"up\"?", options: ["Down", "Left", "Fast", "Big"], answer: "Down", explanation: "\"Down\" is the opposite of \"up\"." },
      { q: "Which word rhymes and means a color?", options: ["Blue", "Blow", "Blur", "Blot"], answer: "Blue", explanation: "\"Blue\" is a color." },
      { q: "Read: \"Ravi ate an apple.\" What did Ravi eat?", options: ["An apple", "A banana", "A mango", "An orange"], answer: "An apple", explanation: "The sentence says Ravi ate an apple." },
      { q: "Which word means \"very small\"?", options: ["Tiny", "Huge", "Tall", "Wide"], answer: "Tiny", explanation: "\"Tiny\" means very small." },
      { q: "Which is a question sentence?", options: ["What is your name?", "I am happy.", "The dog runs.", "She sat down."], answer: "What is your name?", explanation: "A question asks something and ends with \"?\"." },
      { q: "Which word means the opposite of \"day\"?", options: ["Night", "Noon", "Morning", "Sun"], answer: "Night", explanation: "\"Night\" is the opposite of \"day\"." },
      { q: "Read: \"The bird can fly.\" What can the bird do?", options: ["Fly", "Swim", "Run", "Jump"], answer: "Fly", explanation: "The sentence says the bird can fly." },
      { q: "Which word is a doing word (verb)?", options: ["Jump", "Chair", "Happy", "Blue"], answer: "Jump", explanation: "\"Jump\" is an action, so it is a verb." },
    ],
  },
  {
    key: 'writing', icon: '✍️', title: 'Writing', color: '#c2410c', bg: '#FCEADD',
    description: 'Spelling, grammar and letter formation',
    questions: [
      { q: "Which letter is written backwards: b, d, p, q, d?", options: ["b", "d", "p", "q"], answer: "d", explanation: "\"d\" appears twice \u2014 spot the repeated letter." },
      { q: "Pick the correctly spelled word.", options: ["Recieve", "Receive", "Receeve", "Receve"], answer: "Receive", explanation: "\"i before e except after c\" \u2014 Receive." },
      { q: "Which sentence starts with a capital letter correctly?", options: ["The sun is bright.", "the sun is bright.", "THE sun is bright.", "thE sun is bright."], answer: "The sun is bright.", explanation: "Only the first letter is capitalised." },
      { q: "What punctuation ends a question?", options: ["?", ".", "!", ","], answer: "?", explanation: "A question ends with a question mark." },
      { q: "Which word is plural?", options: ["Cats", "Cat", "Catty", "Cating"], answer: "Cats", explanation: "Adding \"s\" makes \"Cat\" plural." },
      { q: "Pick the correctly spelled word.", options: ["Freind", "Friend", "Frend", "Friynd"], answer: "Friend", explanation: "\"Friend\" is the correct spelling." },
      { q: "What punctuation ends a normal sentence?", options: [".", "?", "!", ";"], answer: ".", explanation: "A statement ends with a full stop." },
      { q: "Which word is spelled correctly?", options: ["Becuase", "Becouse", "Because", "Becaus"], answer: "Because", explanation: "\"Because\" is the correct spelling." },
      { q: "Which is the correct plural of \"box\"?", options: ["Boxes", "Boxs", "Boxen", "Box"], answer: "Boxes", explanation: "Words ending in \"x\" add \"es\": boxes." },
      { q: "Which sentence uses a capital \"I\" correctly?", options: ["I like to read.", "i like to read.", "I Like To Read.", "i Like to read."], answer: "I like to read.", explanation: "\"I\" is always capital; the rest are lowercase." },
      { q: "Pick the correctly spelled word.", options: ["Beutiful", "Beautiful", "Beautifull", "Butiful"], answer: "Beautiful", explanation: "\"Beautiful\" is the correct spelling." },
      { q: "What mark shows strong feeling or excitement?", options: ["!", ".", "?", ","], answer: "!", explanation: "An exclamation mark shows excitement." },
      { q: "Which word is spelled correctly?", options: ["Wich", "Which", "Whitch", "Witch"], answer: "Which", explanation: "\"Which\" is the correct spelling." },
      { q: "Which is the correct plural of \"baby\"?", options: ["Babies", "Babys", "Babyes", "Baby"], answer: "Babies", explanation: "Words ending in \"y\" become \"ies\": babies." },
      { q: "Pick the correctly spelled word.", options: ["Hapy", "Happy", "Happpy", "Hppy"], answer: "Happy", explanation: "\"Happy\" has two \"p\"s." },
      { q: "Which sentence is punctuated correctly?", options: ["I am tired.", "I am tired", "i am tired.", "I am tired?"], answer: "I am tired.", explanation: "It starts with a capital and ends with a full stop." },
      { q: "Which word is spelled correctly?", options: ["Tommorow", "Tomorrow", "Tomorow", "Tommorrow"], answer: "Tomorrow", explanation: "\"Tomorrow\" \u2014 one m, two r's." },
      { q: "What comes between two items in a list?", options: [",", ".", "?", "!"], answer: ",", explanation: "A comma separates items in a list." },
    ],
  },
  {
    key: 'math', icon: '➗', title: 'Math', color: '#16a34a', bg: '#E3F7E9',
    description: 'Numbers, counting and basic operations',
    questions: [
      { q: "What is 2 + 3?", options: ["5", "4", "6", "3"], answer: "5", explanation: "2 plus 3 equals 5." },
      { q: "What is 10 - 4?", options: ["6", "5", "7", "8"], answer: "6", explanation: "10 minus 4 equals 6." },
      { q: "Which number is bigger: 7 or 4?", options: ["7", "4", "Equal", "Cannot tell"], answer: "7", explanation: "7 is greater than 4." },
      { q: "What is 3 x 2?", options: ["6", "5", "8", "4"], answer: "6", explanation: "3 times 2 equals 6." },
      { q: "How many sides does a triangle have?", options: ["3", "4", "5", "2"], answer: "3", explanation: "A triangle has 3 sides." },
      { q: "What is half of 10?", options: ["5", "2", "10", "20"], answer: "5", explanation: "Half of 10 is 5." },
      { q: "What is 4 + 4?", options: ["8", "6", "7", "9"], answer: "8", explanation: "4 plus 4 equals 8." },
      { q: "What is 9 - 3?", options: ["6", "5", "7", "4"], answer: "6", explanation: "9 minus 3 equals 6." },
      { q: "Which number is smallest?", options: ["2", "5", "8", "3"], answer: "2", explanation: "2 is the smallest of these numbers." },
      { q: "What is 5 x 2?", options: ["10", "7", "12", "9"], answer: "10", explanation: "5 times 2 equals 10." },
      { q: "How many sides does a square have?", options: ["4", "3", "5", "6"], answer: "4", explanation: "A square has 4 equal sides." },
      { q: "What is 6 + 1?", options: ["7", "5", "8", "6"], answer: "7", explanation: "6 plus 1 equals 7." },
      { q: "What is 12 - 5?", options: ["7", "6", "8", "5"], answer: "7", explanation: "12 minus 5 equals 7." },
      { q: "What comes after 8?", options: ["9", "7", "10", "8"], answer: "9", explanation: "9 comes right after 8." },
      { q: "What is 2 x 4?", options: ["8", "6", "10", "4"], answer: "8", explanation: "2 times 4 equals 8." },
      { q: "Which is an even number?", options: ["6", "3", "5", "7"], answer: "6", explanation: "6 can be split into two equal halves." },
      { q: "What is 7 + 5?", options: ["12", "11", "13", "10"], answer: "12", explanation: "7 plus 5 equals 12." },
      { q: "How many minutes in one hour?", options: ["60", "30", "100", "24"], answer: "60", explanation: "There are 60 minutes in an hour." },
    ],
  },
];

const PracticePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const subscription = user?.subscription || 'advanced';
  const [practiceHistory, setPracticeHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const data = await ldAPI.practiceHistory();
      if (data?.sessions && data.sessions.length > 0) {
        setPracticeHistory(data.sessions);
        return;
      }
    } catch { /* fallback */ }

    try {
      const sEmail = user?.email?.toLowerCase();
      const { data: supaHistory } = await supabase.from('practice_sessions').select('*').order('created_at', { ascending: false });
      if (supaHistory && supaHistory.length > 0) {
        const filtered = supaHistory.filter(s => !sEmail || s.student_email === sEmail);
        setPracticeHistory(filtered.map(s => ({
          id: s.id,
          session_type: s.category,
          exercises_correct: Math.round((s.score_percent / 100) * 5),
          exercises_total: 5,
          created_at: s.created_at,
        })));
      }
    } catch { /* fallback */ }
  };

  // Fetch practice and test history
  useEffect(() => {
    fetchHistory();
  }, [user]);

  const [active, setActive] = useState(null);      // category key or null (category picker)
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [compliment, setCompliment] = useState('');
  // Shuffled questions for the CURRENT attempt. Reshuffled on every start so a
  // retake shows questions (and answer options) in a different order, not the
  // same sequence as last time.
  const [quizQuestions, setQuizQuestions] = useState([]);
  // True while we wait for the AI to generate fresh questions
  const [preparing, setPreparing] = useState(false);

  const category = CATEGORIES.find((c) => c.key === active);

  // Fisher–Yates shuffle (returns a new array, does not mutate the source)
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Build the local shuffled fallback set (used if AI is offline/slow/invalid)
  const buildFallback = (key) => {
    const cat = CATEGORIES.find((c) => c.key === key);
    // Pick a random 5 from the larger bank each time, and shuffle their options.
    // A big pool + random pick means retakes rarely repeat the same 5 questions.
    return shuffle(cat?.questions || [])
      .slice(0, 5)
      .map((q) => ({ ...q, options: shuffle(q.options) }));
  };

  const beginQuiz = (key, questions) => {
    setQuizQuestions(questions);
    setActive(key);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    window._practiceStartTime = Date.now();
  };

  const startCategory = async (key) => {
    if (!isCategoryUnlocked(subscription, key)) {
      navigate('/student/profile');
      return;
    }
    // Try AI-generated (grade/level aware, fresh every retake). Fall back to
    // the shuffled built-in questions if the AI is offline, slow, or invalid.
    setPreparing(true);
    try {
      const data = await ldAPI.practiceGenerate(key, 5);
      const aiQs = data?.questions;
      if (Array.isArray(aiQs) && aiQs.length) {
        // Shuffle AI options too, for good measure
        beginQuiz(key, aiQs.map((q) => ({ ...q, options: shuffle(q.options) })));
      } else {
        beginQuiz(key, buildFallback(key));
      }
    } catch {
      beginQuiz(key, buildFallback(key));
    } finally {
      setPreparing(false);
    }
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
    if (opt === quizQuestions[current].answer) {
      setScore((s) => s + 1);
      setCompliment(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
    }
  };

  // Save practice session to backend & Supabase when finished
  const savePracticeSession = (categoryKey, totalQuestions, correctCount) => {
    // Record locally for dashboard updates
    // Clamp correct count to the total so the percentage can never exceed 100%.
    const safeCorrect = Math.min(correctCount, totalQuestions);
    const scorePercent = totalQuestions > 0 ? Math.round((safeCorrect / totalQuestions) * 100) : 0;
    const durationSeconds = Math.round((Date.now() - (window._practiceStartTime || Date.now())) / 1000) || 60;
    recordPractice({
      category: categoryKey,
      score: scorePercent,
      durationMinutes: Math.round(durationSeconds / 60) || 1,
      exercises: totalQuestions,
    });
    ldAPI.practiceSubmit({
      category: categoryKey,
      exercises_total: totalQuestions,
      exercises_correct: safeCorrect,
    }).then(() => fetchHistory()).catch(() => {});

    // Save to Supabase Cloud DB practice_sessions table
    supabase.from('practice_sessions').upsert([{
      id: `ps-${Date.now()}`,
      student_id: user?.id || 'st-demo',
      student_email: user?.email?.toLowerCase() || 'guest@gmail.com',
      category: categoryKey,
      score_percent: scorePercent,
      time_taken_seconds: durationSeconds,
      created_at: new Date().toISOString(),
    }]).then(() => fetchHistory()).catch(() => {});
  };

  const next = () => {
    setCompliment('');
    if (current + 1 < quizQuestions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
      savePracticeSession(active, quizQuestions.length, score + (selected === quizQuestions[current].answer ? 1 : 0));
    }
  };

  return (
    <div className="sp-page" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
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

      {/* Preparing overlay — shown while the AI generates fresh questions */}
      {preparing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(248,250,252,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <div style={{ width: 48, height: 48, border: '5px solid #c7d2fe', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: '#4f46e5', margin: 0 }}>Preparing your questions… ✨</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}


      <StudentSidebar />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="sp-main" style={{ flex: 1, marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentHeader />

        {!category ? (
          <div className="sp-content sp-flexrow sp-scroll" style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                alignSelf: 'flex-start', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 16px', borderRadius: 10, border: 'none', boxShadow: '0 2px 6px rgba(79,70,229,0.25)', marginBottom: 16
              }}
            >
              ← Back
            </button>
            <h2 style={{ flexShrink: 0, fontSize: 24, fontWeight: 800, color: '#1e293b', margin: '0 0 6px', display: 'flex', alignItems: 'center' }}>
              ✨ Practice
              <AboutIcon
                title="About Practice"
                description="Practice your skills with quick 5-question sessions in different subjects."
                items={['Choose a skill category to start', 'Answer 5 questions per session', 'Track your progress in Practice History', 'Improve your scores over time']}
              />
            </h2>


            <div className="sp-grid-2 sp-flexrow" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>

              {/* ═══ LEFT: Skills, one by one ═══ */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', padding: 24 }}>
                <h3 style={{ flexShrink: 0, fontSize: 17, fontWeight: 700, color: '#334155', margin: '0 0 16px' }}>Choose a Skill</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                            position: 'absolute', bottom: 10, right: 10, fontSize: 13, fontWeight: 800,
                            color: unlocked ? '#fff' : '#64748b', background: unlocked ? c.color : '#fff',
                            padding: '8px 18px', borderRadius: 20, boxShadow: unlocked ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                          }}>
                            {unlocked ? 'Start' : '🔒 Locked'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ RIGHT: Practice History ═══ */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: 420, padding: 24 }}>
                <h3 style={{ flexShrink: 0, fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 12px' }}>🎯 Practice History</h3>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>

                    {practiceHistory.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No practice sessions yet. Pick a skill to start!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {practiceHistory.slice(0, 10).map((s, i) => {
                          const accuracy = s.exercises_total > 0 ? Math.round((s.exercises_correct / s.exercises_total) * 100) : 0;
                          const catInfo = CATEGORIES.find(c => c.key === s.session_type) || {};
                          const dateStr = (s.completed_at || s.created_at) ? new Date(s.completed_at || s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                          return (
                            <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 12 }}>
                              <span style={{ fontSize: 20 }}>{catInfo.icon || '🎯'}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{catInfo.title || s.session_type || 'Practice'}</p>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{dateStr}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 14, fontWeight: 800, color: accuracy >= 80 ? '#16a34a' : accuracy >= 50 ? '#d97706' : '#dc2626', margin: 0 }}>{accuracy}%</p>
                                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{s.exercises_correct}/{s.exercises_total}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                You scored <strong style={{ color: category.color }}>{score} / {quizQuestions.length}</strong> in {category.title}
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
                  {category.icon} {category.title} · Question {current + 1} of {quizQuestions.length}
                </span>
              </div>

              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 50, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', borderRadius: 50, background: category.color, width: `${((current + (selected !== null ? 1 : 0)) / quizQuestions.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 18px' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 }}>{quizQuestions[current].q}</p>
                <SpeakButton text={quizQuestions[current].q} size="sm" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizQuestions[current].options.map((opt) => {
                  const isCorrect = opt === quizQuestions[current].answer;
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
                  {selected === quizQuestions[current].answer ? (
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
                          Not quite — the correct answer is "{quizQuestions[current].answer}".
                        </p>
                        <p style={{ fontSize: 12, color: '#a16207', margin: '4px 0 0', lineHeight: 1.5 }}>
                          {quizQuestions[current].explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={next}
                    style={{ marginTop: 12, width: '100%', background: category.color, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                  >
                    {current + 1 === quizQuestions.length ? 'Finish' : 'Next Question →'}
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
