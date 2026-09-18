/**
 * Adaptive Screening API (Phase 3) — NEW English+Math skill assessment.
 *
 * Mounted at /api/ld/adaptive-screening (see index.js). Separate from the
 * existing LD screening route (/api/ld/screening) — that is untouched.
 *
 * Endpoints (all require auth):
 *   GET  /questions            → the 100-question bank (answers stripped) + required assets
 *   POST /start                → create a session, return sessionId
 *   POST /answer               → record one answer (objective scoring applied)
 *   POST /submit               → finalize: compute result + next-test plan, persist
 *   GET  /result/:sessionId    → fetch a completed session's result
 *   GET  /history              → list the learner's past sessions (summary)
 *   GET  /next-test/:sessionId → fetch the personalized next Level-Test plan
 *
 * Scoring is objective (adaptiveScreeningEngine). Speaking/open questions
 * are marked needs_ai and scored 0 until a later STT/Gemma pass fills them.
 */

const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const { ADAPTIVE_SCREENING_BANK, REQUIRED_ASSETS } = require('../../data/adaptiveScreeningBank');
const engine = require('../../services/adaptiveScreeningEngine');
const gemma = require('../../services/adaptiveGemma');

const bankById = Object.fromEntries(ADAPTIVE_SCREENING_BANK.map((q) => [q.id, q]));

// Compute the LISTENING STIMULUS text (what the learner must hear) for an
// audio question. This is intentionally exposed for listening questions —
// hearing the stimulus is the whole task. It is NOT exposed for non-audio
// questions, so no answer key leaks for text/MCQ items.
function audioTextFor(q) {
  if (!q.audio) return null;
  // 0. Explicit audio script (the exact stimulus to speak) wins.
  if (q.audioScript) return String(q.audioScript);
  // 1. A quoted sentence in the prompt is the stimulus (e.g. 'I like ice cream.')
  const m = String(q.question || '').match(/[‘'"“]([^’'"”]+)[’'"”]/);
  if (m && m[1]) return m[1];
  // 2. Word/sentence identification: the stimulus IS the correct answer.
  if (q.correctAnswer) return String(q.correctAnswer);
  // 3. Fallback: strip a leading instruction and speak the remainder.
  return String(q.question || '')
    .replace(/^(listen( carefully)?( and (repeat|answer|choose))?|read (this )?(sentence )?aloud)\s*[:\-]?\s*/i, '')
    .trim() || null;
}

// Strip answer keys before sending questions to the client.
// For audio (listening) questions we ADD an `audioText` stimulus so the
// player speaks the target word/sentence — never the on-screen instruction.
function publicQuestion(q) {
  const { correctAnswer, expectedAnswer, explanation, audioScript, ...safe } = q;
  if (safe.audio) {
    safe.audioText = audioTextFor(q);
  }
  return safe;
}

// ── GET /questions ────────────────────────────────────────────────
router.get('/questions', requireAuth, (req, res) => {
  res.json({
    questions: ADAPTIVE_SCREENING_BANK.map(publicQuestion),
    total: ADAPTIVE_SCREENING_BANK.length,
    subjects: { English: 50, Mathematics: 50 },
    requiredAssets: REQUIRED_ASSETS,
  });
});

// ── POST /start ───────────────────────────────────────────────────
router.post('/start', requireAuth, async (req, res, next) => {
  try {
    const id = uuid();
    await query(
      `INSERT INTO adaptive_screening_sessions (id, user_id, status)
       VALUES ($1, $2, 'in_progress')`,
      [id, req.user.id]
    );
    res.status(201).json({ sessionId: id, status: 'in_progress' });
  } catch (err) { next(err); }
});

// ── POST /answer ──────────────────────────────────────────────────
// body: { sessionId, questionId, studentAnswer }
router.post('/answer', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, questionId, studentAnswer } = req.body;
    const q = bankById[questionId];
    if (!sessionId || !q) return res.status(400).json({ error: 'sessionId and valid questionId required' });

    const s = engine.scoreAnswer(q, studentAnswer);
    await query(
      `INSERT INTO adaptive_screening_answers
        (id, session_id, question_id, subject, skill, difficulty, question_type,
         scoring_method, student_answer, awarded, points, is_correct, needs_ai)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)`,
      [uuid(), sessionId, q.id, q.subject, q.skill, q.difficulty, q.questionType,
       q.scoringMethod, JSON.stringify(studentAnswer ?? null),
       s.awarded, s.points, s.needsAI ? null : s.correct, s.needsAI]
    );
    res.json({ recorded: true, needsAI: s.needsAI, correct: s.needsAI ? null : s.correct });
  } catch (err) { next(err); }
});

