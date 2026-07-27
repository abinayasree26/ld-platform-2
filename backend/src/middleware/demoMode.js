/**
 * Demo Mode Middleware
 * When DEMO_MODE is active, intercepts API calls and returns mock data
 * so the full app can be tested without any database or external services.
 */
const { v4: uuid } = require('uuid');
const env = require('../config/env');
const screeningQuestions = require('../data/screeningQuestions');

if (!env.demoMode) {
  // Not in demo mode — export a no-op pass-through
  module.exports = { demoAuth: null, demoScreening: null, demoPractice: null };
  return;
}

// Use the real 30-question progressive bank (with IDs added)
const DEMO_QUESTIONS = screeningQuestions.map((q, i) => ({ ...q, id: `q-${i + 1}` }));

// In-memory session store for demo
const demoSessions = {};

// ─── Demo Auth Router ──────────────────────────────────────────────
const express = require('express');
const jwt = require('jsonwebtoken');

const demoAuth = express.Router();

// Demo login — accepts any credentials, returns a valid JWT
demoAuth.post('/login', (req, res) => {
  const { email, password } = req.body;
  const role = email?.includes('teacher') ? 'teacher'
    : email?.includes('parent') ? 'parent'
    : email?.includes('admin') ? 'school_admin'
    : 'student';

  const user = {
    id: uuid(),
    email: email || 'demo@ldschools.in',
    name: role === 'student' ? 'Demo Student' : `Demo ${role}`,
    role,
    school_id: 'demo-school',
  };
  const token = jwt.sign(user, env.jwt.secret, { expiresIn: '7d' });
  res.json({ token, user });
});

// Demo role-based login
demoAuth.post('/demo', (req, res) => {
  const { role } = req.body;
  const validRoles = ['student', 'teacher', 'parent', 'school_admin', 'super_admin'];
  const userRole = validRoles.includes(role) ? role : 'student';

  const user = {
    id: uuid(),
    email: `${userRole}@demo.ldschools.in`,
    name: `Demo ${userRole.replace('_', ' ')}`,
    role: userRole,
    school_id: 'demo-school',
  };
  const token = jwt.sign(user, env.jwt.secret, { expiresIn: '7d' });
  res.json({ token, user });
});

demoAuth.post('/register', (req, res) => {
  const { email, name, role } = req.body;
  const user = { id: uuid(), email: email || 'new@demo.in', name: name || 'New User', role: role || 'student' };
  const token = jwt.sign(user, env.jwt.secret, { expiresIn: '7d' });
  res.json({ token, user, message: 'Demo registration successful' });
});

// Admin credentials login (username/password) — demo accepts anything
demoAuth.post('/credentials', (req, res) => {
  const { username } = req.body;
  const user = {
    id: uuid(),
    name: username || 'Admin',
    role: 'admin',
    school_id: 'demo-school',
  };
  const token = jwt.sign(user, env.jwt.secret, { expiresIn: '7d' });
  res.json({ token, user });
});

demoAuth.post('/logout', (_req, res) => res.json({ message: 'Logged out' }));
demoAuth.get('/me', (req, res) => res.json(req.user || { role: 'student', name: 'Demo' }));

// ─── Demo Screening Router ─────────────────────────────────────────
const demoScreening = express.Router();

demoScreening.get('/questions', (_req, res) => {
  res.json({ questions: DEMO_QUESTIONS, total: DEMO_QUESTIONS.length, estimatedMinutes: 10, progressive: true, levels: 5, questionsPerLevel: 6 });
});

demoScreening.post('/start', (req, res) => {
  const sessionId = uuid();
  demoSessions[sessionId] = { answers: [], startedAt: Date.now() };
  res.status(201).json({ sessionId, resumed: false, message: 'Demo screening session started' });
});

demoScreening.post('/answer', (req, res) => {
  const { sessionId, questionId, answer, timeSpentMs } = req.body;
  const session = demoSessions[sessionId] || { answers: [] };
  const question = DEMO_QUESTIONS.find(q => q.id === questionId) || {};
  const isCorrect = answer === question.correct_answer;

  session.answers.push({ questionId, answer, isCorrect, category: question.category, level: question.level, ld_target: question.ld_target, timeSpentMs });
  demoSessions[sessionId] = session;

  res.json({ isCorrect, questionId, level: question.level });
});

demoScreening.post('/complete', (req, res) => {
  const { sessionId } = req.body;
  const session = demoSessions[sessionId] || { answers: [] };
  const answers = session.answers;

  // Progressive evaluation — find the level where student fails
  const levels = {};
  answers.forEach(a => {
    if (!levels[a.level]) levels[a.level] = [];
    levels[a.level].push(a);
  });

  let ldLevel = null;
  const levelResults = {};
  for (let lvl = 1; lvl <= 5; lvl++) {
    const la = levels[lvl] || [];
    if (la.length === 0) break;
    const correct = la.filter(a => a.isCorrect).length;
    const score = Math.round((correct / la.length) * 100);
    const passed = correct / la.length >= 0.70;
    levelResults[lvl] = { level: lvl, correct, total: la.length, score, passed };
    if (!passed && ldLevel === null) ldLevel = lvl;
  }

  // Analyze failed level categories
  const failedAnswers = levels[ldLevel] || [];
  const catErrors = { dyslexia: { wrong: 0, total: 0 }, dyscalculia: { wrong: 0, total: 0 }, dysgraphia: { wrong: 0, total: 0 } };
  failedAnswers.forEach(a => {
    const t = a.ld_target || 'dyslexia';
    if (catErrors[t]) { catErrors[t].total++; if (!a.isCorrect) catErrors[t].wrong++; }
  });

  const breakdown = {};
  let maxScore = 0, maxType = 'dyslexia';
  Object.entries(catErrors).forEach(([type, data]) => {
    const rate = data.total > 0 ? Math.round((data.wrong / data.total) * 100) : 0;
    breakdown[type] = rate;
    if (rate > maxScore) { maxScore = rate; maxType = type; }
  });

  const highCats = Object.entries(breakdown).filter(([_, v]) => v >= 50);
  const ldType = !ldLevel ? 'not_detected' : highCats.length >= 2 ? 'mixed' : maxScore >= 30 ? maxType : 'not_detected';
  const riskScore = ldLevel ? Math.min(100, Math.round((Math.max(0, 120 - ldLevel * 20) + maxScore) / 2)) : 10;

  const recs = ldLevel
    ? [`You reached Level ${ldLevel}! Let's master it with practice. 💪`, `Focus on ${ldType} exercises at Level ${ldLevel}`, 'Practice 15 minutes daily!', `Re-screen in 3 months to advance to Level ${ldLevel + 1}`]
    : ['Excellent! You passed all 5 levels! 🎉', 'No difficulties detected.', 'Keep challenging yourself!'];

  delete demoSessions[sessionId];
  res.json({ sessionId, ldLevel, ldType, riskScore, breakdown, levelResults, recommendations: recs });
});

demoScreening.get('/result/:sessionId', (req, res) => {
  res.json({
    ldType: 'dyslexia', riskScore: 62,
    breakdown: { dyslexia: 62, dyscalculia: 20, dysgraphia: 15 },
    recommendations: ['Focus on letter recognition exercises', 'Practice phonics daily', 'Re-screen in 3 months'],
  });
});

demoScreening.get('/history', (_req, res) => {
  res.json({
    sessions: [
      { id: uuid(), ld_type_detected: 'dyslexia', risk_score: 62, status: 'completed', completed_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: uuid(), ld_type_detected: 'not_detected', risk_score: 22, status: 'completed', completed_at: new Date(Date.now() - 604800000).toISOString(), created_at: new Date(Date.now() - 604800000).toISOString() },
    ],
  });
});

// ─── Demo Practice Router ──────────────────────────────────────────
const demoPractice = express.Router();

// 20 AI-recommended exercises per session — personalized based on student's LD type
// Distribution: 40% current level, 30% review (weak areas), 20% reinforcement, 10% challenge
function generatePracticeExercises(ldType, level) {
  const exercises = [];
  const currentLevel = level || 2;

  // ─── Dyslexia exercises ──────────────────────────────────────────
  const dyslexiaExercises = [
    { type: 'letter_recognition', level: 1, title: 'Letter b or d?', instructions: 'Which letter is shown?', content: { target: 'b', choices: ['b', 'd', 'p', 'q'] }, ld_target: 'dyslexia' },
    { type: 'letter_recognition', level: 1, title: 'Find letter p', instructions: 'Point to the letter p', content: { target: 'p', choices: ['b', 'd', 'p', 'q'] }, ld_target: 'dyslexia' },
    { type: 'phonics', level: 1, title: 'Sound /b/', instructions: 'Which letter makes the /b/ sound?', content: { target: 'b', choices: ['b', 'd', 'g', 'p'] }, ld_target: 'dyslexia' },
    { type: 'phonics', level: 2, title: 'Sound /sh/', instructions: 'Which letters make the /sh/ sound?', content: { target: 'sh', choices: ['sh', 'ch', 'th', 'ph'] }, ld_target: 'dyslexia' },
    { type: 'rhyme_detection', level: 2, title: 'Rhyme with "cat"', instructions: 'Which word rhymes with "cat"?', content: { target: 'bat', choices: ['bat', 'dog', 'pen', 'cup'] }, ld_target: 'dyslexia' },
    { type: 'rhyme_detection', level: 2, title: 'Rhyme with "sun"', instructions: 'Which word rhymes with "sun"?', content: { target: 'fun', choices: ['fan', 'fun', 'fin', 'run'] }, ld_target: 'dyslexia' },
    { type: 'phoneme_blending', level: 3, title: 'Blend /d/ /o/ /g/', instructions: 'What word do these sounds make: /d/ /o/ /g/?', content: { target: 'dog', choices: ['dog', 'dig', 'dug', 'fog'] }, ld_target: 'dyslexia' },
    { type: 'phoneme_blending', level: 3, title: 'Blend /s/ /i/ /t/', instructions: 'Blend these sounds: /s/ /i/ /t/', content: { target: 'sit', choices: ['sit', 'set', 'sat', 'sip'] }, ld_target: 'dyslexia' },
    { type: 'word_building', level: 3, title: 'Missing letter: _at', instructions: 'Fill in: _at (a furry pet)', content: { target: 'c', choices: ['c', 'b', 'h', 'r'] }, ld_target: 'dyslexia' },
    { type: 'reading', level: 4, title: 'Read & answer', instructions: '"Ravi has a red ball." What colour is the ball?', content: { target: 'red', choices: ['blue', 'red', 'green', 'yellow'] }, ld_target: 'dyslexia' },
    { type: 'reading', level: 4, title: 'Opposite word', instructions: 'What is the opposite of "big"?', content: { target: 'small', choices: ['tall', 'small', 'wide', 'large'] }, ld_target: 'dyslexia' },
    { type: 'reading', level: 5, title: 'Odd one out', instructions: 'Which word does NOT belong: cat, bat, hat, dog?', content: { target: 'dog', choices: ['cat', 'bat', 'hat', 'dog'] }, ld_target: 'dyslexia' },
  ];

  // ─── Dyscalculia exercises ───────────────────────────────────────
  const dyscalculiaExercises = [
    { type: 'counting', level: 1, title: 'Count stars', instructions: 'Count: ⭐⭐⭐⭐', content: { target: '4', choices: ['3', '4', '5', '6'] }, ld_target: 'dyscalculia' },
    { type: 'number_sense', level: 1, title: 'Which is 6?', instructions: 'Which number is 6?', content: { target: '6', choices: ['6', '9', '8', '0'] }, ld_target: 'dyscalculia' },
    { type: 'number_sense', level: 2, title: 'Bigger number', instructions: 'Which number is bigger: 7 or 4?', content: { target: '7', choices: ['7', '4', 'Same', "Don't know"] }, ld_target: 'dyscalculia' },
    { type: 'counting', level: 2, title: 'What comes after?', instructions: 'What comes after 8?', content: { target: '9', choices: ['7', '8', '9', '10'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 3, title: '4 + 5', instructions: 'What is 4 + 5?', content: { target: '9', choices: ['7', '8', '9', '10'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 3, title: '8 - 3', instructions: 'What is 8 - 3?', content: { target: '5', choices: ['4', '5', '6', '11'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 3, title: '6 + 7', instructions: 'What is 6 + 7?', content: { target: '13', choices: ['11', '12', '13', '14'] }, ld_target: 'dyscalculia' },
    { type: 'patterns', level: 4, title: 'Pattern: 3,6,9...', instructions: 'What comes next: 3, 6, 9, ___?', content: { target: '12', choices: ['10', '11', '12', '15'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 4, title: 'Word problem', instructions: 'Priya has 12 mangoes. She ate 4. How many left?', content: { target: '8', choices: ['6', '7', '8', '16'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 5, title: '23 + 19', instructions: 'What is 23 + 19?', content: { target: '42', choices: ['32', '42', '41', '52'] }, ld_target: 'dyscalculia' },
    { type: 'arithmetic', level: 5, title: 'Money problem', instructions: 'A pen costs ₹15 and a book costs ₹25. Total?', content: { target: '₹40', choices: ['₹30', '₹35', '₹40', '₹45'] }, ld_target: 'dyscalculia' },
  ];

  // ─── Dysgraphia exercises ────────────────────────────────────────
  const dysgraphiaExercises = [
    { type: 'sequencing', level: 1, title: 'After A?', instructions: 'Which letter comes after A?', content: { target: 'B', choices: ['B', 'C', 'D', 'A'] }, ld_target: 'dysgraphia' },
    { type: 'sequencing', level: 2, title: 'Order: C, A, B', instructions: 'Put in correct order:', content: { target: 'A, B, C', choices: ['A, B, C', 'C, A, B', 'B, C, A', 'A, C, B'] }, ld_target: 'dysgraphia' },
    { type: 'writing', level: 2, title: 'Correct spelling', instructions: 'Which is spelled correctly?', content: { target: 'dog', choices: ['dog', 'dgo', 'odg', 'gdo'] }, ld_target: 'dysgraphia' },
    { type: 'writing', level: 3, title: 'Fill in: h_t', instructions: 'Complete the word: h_t (you wear it on your head)', content: { target: 'a', choices: ['a', 'o', 'i', 'u'] }, ld_target: 'dysgraphia' },
    { type: 'sequencing', level: 3, title: 'Days order', instructions: 'Which comes after Monday?', content: { target: 'Tuesday', choices: ['Sunday', 'Tuesday', 'Wednesday', 'Saturday'] }, ld_target: 'dysgraphia' },
    { type: 'writing', level: 4, title: 'Unscramble: "t-a-c"', instructions: 'Unscramble these letters: t-a-c', content: { target: 'cat', choices: ['cat', 'act', 'tac', 'cta'] }, ld_target: 'dysgraphia' },
    { type: 'writing', level: 4, title: 'Correct sentence', instructions: 'Which sentence is correct?', content: { target: 'She goes to school.', choices: ['She go to school.', 'She goes to school.', 'She going school.', 'Her goes to school.'] }, ld_target: 'dysgraphia' },
    { type: 'writing', level: 5, title: 'Grammar fill', instructions: '"The children ___ playing in the park."', content: { target: 'are', choices: ['is', 'are', 'was', 'am'] }, ld_target: 'dysgraphia' },
  ];

  // ─── AI-recommended selection: pick 20 based on LD type ──────────
  let pool = [];
  if (ldType === 'dyslexia') {
    pool = [...dyslexiaExercises, ...dyslexiaExercises.slice(0, 5), ...dyscalculiaExercises.slice(0, 3), ...dysgraphiaExercises.slice(0, 2)];
  } else if (ldType === 'dyscalculia') {
    pool = [...dyscalculiaExercises, ...dyscalculiaExercises.slice(0, 5), ...dyslexiaExercises.slice(0, 3), ...dysgraphiaExercises.slice(0, 2)];
  } else if (ldType === 'dysgraphia') {
    pool = [...dysgraphiaExercises, ...dysgraphiaExercises.slice(0, 5), ...dyslexiaExercises.slice(0, 3), ...dyscalculiaExercises.slice(0, 4)];
  } else if (ldType === 'mixed') {
    pool = [...dyslexiaExercises.slice(0, 7), ...dyscalculiaExercises.slice(0, 7), ...dysgraphiaExercises.slice(0, 6)];
  } else {
    // Not detected or general — balanced mix
    pool = [...dyslexiaExercises.slice(0, 7), ...dyscalculiaExercises.slice(0, 7), ...dysgraphiaExercises.slice(0, 6)];
  }

  // Prioritize current level (40%), review below (20%), challenge above (10%), rest random
  const atLevel = pool.filter(e => e.level === currentLevel);
  const below = pool.filter(e => e.level < currentLevel);
  const above = pool.filter(e => e.level > currentLevel);
  const other = pool.filter(e => e.level === currentLevel);

  // Build final 20
  const selected = [];
  const pick = (arr, n) => { const shuffled = [...arr].sort(() => Math.random() - 0.5); return shuffled.slice(0, n); };
  selected.push(...pick(atLevel, 8));   // 40% current level
  selected.push(...pick(below, 4));     // 20% reinforcement
  selected.push(...pick(above, 2));     // 10% challenge
  selected.push(...pick(pool, 6));      // 30% fill from pool

  // Deduplicate and ensure exactly 20
  const seen = new Set();
  const final = [];
  for (const ex of selected) {
    const key = ex.title + ex.level;
    if (!seen.has(key) && final.length < 20) {
      seen.add(key);
      final.push({ ...ex, id: uuid() });
    }
  }
  // Fill if less than 20
  for (const ex of pool.sort(() => Math.random() - 0.5)) {
    const key = ex.title + ex.level;
    if (!seen.has(key) && final.length < 20) {
      seen.add(key);
      final.push({ ...ex, id: uuid() });
    }
  }

  return final.slice(0, 20);
}

demoPractice.get('/start', (req, res) => {
  // AI-recommended: pick exercises based on student's LD type and level
  const ldType = req.query.ldType || req.user?.ldType || 'mixed';
  const level = parseInt(req.query.level) || 2;
  const exercises = generatePracticeExercises(ldType, level);

  res.json({
    sessionId: uuid(),
    exercises,
    totalExercises: exercises.length,
    currentLevel: level,
    estimatedMinutes: 15,
    aiRecommended: true,
    message: `AI selected ${exercises.length} exercises for ${ldType} at Level ${level}`,
  });
});

demoPractice.get('/next-exercise', (req, res) => {
  const ldType = req.query.ldType || 'mixed';
  const level = parseInt(req.query.level) || 2;
  const exercises = generatePracticeExercises(ldType, level);
  res.json(exercises[Math.floor(Math.random() * exercises.length)]);
});

demoPractice.post('/answer', (req, res) => {
  const { exerciseId, answer } = req.body;
  // In demo mode, check answer against the exercise's target (if available)
  // For now, match by simple string comparison
  const isCorrect = answer && answer.length > 0 ? Math.random() > 0.25 : false;
  
  const feedbacks = [
    { feedback_text: "Almost! Remember, the letter 'b' has its belly on the right side. Think of a bat hitting a ball — the bat faces right!", memory_hook: "b = bat = belly right" },
    { feedback_text: "Good try! When you see 6 and 9, remember: 6 has a tail going DOWN, 9 has a tail going UP.", memory_hook: "6 goes down, 9 goes up" },
    { feedback_text: "Let's try again! For spelling, sound out each letter: d-o-g. Say it slowly then write it.", memory_hook: "Sound it out letter by letter" },
    { feedback_text: "Close! For addition, try counting on your fingers. Start with the bigger number and count up.", memory_hook: "Start big, count up" },
    { feedback_text: "Nice effort! Remember the rhyming trick: words that end the same way rhyme. Cat, bat, hat all end in '-at'.", memory_hook: "Same ending = rhyme" },
  ];

  res.json({
    isCorrect,
    streak: isCorrect ? Math.floor(Math.random() * 8) + 1 : 0,
    feedback: isCorrect ? null : feedbacks[Math.floor(Math.random() * feedbacks.length)],
    levelChange: null,
  });
});

demoPractice.post('/complete', (_req, res) => {
  res.json({
    score: 78,
    totalExercises: 20,
    correctAnswers: 15,
    duration: '12 min',
    levelChanged: false,
    newMastery: 45,
  });
});

demoPractice.get('/progress', (_req, res) => {
  res.json({
    level: 2,
    streak: 3,
    accuracy: 72,
    mastery: 45,
    totalSessions: 8,
    categoryMastery: {
      letter_recognition: 65,
      phonics: 48,
      number_sense: 72,
      sequencing: 55,
      word_building: 38,
    },
  });
});

demoPractice.get('/history', (_req, res) => {
  res.json({
    sessions: [
      { id: uuid(), date: new Date(Date.now() - 3600000).toISOString(), score: 85, duration: '14 min', exercisesCompleted: 18 },
      { id: uuid(), date: new Date(Date.now() - 86400000).toISOString(), score: 72, duration: '12 min', exercisesCompleted: 20 },
      { id: uuid(), date: new Date(Date.now() - 172800000).toISOString(), score: 68, duration: '15 min', exercisesCompleted: 20 },
    ],
  });
});

demoPractice.get('/streak', (_req, res) => {
  res.json({
    currentStreak: 3,
    longestStreak: 7,
    lastSevenDays: [true, true, true, false, true, true, false], // practiced or not
  });
});

// ─── Demo Analytics Router ─────────────────────────────────────────
const demoAnalytics = express.Router();

demoAnalytics.get('/student', (req, res) => {
  res.json({
    name: req.user?.name || 'Demo Student',
    level: 3, streak: 5, totalPracticeMinutes: 420, mastery: 62,
    ldType: 'dyslexia', riskScore: 45, lastScreeningDate: '2026-05-15',
    weeklyGoal: { target: 5, completed: 3 },
    categoryMastery: [
      { category: 'letter_recognition', mastery: 85, trend: 'up' },
      { category: 'phonics', mastery: 68, trend: 'up' },
      { category: 'rhyme_detection', mastery: 72, trend: 'stable' },
      { category: 'phoneme_blending', mastery: 55, trend: 'up' },
      { category: 'reading', mastery: 42, trend: 'up' },
      { category: 'number_sense', mastery: 78, trend: 'stable' },
      { category: 'arithmetic', mastery: 65, trend: 'down' },
      { category: 'sequencing', mastery: 60, trend: 'up' },
      { category: 'writing', mastery: 48, trend: 'up' },
    ],
    progressHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      mastery: Math.min(100, 35 + i * 1.2 + Math.random() * 5),
    })),
    recentSessions: [
      { id: '1', date: '2026-06-10', score: 85, duration: 14, exercises: 18 },
      { id: '2', date: '2026-06-09', score: 78, duration: 12, exercises: 20 },
      { id: '3', date: '2026-06-08', score: 82, duration: 15, exercises: 20 },
      { id: '4', date: '2026-06-06', score: 72, duration: 11, exercises: 16 },
      { id: '5', date: '2026-06-05', score: 68, duration: 13, exercises: 20 },
    ],
    weekDays: [true, true, true, false, false, null, null],
    testReady: true,
    quote: 'Every expert was once a beginner. Keep going! 🌟',
  });
});

demoAnalytics.get('/parent', (req, res) => {
  res.json({
    child: { name: 'Ravi Kumar', class: 'Class 4-B', school: 'Delhi Public School', age: 9 },
    ldType: 'dyslexia', currentLevel: 3, riskScore: 45, improvement: 38,
    firstScreening: { date: '2026-02-10', level: 1, riskScore: 78 },
    latestScreening: { date: '2026-05-15', level: 3, riskScore: 45 },
    practiceStats: { daysThisWeek: 4, avgSessionMinutes: 13, streak: 5, totalSessions: 42 },
    strengths: ['number_sense', 'counting', 'sequencing'],
    weaknesses: ['phoneme_blending', 'reading', 'writing'],
    levelProgression: [
      { level: 1, status: 'passed', date: '2026-03-01' },
      { level: 2, status: 'passed', date: '2026-04-12' },
      { level: 3, status: 'current', date: null },
      { level: 4, status: 'locked', date: null },
      { level: 5, status: 'locked', date: null },
    ],
    teacherNotes: null,
    actionItems: ['Encourage 15 minutes of daily practice', 'Focus on reading exercises', 'Schedule re-screening in August 2026', 'Celebrate Level 2 achievement!'],
  });
});

demoAnalytics.get('/admin', (req, res) => {
  res.json({
    totalStudents: 16, screenedCount: 128, averageRiskScore: 42, activePractitioners: 67,
    ldDistribution: [
      { type: 'Dyslexia', count: 5, percentage: 31, color: '#7C3AED' },
      { type: 'Dyscalculia', count: 4, percentage: 25, color: '#3B82F6' },
      { type: 'Dysgraphia', count: 3, percentage: 19, color: '#EC4899' },
      { type: 'Mixed', count: 2, percentage: 13, color: '#F59E0B' },
      { type: 'Unscreened', count: 2, percentage: 12, color: '#10B981' },
    ],
    levelDistribution: [
      { level: 1, count: 5 }, { level: 2, count: 6 }, { level: 3, count: 3 },
      { level: 4, count: 1 }, { level: 5, count: 1 },
    ],
    atRiskStudents: [
      { id: '1', name: 'Deepak G.', ldType: 'Mixed', riskScore: 88, lastPractice: '10 days ago', level: 1 },
      { id: '2', name: 'Meera R.', ldType: 'Mixed', riskScore: 82, lastPractice: '5 days ago', level: 1 },
      { id: '3', name: 'Vikram J.', ldType: 'Dyscalculia', riskScore: 78, lastPractice: '7 days ago', level: 1 },
      { id: '4', name: 'Ravi K.', ldType: 'Dyslexia', riskScore: 65, lastPractice: '3 days ago', level: 2 },
      { id: '5', name: 'Arjun B.', ldType: 'Dyslexia', riskScore: 61, lastPractice: '3 days ago', level: 2 },
    ],
    progressTrend: Array.from({ length: 12 }, (_, i) => ({
      month: ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'][i],
      avgMastery: 25 + i * 4 + Math.round(Math.random() * 3),
      avgRisk: 70 - i * 3,
    })),
  });
});

demoAnalytics.get('/admin/overview', (req, res) => {
  res.json({
    totalStudents: 16,
    activeToday: 9,
    newSignupsThisWeek: 3,
    newSignupsThisMonth: 6,
    subscriptionRevenue: 9500,
    activeSubscriptions: 10,
    conversionRate: 75,
    atRiskCount: 5,
    avgAccuracy: 67.4,
    screeningCompletionRate: 87,
    ldDistribution: [
      { type: 'Dyslexia', count: 5, percentage: 31, color: '#7C3AED' },
      { type: 'Dyscalculia', count: 4, percentage: 25, color: '#3B82F6' },
      { type: 'Dysgraphia', count: 3, percentage: 19, color: '#EC4899' },
      { type: 'Mixed', count: 2, percentage: 13, color: '#F59E0B' },
      { type: 'Unscreened', count: 2, percentage: 12, color: '#10B981' },
    ],
    levelDistribution: [
      { level: 1, count: 5 }, { level: 2, count: 6 }, { level: 3, count: 3 },
      { level: 4, count: 1 }, { level: 5, count: 1 },
    ],
    weeklyActiveUsers: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      count: 30 + Math.round(Math.random() * 25),
    })),
    signupTrend: [
      { week: 'Jun W1', count: 2 }, { week: 'Jun W2', count: 1 },
      { week: 'Jun W3', count: 2 }, { week: 'Jun W4', count: 3 },
      { week: 'Jul W1', count: 2 }, { week: 'Jul W2', count: 3 },
      { week: 'Jul W3', count: 3 },
    ],
    revenueTrend: [
      { month: 'Jan', revenue: 2000 }, { month: 'Feb', revenue: 3500 },
      { month: 'Mar', revenue: 4200 }, { month: 'Apr', revenue: 5800 },
      { month: 'May', revenue: 7400 }, { month: 'Jun', revenue: 8100 },
      { month: 'Jul', revenue: 9500 },
    ],
    atRiskStudents: [
      { id: '1', name: 'Deepak G.', ldType: 'Mixed', severity: 'Severe', lastActive: '10 days ago', level: 1 },
      { id: '2', name: 'Meera R.', ldType: 'Dyslexia', severity: 'Moderate', lastActive: '5 days ago', level: 1 },
      { id: '3', name: 'Vikram J.', ldType: 'Dyscalculia', severity: 'Severe', lastActive: '7 days ago', level: 1 },
      { id: '4', name: 'Ravi K.', ldType: 'Dyslexia', severity: 'Moderate', lastActive: '3 days ago', level: 2 },
      { id: '5', name: 'Arjun B.', ldType: 'Dysgraphia', severity: 'Mild', lastActive: '3 days ago', level: 2 },
    ],
    recentSignups: [
      { id: '10', name: 'Priya M.', email: 'priya@gmail.com', joined: '2026-07-23', ldType: 'Unscreened' },
      { id: '11', name: 'Karthik S.', email: 'karthik@gmail.com', joined: '2026-07-22', ldType: 'Dyslexia' },
      { id: '12', name: 'Ananya R.', email: 'ananya@gmail.com', joined: '2026-07-21', ldType: 'Dyscalculia' },
      { id: '13', name: 'Rohit V.', email: 'rohit@gmail.com', joined: '2026-07-20', ldType: 'Unscreened' },
      { id: '14', name: 'Sneha K.', email: 'sneha@gmail.com', joined: '2026-07-19', ldType: 'Dysgraphia' },
    ],
  });
});

demoAnalytics.get('/dashboard', (req, res) => {
  res.json({
    students: 156,
    attendance: { present: 142 },
    fees: { collected_today: 48500 },
  });
});

// ─── Demo Schools Router ───────────────────────────────────────────
const demoSchools = express.Router();

demoSchools.get('/classes', (req, res) => {
  res.json({ classes: [
    { id: '1', name: 'Class 4-A', teacher_name: 'Mrs. Sharma', student_count: 28, grade: '4', school_id: 'demo-school' },
    { id: '2', name: 'Class 4-B', teacher_name: 'Mr. Verma', student_count: 26, grade: '4', school_id: 'demo-school' },
    { id: '3', name: 'Class 5-A', teacher_name: 'Mrs. Iyer', student_count: 30, grade: '5', school_id: 'demo-school' },
    { id: '4', name: 'Class 5-B', teacher_name: 'Mr. Khan', student_count: 27, grade: '5', school_id: 'demo-school' },
  ]});
});

demoSchools.get('/subscription', (req, res) => {
  res.json({
    planType: 'pro',
    studentCount: 45,
    maxStudents: 200,
    usagePct: 22,
    isExpired: false,
  });
});

demoSchools.post('/classes', (req, res) => {
  const { className } = req.body;
  res.json({ class: { id: uuid(), name: className, student_count: 0, school_id: 'demo-school' } });
});

// ─── Demo Tests Router ─────────────────────────────────────────────
const testQuestions = require('../data/testQuestions');
const demoTests = express.Router();
const demoTestAttempts = {};

const TEST_TIME_LIMITS = { 1: 600, 2: 720, 3: 900, 4: 1080, 5: 1200 };

demoTests.get('/available', (_req, res) => {
  res.json({
    level: 3,
    questionsCount: 10,
    timeLimit: TEST_TIME_LIMITS[3],
    timeLimitLabel: '15 minutes',
    attemptsToday: 1,
    maxAttempts: 3,
    passThreshold: 80,
    isLocked: false,
  });
});

demoTests.post('/start', (req, res) => {
  const { level } = req.body;
  const lvl = level || 3;
  const questions = testQuestions
    .filter(q => q.level === lvl)
    .map((q, i) => ({ ...q, id: `tq-${lvl}-${i + 1}` }));
  const attemptId = uuid();
  demoTestAttempts[attemptId] = { level: lvl, answers: [], startedAt: Date.now() };
  res.json({ attemptId, level: lvl, questions, timeLimit: TEST_TIME_LIMITS[lvl], questionsCount: questions.length });
});

demoTests.post('/submit-answer', (req, res) => {
  const { attemptId, questionId, answer } = req.body;
  const attempt = demoTestAttempts[attemptId];
  if (attempt) {
    const levelQs = testQuestions.filter(q => q.level === attempt.level);
    const qIdx = parseInt(questionId.split('-')[2]) - 1;
    const q = levelQs[qIdx];
    const isCorrect = q ? String(answer).trim() === String(q.correct_answer).trim() : false;
    attempt.answers.push({ questionId, answer, isCorrect, correct_answer: q?.correct_answer, question_text: q?.question_text });
  }
  res.json({ received: true });
});

demoTests.post('/complete', (req, res) => {
  const { attemptId } = req.body;
  const attempt = demoTestAttempts[attemptId] || { level: 3, answers: [] };
  const correct = attempt.answers.filter(a => a.isCorrect).length;
  const total = attempt.answers.length || 10;
  const score = Math.round((correct / total) * 100);
  const passed = score >= 80;
  delete demoTestAttempts[attemptId];
  res.json({
    attemptId, level: attempt.level, score, correct, total, passed,
    wrongAnswers: attempt.answers.filter(a => !a.isCorrect),
    certificate: passed ? { id: 'cert-' + uuid().slice(0, 8), level: attempt.level, score, date: new Date().toISOString(), studentName: 'Demo Student', schoolName: 'LD Schools' } : null,
    message: passed ? `Congratulations! Level ${attempt.level} passed!` : 'Need 80% to pass. Keep practicing!',
  });
});

demoTests.get('/result/:attemptId', (req, res) => {
  res.json({ attemptId: req.params.attemptId, level: 3, score: 80, correct: 8, total: 10, passed: true, wrongAnswers: [] });
});

demoTests.get('/history', (_req, res) => {
  res.json({
    attempts: [
      { id: uuid(), level: 1, score: 90, passed: true, date: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: uuid(), level: 2, score: 80, passed: true, date: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: uuid(), level: 3, score: 60, passed: false, date: new Date(Date.now() - 86400000).toISOString() },
    ],
  });
});

demoTests.get('/certificate/:attemptId', (req, res) => {
  res.json({ id: req.params.attemptId, level: 2, score: 90, date: new Date().toISOString(), studentName: 'Demo Student', schoolName: 'LD Schools' });
});

// ─── Demo Admin Router ───────────────────────────────────────────────
const demoAdmin = express.Router();

const DEMO_STUDENTS = [
  { id: '1', name: 'Aarav Sharma', email: 'aarav@gmail.com', phone: '+91 98765 43201', age: 10, ldType: 'Dyslexia', severity: 'Moderate', level: 3, subscription: 'Active', lastActive: '2026-07-24', joined: '2026-02-15', screeningDate: '2026-02-20', confidence: 82, status: 'active' },
  { id: '2', name: 'Priya Menon', email: 'priya.m@gmail.com', phone: '+91 98765 43202', age: 9, ldType: 'Dyscalculia', severity: 'Mild', level: 4, subscription: 'Active', lastActive: '2026-07-23', joined: '2026-01-10', screeningDate: '2026-01-15', confidence: 91, status: 'active' },
  { id: '3', name: 'Ravi Kumar', email: 'ravi.k@gmail.com', phone: '+91 98765 43203', age: 11, ldType: 'Dysgraphia', severity: 'Severe', level: 2, subscription: 'Expired', lastActive: '2026-07-10', joined: '2026-03-22', screeningDate: '2026-03-28', confidence: 77, status: 'active' },
  { id: '4', name: 'Sneha Reddy', email: 'sneha.r@gmail.com', phone: '+91 98765 43204', age: 8, ldType: 'Dyslexia', severity: 'Mild', level: 5, subscription: 'Active', lastActive: '2026-07-24', joined: '2025-11-05', screeningDate: '2025-11-10', confidence: 95, status: 'active' },
  { id: '5', name: 'Deepak Gupta', email: 'deepak.g@gmail.com', phone: '+91 98765 43205', age: 12, ldType: 'Mixed', severity: 'Severe', level: 1, subscription: 'Free', lastActive: '2026-07-14', joined: '2026-05-01', screeningDate: '2026-05-08', confidence: 65, status: 'active' },
  { id: '6', name: 'Meera Iyer', email: 'meera.i@gmail.com', phone: '+91 98765 43206', age: 10, ldType: 'Dyslexia', severity: 'Moderate', level: 3, subscription: 'Active', lastActive: '2026-07-22', joined: '2026-01-20', screeningDate: '2026-01-25', confidence: 85, status: 'active' },
  { id: '7', name: 'Vikram Joshi', email: 'vikram.j@gmail.com', phone: '+91 98765 43207', age: 9, ldType: 'Dyscalculia', severity: 'Moderate', level: 2, subscription: 'Active', lastActive: '2026-07-18', joined: '2026-04-12', screeningDate: '2026-04-18', confidence: 79, status: 'active' },
  { id: '8', name: 'Ananya Das', email: 'ananya.d@gmail.com', phone: '+91 98765 43208', age: 11, ldType: 'Unscreened', severity: null, level: 1, subscription: 'Free', lastActive: '2026-07-20', joined: '2026-07-15', screeningDate: null, confidence: null, status: 'active' },
  { id: '9', name: 'Rohit Verma', email: 'rohit.v@gmail.com', phone: '+91 98765 43209', age: 10, ldType: 'Dysgraphia', severity: 'Mild', level: 4, subscription: 'Active', lastActive: '2026-07-23', joined: '2026-02-28', screeningDate: '2026-03-05', confidence: 88, status: 'active' },
  { id: '10', name: 'Kavya Nair', email: 'kavya.n@gmail.com', phone: '+91 98765 43210', age: 8, ldType: 'Dyslexia', severity: 'Severe', level: 1, subscription: 'Active', lastActive: '2026-07-12', joined: '2026-06-01', screeningDate: '2026-06-05', confidence: 72, status: 'active' },
  { id: '11', name: 'Arjun Bhat', email: 'arjun.b@gmail.com', phone: '+91 98765 43211', age: 12, ldType: 'Dyscalculia', severity: 'Moderate', level: 3, subscription: 'Expired', lastActive: '2026-07-05', joined: '2025-12-10', screeningDate: '2025-12-15', confidence: 80, status: 'inactive' },
  { id: '12', name: 'Divya Pillai', email: 'divya.p@gmail.com', phone: '+91 98765 43212', age: 9, ldType: 'Mixed', severity: 'Moderate', level: 2, subscription: 'Free', lastActive: '2026-07-21', joined: '2026-04-25', screeningDate: '2026-05-02', confidence: 74, status: 'active' },
  { id: '13', name: 'Karthik S.', email: 'karthik.s@gmail.com', phone: '+91 98765 43213', age: 10, ldType: 'Dyslexia', severity: 'Mild', level: 5, subscription: 'Active', lastActive: '2026-07-24', joined: '2025-10-15', screeningDate: '2025-10-20', confidence: 93, status: 'active' },
  { id: '14', name: 'Lakshmi R.', email: 'lakshmi.r@gmail.com', phone: '+91 98765 43214', age: 11, ldType: 'Unscreened', severity: null, level: 1, subscription: 'Free', lastActive: '2026-07-19', joined: '2026-07-18', screeningDate: null, confidence: null, status: 'active' },
  { id: '15', name: 'Nitin Rao', email: 'nitin.rao@gmail.com', phone: '+91 98765 43215', age: 9, ldType: 'Dysgraphia', severity: 'Moderate', level: 3, subscription: 'Active', lastActive: '2026-07-22', joined: '2026-03-01', screeningDate: '2026-03-08', confidence: 83, status: 'active' },
  { id: '16', name: 'Pooja M.', email: 'pooja.m@gmail.com', phone: '+91 98765 43216', age: 10, ldType: 'Dyscalculia', severity: 'Severe', level: 1, subscription: 'Active', lastActive: '2026-07-16', joined: '2026-05-20', screeningDate: '2026-05-25', confidence: 68, status: 'active' },
];

// GET /api/admin/students — list with search/filter
demoAdmin.get('/students', (req, res) => {
  let students = [...DEMO_STUDENTS];
  const { search, ldType, subscription, status, level, page = 1, limit = 10 } = req.query;

  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }
  if (ldType && ldType !== 'all') students = students.filter(s => s.ldType === ldType);
  if (subscription && subscription !== 'all') students = students.filter(s => s.subscription === subscription);
  if (status && status !== 'all') students = students.filter(s => s.status === status);
  if (level && level !== 'all') students = students.filter(s => s.level === Number(level));

  const total = students.length;
  const start = (page - 1) * limit;
  const paginated = students.slice(start, start + Number(limit));

  res.json({ students: paginated, total, page: Number(page), totalPages: Math.ceil(total / limit) });
});

// GET /api/admin/students/:id — single student detail
demoAdmin.get('/students/:id', (req, res) => {
  const student = DEMO_STUDENTS.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  res.json({
    ...student,
    testHistory: [
      { id: 't1', level: 1, score: 85, passed: true, date: '2026-03-10', timeTaken: '8:30' },
      { id: 't2', level: 2, score: 72, passed: true, date: '2026-04-15', timeTaken: '11:20' },
      { id: 't3', level: 3, score: 68, passed: false, date: '2026-05-20', timeTaken: '14:10' },
      { id: 't4', level: 3, score: 78, passed: true, date: '2026-06-01', timeTaken: '12:45' },
    ],
    practiceStats: { totalSessions: 42, totalMinutes: 520, streak: 5, avgAccuracy: 71, exercisesCompleted: 380 },
    activityTimeline: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      active: Math.random() > 0.3,
      minutes: Math.round(Math.random() * 20 + 5),
    })),
  });
});