// ── POST /submit ──────────────────────────────────────────────────
// body: { sessionId, answers?: [{id, studentAnswer}], durationSeconds? }
// answers[] is optional — if provided (one-shot submit) we score them all;
// otherwise we use whatever was recorded via /answer.
router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, answers, durationSeconds } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // One-shot submit path: persist provided answers first.
    if (Array.isArray(answers) && answers.length) {
      for (const a of answers) {
        const q = bankById[a.id || a.questionId];
        if (!q) continue;
        const s = engine.scoreAnswer(q, a.studentAnswer);
        await query(
          `INSERT INTO adaptive_screening_answers
            (id, session_id, question_id, subject, skill, difficulty, question_type,
             scoring_method, student_answer, awarded, points, is_correct, needs_ai)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)`,
          [uuid(), sessionId, q.id, q.subject, q.skill, q.difficulty, q.questionType,
           q.scoringMethod, JSON.stringify(a.studentAnswer ?? null),
           s.awarded, s.points, s.needsAI ? null : s.correct, s.needsAI]
        );
      }
    }

    // Load all recorded answers for this session.
    const { rows } = await query(
      `SELECT question_id, awarded, needs_ai FROM adaptive_screening_answers
       WHERE session_id = $1`,
      [sessionId]
    );
    const askedQuestions = rows.map((r) => bankById[r.question_id]).filter(Boolean);
    const answerRecords = rows.map((r) => ({
      id: r.question_id,
      awarded: Number(r.awarded) || 0,
      needsAI: r.needs_ai,
    }));

    // Build result + personalized next-test plan (pure engine).
    const result = engine.buildScreeningResult({ questions: askedQuestions, answers: answerRecords });
    const nextTest = engine.generateNextLevelTestBlueprint(result, { totalQuestions: 20 });

    await query(
      `UPDATE adaptive_screening_sessions
         SET status='completed', completed_at=NOW(),
             duration_seconds=$2, result_data=$3::jsonb, next_test_plan=$4::jsonb
       WHERE id=$1`,
      [sessionId, durationSeconds || null, JSON.stringify(result), JSON.stringify(nextTest)]
    );

    res.json({ sessionId, result, nextTest });
  } catch (err) { next(err); }
});

// ── GET /result/:sessionId ────────────────────────────────────────
router.get('/result/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, status, started_at, completed_at, duration_seconds, result_data, next_test_plan
         FROM adaptive_screening_sessions WHERE id=$1 AND user_id=$2`,
      [req.params.sessionId, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    const r = rows[0];
    res.json({
      sessionId: r.id, status: r.status,
      startedAt: r.started_at, completedAt: r.completed_at,
      durationSeconds: r.duration_seconds,
      result: r.result_data, nextTest: r.next_test_plan,
    });
  } catch (err) { next(err); }
});

// ── GET /history ──────────────────────────────────────────────────
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, status, started_at, completed_at,
              result_data->'overall' AS overall
         FROM adaptive_screening_sessions
        WHERE user_id=$1 ORDER BY started_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ sessions: rows });
  } catch (err) { next(err); }
});

// ── GET /next-test/:sessionId ─────────────────────────────────────
router.get('/next-test/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT next_test_plan FROM adaptive_screening_sessions
        WHERE id=$1 AND user_id=$2`,
      [req.params.sessionId, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json({ nextTest: rows[0].next_test_plan });
  } catch (err) { next(err); }
});

// ── Phase 5: Gemma-powered helpers (AI never sets a score) ────────

// POST /explain  { questionId, studentAnswer }
// Beginner-friendly explanation of a (wrong) answer.
router.post('/explain', requireAuth, async (req, res, next) => {
  try {
    const { questionId, studentAnswer } = req.body;
    const q = bankById[questionId];
    if (!q) return res.status(400).json({ error: 'valid questionId required' });
    const out = await gemma.explainMistake({
      question: q, studentAnswer,
      correctAnswer: q.correctAnswer, skill: q.skill, subject: q.subject,
    });
    res.json(out);
  } catch (err) { next(err); }
});

// POST /extra-practice  { subject, skill, difficulty?, count? }
// AI-generated extra practice for a weak skill (falls back to [] + recs).
router.post('/extra-practice', requireAuth, async (req, res, next) => {
  try {
    const { subject, skill, difficulty, count } = req.body;
    if (!subject || !skill) return res.status(400).json({ error: 'subject and skill required' });
    const ai = await gemma.generateExtraPractice({ subject, skill, difficulty, count: count || 3 });
    res.json({
      ...ai,
      recommendedPractice: engine.recommendedPracticeFor(subject, skill),
    });
  } catch (err) { next(err); }
});

// POST /conversation  { history?, level?, topic? }
// One turn of conversational practice.
router.post('/conversation', requireAuth, async (req, res, next) => {
  try {
    const { history, level, topic } = req.body;
    const out = await gemma.generateConversationTurn({ history, level, topic });
    res.json(out);
  } catch (err) { next(err); }
});

// GET /practice-recommendations/:sessionId
// Maps a completed session's weak/developing skills to practice links the
// Practice module can consume. Read-only — does NOT modify the Practice module.
router.get('/practice-recommendations/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT result_data FROM adaptive_screening_sessions
        WHERE id=$1 AND user_id=$2`,
      [req.params.sessionId, req.user.id]
    );
    if (!rows.length || !rows[0].result_data) return res.status(404).json({ error: 'Session not found' });
    const result = rows[0].result_data;
    const focus = (result.summary?.needsSupport || []).concat(result.summary?.developing || []);

    // Determine each focus skill's subject from the stored per-skill result.
    const subjectOf = (skill) =>
      result.skills?.English?.[skill] ? 'English'
      : result.skills?.Mathematics?.[skill] ? 'Mathematics' : 'Unknown';

    const recommendations = focus.map((skill) => ({
      subject: subjectOf(skill),
      skill,
      band: result.skills?.English?.[skill]?.band || result.skills?.Mathematics?.[skill]?.band,
      startLevel: 1,
      activities: engine.recommendedPracticeFor(subjectOf(skill), skill),
      // link the existing Practice module can route to (category = skill)
      practiceLink: `/student/practice?focus=${encodeURIComponent(skill)}`,
    }));

    res.json({ sessionId: req.params.sessionId, recommendations });
  } catch (err) { next(err); }
});

module.exports = router;