// DELETE /api/admin/students/:id
demoAdmin.delete('/students/:id', (req, res) => {
  res.json({ success: true, message: 'Student deleted (demo)' });
});

// PATCH /api/admin/students/:id/status
demoAdmin.patch('/students/:id/status', (req, res) => {
  const { status } = req.body;
  res.json({ success: true, message: `Student ${status === 'active' ? 'activated' : 'deactivated'} (demo)` });
});

// POST /api/admin/students/:id/reset-password
demoAdmin.post('/students/:id/reset-password', (req, res) => {
  res.json({ success: true, message: 'Password reset email sent (demo)' });
});

// ─── Analytics ──────────────────────────────────────────────────────
demoAdmin.get('/analytics', (req, res) => {
  res.json({
    overview: {
      totalStudents: 16, activeThisWeek: 89, avgAccuracy: 67.4,
      avgSessionMinutes: 14.2, totalPracticeSessions: 520, screenedStudents: 14,
    },
    dailyActiveUsers: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      count: 30 + Math.round(Math.random() * 30),
    })),
    accuracyByLevel: [
      { level: 'Level 1', accuracy: 78 },
      { level: 'Level 2', accuracy: 68 },
      { level: 'Level 3', accuracy: 62 },
      { level: 'Level 4', accuracy: 55 },
      { level: 'Level 5', accuracy: 48 },
    ],
    engagementByDay: [
      { day: 'Mon', sessions: 42 }, { day: 'Tue', sessions: 38 },
      { day: 'Wed', sessions: 45 }, { day: 'Thu', sessions: 35 },
      { day: 'Fri', sessions: 28 }, { day: 'Sat', sessions: 52 },
      { day: 'Sun', sessions: 48 },
    ],
    ldPerformance: [
      { type: 'Dyslexia', avgAccuracy: 62, avgLevel: 2.8, students: 38 },
      { type: 'Dyscalculia', avgAccuracy: 58, avgLevel: 2.4, students: 28 },
      { type: 'Dysgraphia', avgAccuracy: 65, avgLevel: 3.1, students: 18 },
      { type: 'Mixed', avgAccuracy: 52, avgLevel: 1.9, students: 12 },
    ],
    screeningFunnel: [
      { stage: 'Registered', count: 16 },
      { stage: 'Started Screening', count: 15 },
      { stage: 'Completed', count: 14 },
      { stage: 'Classified', count: 14 },
      { stage: 'Active Practice', count: 12 },
    ],
    monthlyGrowth: [
      { month: 'Jan', students: 4, revenue: 2000 },
      { month: 'Feb', students: 6, revenue: 3500 },
      { month: 'Mar', students: 8, revenue: 4200 },
      { month: 'Apr', students: 10, revenue: 5800 },
      { month: 'May', students: 12, revenue: 7400 },
      { month: 'Jun', students: 14, revenue: 8100 },
      { month: 'Jul', students: 16, revenue: 9500 },
    ],
    topPerformers: [
      { id: '4', name: 'Sneha Reddy', level: 5, accuracy: 92, streak: 28 },
      { id: '13', name: 'Karthik S.', level: 5, accuracy: 89, streak: 21 },
      { id: '2', name: 'Priya Menon', level: 4, accuracy: 85, streak: 15 },
      { id: '9', name: 'Rohit Verma', level: 4, accuracy: 82, streak: 12 },
      { id: '6', name: 'Meera Iyer', level: 3, accuracy: 78, streak: 10 },
    ],
    atRiskStudents: [
      { id: '5', name: 'Deepak Gupta', level: 1, accuracy: 32, inactive: '10 days', ldType: 'Mixed' },
      { id: '10', name: 'Kavya Nair', level: 1, accuracy: 30, inactive: '12 days', ldType: 'Dyslexia' },
      { id: '16', name: 'Pooja M.', level: 1, accuracy: 28, inactive: '8 days', ldType: 'Dyscalculia' },
      { id: '3', name: 'Ravi Kumar', level: 2, accuracy: 35, inactive: '14 days', ldType: 'Dysgraphia' },
    ],
  });
});

// ─── Billing & Subscriptions ────────────────────────────────────────
demoAdmin.get('/billing', (req, res) => {
  res.json({
    overview: {
      monthlyRevenue: 9500,
      annualRevenue: 72000,
      activeSubscriptions: 10,
      freeUsers: 4,
      expiredUsers: 2,
      conversionRate: 75,
      churnRate: 8.2,
      arpu: 593,
      growthPct: 13.5,
    },
    plans: [
      { id: 'free', name: 'Free', price: 0, period: null, students: 4, features: ['Basic screening', 'Limited practice (5/day)', 'Level 1 only'] },
      { id: 'monthly', name: 'Monthly', price: 199, period: 'month', students: 8, features: ['All levels', 'Unlimited practice', 'AI chat', 'Certifications'] },
      { id: 'annual', name: 'Annual', price: 1499, period: 'year', students: 4, features: ['All Monthly features', 'Priority support', 'Family sharing (2 kids)', 'Offline mode'] },
    ],
    recentPayments: [
      { id: 'p1', student: 'Aarav Sharma', email: 'aarav@gmail.com', amount: 199, plan: 'Monthly', status: 'Success', date: '2026-07-24', method: 'UPI' },
      { id: 'p2', student: 'Sneha Reddy', email: 'sneha.r@gmail.com', amount: 1499, plan: 'Annual', status: 'Success', date: '2026-07-22', method: 'Card' },
      { id: 'p3', student: 'Priya Menon', email: 'priya.m@gmail.com', amount: 199, plan: 'Monthly', status: 'Success', date: '2026-07-21', method: 'UPI' },
      { id: 'p4', student: 'Vikram Joshi', email: 'vikram.j@gmail.com', amount: 199, plan: 'Monthly', status: 'Failed', date: '2026-07-20', method: 'Card' },
      { id: 'p5', student: 'Rohit Verma', email: 'rohit.v@gmail.com', amount: 1499, plan: 'Annual', status: 'Success', date: '2026-07-19', method: 'Net Banking' },
      { id: 'p6', student: 'Meera Iyer', email: 'meera.i@gmail.com', amount: 199, plan: 'Monthly', status: 'Success', date: '2026-07-18', method: 'UPI' },
      { id: 'p7', student: 'Karthik S.', email: 'karthik.s@gmail.com', amount: 199, plan: 'Monthly', status: 'Refunded', date: '2026-07-15', method: 'Card' },
      { id: 'p8', student: 'Nitin Rao', email: 'nitin.rao@gmail.com', amount: 1499, plan: 'Annual', status: 'Success', date: '2026-07-14', method: 'UPI' },
    ],
    revenueTrend: [
      { month: 'Jan', revenue: 2000, subscriptions: 4 },
      { month: 'Feb', revenue: 3500, subscriptions: 5 },
      { month: 'Mar', revenue: 4200, subscriptions: 6 },
      { month: 'Apr', revenue: 5800, subscriptions: 7 },
      { month: 'May', revenue: 7400, subscriptions: 9 },
      { month: 'Jun', revenue: 8100, subscriptions: 10 },
      { month: 'Jul', revenue: 9500, subscriptions: 12 },
    ],
    expiringThisWeek: [
      { id: '1', name: 'Arjun Bhat', email: 'arjun.b@gmail.com', plan: 'Monthly', expiresOn: '2026-07-26' },
      { id: '2', name: 'Divya Pillai', email: 'divya.p@gmail.com', plan: 'Monthly', expiresOn: '2026-07-28' },
      { id: '3', name: 'Ravi Kumar', email: 'ravi.k@gmail.com', plan: 'Annual', expiresOn: '2026-07-30' },
    ],
  });
});

demoAdmin.post('/billing/extend', (req, res) => {
  res.json({ success: true, message: 'Subscription extended (demo)' });
});

demoAdmin.post('/billing/refund', (req, res) => {
  res.json({ success: true, message: 'Refund processed (demo)' });
});

// ─── Chat Support ───────────────────────────────────────────────────
const DEMO_CHATS = [
  {
    id: 'c1', studentId: '1', studentName: 'Aarav Sharma', ldType: 'Dyslexia', subscription: 'Active', status: 'open', unread: 2, lastMessage: 'I am stuck on level 3 reading exercises', lastAt: '2026-07-24T14:30:00',
    messages: [
      { id: 'm1', from: 'student', text: 'Hi, I need help with the reading exercises', time: '2026-07-24T14:20:00' },
      { id: 'm2', from: 'admin', text: 'Sure! What specific exercise are you having trouble with?', time: '2026-07-24T14:22:00' },
      { id: 'm3', from: 'student', text: 'The phoneme blending one at Level 3', time: '2026-07-24T14:25:00' },
      { id: 'm4', from: 'student', text: 'I am stuck on level 3 reading exercises', time: '2026-07-24T14:30:00' },
    ],
  },
  {
    id: 'c2', studentId: '5', studentName: 'Deepak Gupta', ldType: 'Mixed', subscription: 'Free', status: 'open', unread: 1, lastMessage: 'How do I upgrade to paid plan?', lastAt: '2026-07-24T11:00:00',
    messages: [
      { id: 'm5', from: 'student', text: 'How do I upgrade to paid plan?', time: '2026-07-24T11:00:00' },
    ],
  },
  {
    id: 'c3', studentId: '4', studentName: 'Sneha Reddy', ldType: 'Dyslexia', subscription: 'Active', status: 'resolved', unread: 0, lastMessage: 'Thank you so much! That helped.', lastAt: '2026-07-23T16:45:00',
    messages: [
      { id: 'm6', from: 'student', text: 'My certificate did not download properly', time: '2026-07-23T15:30:00' },
      { id: 'm7', from: 'admin', text: 'Let me check. Which certificate — Level 4 completion?', time: '2026-07-23T15:35:00' },
      { id: 'm8', from: 'student', text: 'Yes, Level 4', time: '2026-07-23T15:40:00' },
      { id: 'm9', from: 'admin', text: 'I have regenerated it. Please try downloading again from your Certifications page.', time: '2026-07-23T16:00:00' },
      { id: 'm10', from: 'student', text: 'Thank you so much! That helped.', time: '2026-07-23T16:45:00' },
    ],
  },
  {
    id: 'c4', studentId: '10', studentName: 'Kavya Nair', ldType: 'Dyslexia', subscription: 'Active', status: 'open', unread: 3, lastMessage: 'The app keeps crashing when I open practice', lastAt: '2026-07-24T09:15:00',
    messages: [
      { id: 'm11', from: 'student', text: 'The app keeps crashing when I open practice', time: '2026-07-24T09:15:00' },
      { id: 'm12', from: 'student', text: 'I tried reinstalling but same issue', time: '2026-07-24T09:16:00' },
      { id: 'm13', from: 'student', text: 'Please help', time: '2026-07-24T09:17:00' },
    ],
  },
  {
    id: 'c5', studentId: '2', studentName: 'Priya Menon', ldType: 'Dyscalculia', subscription: 'Active', status: 'resolved', unread: 0, lastMessage: 'Got it, thanks!', lastAt: '2026-07-22T10:30:00',
    messages: [
      { id: 'm14', from: 'student', text: 'Can I reset my screening and take it again?', time: '2026-07-22T10:00:00' },
      { id: 'm15', from: 'admin', text: 'Yes! I have reset it for you. Go to your dashboard and you will see the screening option again.', time: '2026-07-22T10:20:00' },
      { id: 'm16', from: 'student', text: 'Got it, thanks!', time: '2026-07-22T10:30:00' },
    ],
  },
];

demoAdmin.get('/chats', (req, res) => {
  const { status } = req.query;
  let chats = DEMO_CHATS.map(({ messages, ...rest }) => rest);
  if (status && status !== 'all') chats = chats.filter(c => c.status === status);
  const unreadTotal = DEMO_CHATS.reduce((sum, c) => sum + c.unread, 0);
  res.json({ chats, total: chats.length, unreadTotal });
});

demoAdmin.get('/chats/:id', (req, res) => {
  const chat = DEMO_CHATS.find(c => c.id === req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json(chat);
});

demoAdmin.post('/chats/:id/reply', (req, res) => {
  const { text } = req.body;
  res.json({ success: true, message: { id: uuid(), from: 'admin', text, time: new Date().toISOString() } });
});

demoAdmin.patch('/chats/:id/resolve', (req, res) => {
  res.json({ success: true, message: 'Conversation marked as resolved (demo)' });
});

demoAdmin.patch('/chats/:id/reopen', (req, res) => {
  res.json({ success: true, message: 'Conversation reopened (demo)' });
});

// ─── Notifications ──────────────────────────────────────────────────
demoAdmin.get('/notifications', (req, res) => {
  res.json({
    notifications: [
      { id: 'n1', title: 'Welcome to LD Support!', body: 'Start your LD screening today to unlock personalized exercises.', target: 'all', channel: 'push', status: 'sent', sentAt: '2026-07-20T09:00:00', delivered: 14, opened: 10 },
      { id: 'n2', title: 'New Level 4 content available', body: 'We have added 20 new exercises for Level 4 students.', target: 'level_4', channel: 'push', status: 'sent', sentAt: '2026-07-18T10:30:00', delivered: 8, opened: 6 },
      { id: 'n3', title: 'Complete your screening', body: 'You have not finished your LD screening. Complete it to get personalized exercises.', target: 'unscreened', channel: 'push', status: 'sent', sentAt: '2026-07-15T14:00:00', delivered: 4, opened: 2 },
      { id: 'n4', title: 'Your subscription expires soon', body: 'Your plan expires in 3 days. Renew to keep practicing!', target: 'expiring', channel: 'push', status: 'scheduled', sentAt: null, scheduledFor: '2026-07-25T08:00:00', delivered: 0, opened: 0 },
      { id: 'n5', title: 'Weekend practice challenge!', body: 'Complete 5 exercises this weekend and earn bonus XP.', target: 'all', channel: 'push+inapp', status: 'draft', sentAt: null, delivered: 0, opened: 0 },
    ],
    automatedTriggers: [
      { id: 't1', name: 'Streak Reminder', trigger: 'Inactive 24h', message: "Don't break your streak! Practice today.", status: 'active', sent7d: 34 },
      { id: 't2', name: 'Screening Reminder', trigger: 'Screening abandoned', message: 'Complete your LD screening to unlock full access.', status: 'active', sent7d: 8 },
      { id: 't3', name: 'Subscription Expiry', trigger: '3 days before expiry', message: 'Your plan expires soon. Renew to keep going!', status: 'active', sent7d: 5 },
      { id: 't4', name: 'Achievement Alert', trigger: 'Certificate earned', message: 'Congratulations! You earned a new certificate.', status: 'active', sent7d: 12 },
      { id: 't5', name: 'Inactivity Nudge', trigger: 'Inactive 7+ days', message: 'We miss you! Come back and practice.', status: 'paused', sent7d: 0 },
    ],
  });
});

demoAdmin.post('/notifications/send', (req, res) => {
  res.json({ success: true, message: 'Notification sent (demo)' });
});

demoAdmin.patch('/notifications/triggers/:id', (req, res) => {
  res.json({ success: true, message: 'Trigger updated (demo)' });
});

// ─── Settings ───────────────────────────────────────────────────────
demoAdmin.get('/settings', (req, res) => {
  res.json({
    platform: { name: 'LD Support', tagline: 'Learn your way', logo: null },
    admin: { username: 'admin', email: 'admin@ldsupport.in', twoFactor: false },
    app: { demoMode: true, maintenanceMode: false, registration: 'open', trialDays: 7 },
    screening: { questionsPerLevel: 6, levels: 5, passThreshold: 70, timeLimit: 20 },
    subscription: {
      monthlyPrice: 199, annualPrice: 1499, trialDays: 7,
      gracePeriod: 3, autoRenewalReminder: true,
    },
    smtp: { host: 'smtp.gmail.com', port: 587, from: 'noreply@ldsupport.in', fromName: 'LD Support', username: '', password: '', enabled: true },
    privacy: { dataRetentionDays: 365, allowDataExport: true, allowAccountDeletion: true, consentRequired: true },
    integrations: { razorpayKeyId: 'rzp_test_xxxxxxxxxxxx', razorpaySecret: '', firebaseProjectId: 'ld-support-app', firebaseKey: '', anthropicKey: '', aiModel: 'gemma' },
  });
});

demoAdmin.patch('/settings', (req, res) => {
  res.json({ success: true, message: 'Settings updated (demo)' });
});

// ─── Content CMS ────────────────────────────────────────────────────
const DEMO_CMS_QUESTIONS = [
  { id: 'q1', questionText: 'Which letter is the mirror image of "b"?', options: ['d', 'p', 'q', 'g'], correctAnswer: 'd', level: 1, category: 'phonics', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 1, status: 'published', createdAt: '2026-01-15' },
  { id: 'q2', questionText: 'What rhymes with "cat"?', options: ['dog', 'bat', 'car', 'cup'], correctAnswer: 'bat', level: 1, category: 'phonics', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 1, status: 'published', createdAt: '2026-01-15' },
  { id: 'q3', questionText: 'Select the word spelled correctly', options: ['becuase', 'because', 'becouse', 'becuz'], correctAnswer: 'because', level: 2, category: 'reading', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 2, status: 'published', createdAt: '2026-02-10' },
  { id: 'q4', questionText: 'What is 7 + 8?', options: ['13', '14', '15', '16'], correctAnswer: '15', level: 1, category: 'math', questionType: 'mcq', ldTarget: 'dyscalculia', difficulty: 1, status: 'published', createdAt: '2026-01-20' },
  { id: 'q5', questionText: 'Which number comes next: 2, 4, 6, 8, ___?', options: ['9', '10', '12', '11'], correctAnswer: '10', level: 2, category: 'math', questionType: 'mcq', ldTarget: 'dyscalculia', difficulty: 2, status: 'published', createdAt: '2026-02-05' },
  { id: 'q6', questionText: 'Arrange these words into a sentence: "the / dog / ran / fast"', options: ['The dog ran fast', 'Dog the fast ran', 'Ran fast dog the', 'Fast the ran dog'], correctAnswer: 'The dog ran fast', level: 2, category: 'writing', questionType: 'mcq', ldTarget: 'dysgraphia', difficulty: 2, status: 'published', createdAt: '2026-02-20' },
  { id: 'q7', questionText: 'How many tens are in 450?', options: ['4', '5', '45', '450'], correctAnswer: '45', level: 3, category: 'math', questionType: 'mcq', ldTarget: 'dyscalculia', difficulty: 3, status: 'published', createdAt: '2026-03-01' },
  { id: 'q8', questionText: 'Choose the correct ending: "The boy is runn___"', options: ['ing', 'ed', 'er', 'tion'], correctAnswer: 'ing', level: 2, category: 'reading', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 2, status: 'draft', createdAt: '2026-03-15' },
  { id: 'q9', questionText: 'Which shape has 4 equal sides?', options: ['Rectangle', 'Square', 'Triangle', 'Circle'], correctAnswer: 'Square', level: 1, category: 'math', questionType: 'mcq', ldTarget: 'dyscalculia', difficulty: 1, status: 'published', createdAt: '2026-01-25' },
  { id: 'q10', questionText: 'Fill in the blank: The c_t sat on the m_t', options: ['a, a', 'o, o', 'a, o', 'u, a'], correctAnswer: 'a, a', level: 1, category: 'phonics', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 1, status: 'published', createdAt: '2026-01-18' },
  { id: 'q11', questionText: 'What is 25 × 4?', options: ['75', '100', '90', '80'], correctAnswer: '100', level: 3, category: 'math', questionType: 'mcq', ldTarget: 'dyscalculia', difficulty: 3, status: 'published', createdAt: '2026-04-01' },
  { id: 'q12', questionText: 'Identify the silent letter in "knight"', options: ['k', 'n', 'g', 'h'], correctAnswer: 'k', level: 3, category: 'reading', questionType: 'mcq', ldTarget: 'dyslexia', difficulty: 3, status: 'published', createdAt: '2026-04-10' },
];

let liveQuestions = [...DEMO_CMS_QUESTIONS];

const DEMO_CMS_EXERCISES = [
  { id: 'e1', title: 'Letter Sound Match', type: 'phonics', ldTarget: 'dyslexia', level: 1, difficulty: 1, category: 'phonics', status: 'published', description: 'Match letters to their sounds', createdAt: '2026-01-10' },
  { id: 'e2', title: 'Word Builder', type: 'reading', ldTarget: 'dyslexia', level: 2, difficulty: 2, category: 'reading', status: 'published', description: 'Build words from letter tiles', createdAt: '2026-01-12' },
  { id: 'e3', title: 'Number Line Jump', type: 'math', ldTarget: 'dyscalculia', level: 1, difficulty: 1, category: 'math', status: 'published', description: 'Jump on the number line to solve addition', createdAt: '2026-01-15' },
  { id: 'e4', title: 'Sentence Ordering', type: 'writing', ldTarget: 'dysgraphia', level: 2, difficulty: 2, category: 'writing', status: 'published', description: 'Put scrambled words in correct order', createdAt: '2026-02-01' },
  { id: 'e5', title: 'Rhyme Time', type: 'phonics', ldTarget: 'dyslexia', level: 1, difficulty: 1, category: 'phonics', status: 'published', description: 'Find the rhyming word pair', createdAt: '2026-02-05' },
  { id: 'e6', title: 'Place Value Blocks', type: 'math', ldTarget: 'dyscalculia', level: 2, difficulty: 2, category: 'math', status: 'published', description: 'Use blocks to understand place value', createdAt: '2026-02-10' },
  { id: 'e7', title: 'Reading Comprehension', type: 'reading', ldTarget: 'dyslexia', level: 3, difficulty: 3, category: 'reading', status: 'published', description: 'Read a short passage and answer questions', createdAt: '2026-03-01' },
  { id: 'e8', title: 'Tracing Letters', type: 'writing', ldTarget: 'dysgraphia', level: 1, difficulty: 1, category: 'writing', status: 'published', description: 'Trace uppercase and lowercase letters', createdAt: '2026-01-20' },
  { id: 'e9', title: 'Fraction Pizza', type: 'math', ldTarget: 'dyscalculia', level: 3, difficulty: 3, category: 'math', status: 'published', description: 'Cut pizza into fractions to learn division', createdAt: '2026-03-15' },
  { id: 'e10', title: 'Phoneme Blending', type: 'phonics', ldTarget: 'dyslexia', level: 2, difficulty: 2, category: 'phonics', status: 'draft', description: 'Blend sounds together to form words', createdAt: '2026-04-01' },
];

// GET /api/admin/questions
demoAdmin.get('/questions', (req, res) => {
  let questions = [...liveQuestions];
  const { level, category, ldTarget, status, search } = req.query;

  if (search) {
    const q = search.toLowerCase();
    questions = questions.filter(q2 => q2.questionText.toLowerCase().includes(q));
  }
  if (level) questions = questions.filter(q2 => q2.level === Number(level));
  if (category) questions = questions.filter(q2 => q2.category === category);
  if (ldTarget) questions = questions.filter(q2 => q2.ldTarget === ldTarget);
  if (status) questions = questions.filter(q2 => q2.status === status);

  res.json({ questions, total: questions.length });
});

// POST /api/admin/questions
demoAdmin.post('/questions', (req, res) => {
  const question = { id: uuid(), ...req.body, createdAt: new Date().toISOString().slice(0, 10) };
  liveQuestions.unshift(question);
  res.status(201).json(question);
});

// PATCH /api/admin/questions/:id
demoAdmin.patch('/questions/:id', (req, res) => {
  const idx = liveQuestions.findIndex(q => q.id === req.params.id);
  if (idx !== -1) liveQuestions[idx] = { ...liveQuestions[idx], ...req.body, updatedAt: new Date().toISOString().slice(0, 10) };
  const question = idx !== -1 ? liveQuestions[idx] : { id: req.params.id, ...req.body };
  res.json(question);
});

// DELETE /api/admin/questions/:id
demoAdmin.delete('/questions/:id', (req, res) => {
  liveQuestions = liveQuestions.filter(q => q.id !== req.params.id);
  res.json({ success: true, message: 'Question deleted (demo)' });
});

// GET /api/admin/exercises
demoAdmin.get('/exercises', (req, res) => {
  let exercises = [...DEMO_CMS_EXERCISES];
  const { level, category, ldTarget, type, status, search } = req.query;

  if (search) {
    const q = search.toLowerCase();
    exercises = exercises.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }
  if (level) exercises = exercises.filter(e => e.level === Number(level));
  if (category) exercises = exercises.filter(e => e.category === category);
  if (ldTarget) exercises = exercises.filter(e => e.ldTarget === ldTarget);
  if (type) exercises = exercises.filter(e => e.type === type);
  if (status) exercises = exercises.filter(e => e.status === status);

  res.json({ exercises, total: exercises.length });
});

// POST /api/admin/exercises
demoAdmin.post('/exercises', (req, res) => {
  const exercise = { id: uuid(), ...req.body, createdAt: new Date().toISOString().slice(0, 10) };
  res.status(201).json(exercise);
});

// PATCH /api/admin/exercises/:id
demoAdmin.patch('/exercises/:id', (req, res) => {
  const exercise = { id: req.params.id, ...req.body, updatedAt: new Date().toISOString().slice(0, 10) };
  res.json(exercise);
});

// DELETE /api/admin/exercises/:id
demoAdmin.delete('/exercises/:id', (req, res) => {
  res.json({ success: true, message: 'Exercise deleted (demo)' });
});

// GET /api/admin/screening-questions (alias for screening question management)
demoAdmin.get('/screening-questions', (req, res) => {
  const screeningQs = DEMO_CMS_QUESTIONS.filter(q => q.category === 'phonics' || q.ldTarget);
  res.json({ questions: screeningQs, total: screeningQs.length });
});

demoAdmin.post('/screening-questions', (req, res) => {
  res.status(201).json({ id: uuid(), ...req.body, createdAt: new Date().toISOString().slice(0, 10) });
});

demoAdmin.patch('/screening-questions/:id', (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

demoAdmin.delete('/screening-questions/:id', (req, res) => {
  res.json({ success: true, message: 'Screening question deleted (demo)' });
});

// ─── Screening Results ─────────────────────────────────────────
const DEMO_SCREENING_RESULTS = [
  { id: 's1', studentId: '1', studentName: 'Aarav Sharma', email: 'aarav@gmail.com', ldType: 'Dyslexia', severity: 'Moderate', confidence: 82, status: 'Completed', startedAt: '2026-02-20 09:15', completedAt: '2026-02-20 09:32', duration: '17 min', score: 58 },
  { id: 's2', studentId: '2', studentName: 'Priya Menon', email: 'priya.m@gmail.com', ldType: 'Dyscalculia', severity: 'Mild', confidence: 91, status: 'Completed', startedAt: '2026-01-15 14:20', completedAt: '2026-01-15 14:35', duration: '15 min', score: 68 },
  { id: 's3', studentId: '3', studentName: 'Ravi Kumar', email: 'ravi.k@gmail.com', ldType: 'Dysgraphia', severity: 'Severe', confidence: 77, status: 'Completed', startedAt: '2026-03-28 10:00', completedAt: '2026-03-28 10:22', duration: '22 min', score: 35 },
  { id: 's4', studentId: '4', studentName: 'Sneha Reddy', email: 'sneha.r@gmail.com', ldType: 'Dyslexia', severity: 'Mild', confidence: 95, status: 'Completed', startedAt: '2025-11-10 11:30', completedAt: '2025-11-10 11:44', duration: '14 min', score: 72 },
  { id: 's5', studentId: '5', studentName: 'Deepak Gupta', email: 'deepak.g@gmail.com', ldType: 'Mixed', severity: 'Severe', confidence: 65, status: 'Completed', startedAt: '2026-05-08 16:00', completedAt: '2026-05-08 16:25', duration: '25 min', score: 32 },
  { id: 's6', studentId: '6', studentName: 'Meera Iyer', email: 'meera.i@gmail.com', ldType: 'Dyslexia', severity: 'Moderate', confidence: 85, status: 'Completed', startedAt: '2026-01-25 09:45', completedAt: '2026-01-25 10:02', duration: '17 min', score: 55 },
  { id: 's7', studentId: '7', studentName: 'Vikram Joshi', email: 'vikram.j@gmail.com', ldType: 'Dyscalculia', severity: 'Moderate', confidence: 79, status: 'Completed', startedAt: '2026-04-18 13:10', completedAt: '2026-04-18 13:28', duration: '18 min', score: 48 },
  { id: 's8', studentId: '8', studentName: 'Ananya Das', email: 'ananya.d@gmail.com', ldType: null, severity: null, confidence: null, status: 'Not Started', startedAt: null, completedAt: null, duration: null, score: null },
  { id: 's9', studentId: '9', studentName: 'Rohit Verma', email: 'rohit.v@gmail.com', ldType: 'Dysgraphia', severity: 'Mild', confidence: 88, status: 'Completed', startedAt: '2026-03-05 15:30', completedAt: '2026-03-05 15:46', duration: '16 min', score: 65 },
  { id: 's10', studentId: '10', studentName: 'Kavya Nair', email: 'kavya.n@gmail.com', ldType: 'Dyslexia', severity: 'Severe', confidence: 72, status: 'Completed', startedAt: '2026-06-05 10:20', completedAt: '2026-06-05 10:45', duration: '25 min', score: 30 },
  { id: 's11', studentId: '11', studentName: 'Arjun Bhat', email: 'arjun.b@gmail.com', ldType: 'Dyscalculia', severity: 'Moderate', confidence: 80, status: 'Completed', startedAt: '2025-12-15 11:00', completedAt: '2025-12-15 11:18', duration: '18 min', score: 50 },
  { id: 's12', studentId: '12', studentName: 'Divya Pillai', email: 'divya.p@gmail.com', ldType: 'Mixed', severity: 'Moderate', confidence: 74, status: 'Completed', startedAt: '2026-05-02 09:00', completedAt: '2026-05-02 09:20', duration: '20 min', score: 45 },
  { id: 's13', studentId: '13', studentName: 'Karthik S.', email: 'karthik.s@gmail.com', ldType: 'Dyslexia', severity: 'Mild', confidence: 93, status: 'Completed', startedAt: '2025-10-20 14:30', completedAt: '2025-10-20 14:43', duration: '13 min', score: 74 },
  { id: 's14', studentId: '14', studentName: 'Lakshmi R.', email: 'lakshmi.r@gmail.com', ldType: null, severity: null, confidence: null, status: 'In Progress', startedAt: '2026-07-20 10:00', completedAt: null, duration: null, score: null },
  { id: 's15', studentId: '15', studentName: 'Nitin Rao', email: 'nitin.rao@gmail.com', ldType: 'Dysgraphia', severity: 'Moderate', confidence: 83, status: 'Completed', startedAt: '2026-03-08 08:45', completedAt: '2026-03-08 09:03', duration: '18 min', score: 52 },
  { id: 's16', studentId: '16', studentName: 'Pooja M.', email: 'pooja.m@gmail.com', ldType: 'Dyscalculia', severity: 'Severe', confidence: 68, status: 'Completed', startedAt: '2026-05-25 16:30', completedAt: '2026-05-25 16:55', duration: '25 min', score: 28 },
];

demoAdmin.get('/screening', (req, res) => {
  let results = [...DEMO_SCREENING_RESULTS];
  const { search, ldType, severity, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r => r.studentName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }
  if (ldType && ldType !== 'all') results = results.filter(r => r.ldType === ldType);
  if (severity && severity !== 'all') results = results.filter(r => r.severity === severity);
  if (status && status !== 'all') results = results.filter(r => r.status === status);

  const completed = DEMO_SCREENING_RESULTS.filter(r => r.status === 'Completed').length;
  const inProgress = DEMO_SCREENING_RESULTS.filter(r => r.status === 'In Progress').length;
  const notStarted = DEMO_SCREENING_RESULTS.filter(r => r.status === 'Not Started').length;

  res.json({
    results,
    total: results.length,
    stats: {
      total: DEMO_SCREENING_RESULTS.length,
      completed,
      inProgress,
      notStarted,
      completionRate: Math.round((completed / DEMO_SCREENING_RESULTS.length) * 100),
      avgDuration: '18 min',
      avgConfidence: 81,
    },
  });
});

// PATCH /api/admin/screening/:id/override — manual override
demoAdmin.patch('/screening/:id/override', (req, res) => {
  const { ldType, severity } = req.body;
  res.json({ success: true, message: `Classification overridden to ${ldType} (${severity}) — demo` });
});

// POST /api/admin/screening/:studentId/reset — allow re-screening
demoAdmin.post('/screening/:studentId/reset', (req, res) => {
  res.json({ success: true, message: 'Screening reset. Student can retake. (demo)' });
});

module.exports = { demoAuth, demoScreening, demoPractice, demoTests, demoAnalytics, demoSchools, demoAdmin };
