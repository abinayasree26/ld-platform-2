/**
 * LD Practice Routes — Adaptive Practice Engine (FR-03)
 * Enhanced with adaptive difficulty, spaced repetition, and AI feedback.
 *
 * Routes:
 *   GET  /api/ld/practice/start          — Start adaptive session
 *   GET  /api/ld/practice/next-exercise   — Get next adaptive exercise
 *   POST /api/ld/practice/answer          — Submit answer (returns AI feedback)
 *   POST /api/ld/practice/complete        — End session
 *   GET  /api/ld/practice/progress        — Overall progress
 *   GET  /api/ld/practice/history         — Past sessions
 *   GET  /api/ld/practice/streak          — Streak info
 *   GET  /api/ld/practice/exercises       — Get exercises (legacy/direct)
 *   POST /api/ld/practice/sessions/sync   — Offline sync
 */

const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const practiceEngine = require('../../services/practiceEngine');
const llamaService = require('../../services/llamaService');
const questionPool = require('../../services/questionPool');

// ═══════════════════════════════════════════════════════════════════
// ADAPTIVE ENGINE ROUTES (NEW — FR-03)
// ═══════════════════════════════════════════════════════════════════

// POST /generate — AI-generated, grade & level aware practice questions.
// Fresh questions each time (no repeats on retake). Frontend falls back to
// its built-in questions if this returns null (AI offline/slow).
router.post('/generate', requireAuth, async (req, res, next) => {
  try {
    const { category, count } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });

    let profile = {};
    try {
      const { rows } = await query(
        `SELECT class_grade, age, current_level, ld_type FROM students WHERE user_id = $1`,
        [req.user.id]
      );
      profile = rows[0] || {};
    } catch { /* no profile - AI uses level only */ }

    const grade = profile.class_grade || null;
    const level = profile.current_level || 1;
    const ldType = profile.ld_type || 'not_detected';
    const n = count || 5;

    // ONLINE: generate fresh via AI, filtering out anything the student has
    // already seen so retakes are genuinely new (not mostly repeats).
    if (await llamaService.isAvailable()) {
      const seen = await questionPool.getSeenTexts(req.user.id, { scope: 'practice', category });
      const norm = (s) => String(s || '').trim().toLowerCase();
      const collected = [];
      const collectedKeys = new Set();

      // Up to 3 passes: over-generate, drop seen + in-batch duplicates, until we have n fresh ones.
      for (let attempt = 0; attempt < 3 && collected.length < n; attempt++) {
        const batch = await llamaService.generatePracticeQuestions({
          category, grade, age: profile.age, level, ldType,
          count: n + 5, // over-generate to survive filtering
        });
        if (!batch || !batch.length) break;
        for (const q of batch) {
          const key = norm(q.q);
          if (!key || seen.has(key) || collectedKeys.has(key)) continue;
          collectedKeys.add(key);
          collected.push(q);
          if (collected.length >= n) break;
        }
      }

      if (collected.length) {
        const fresh = collected.slice(0, n);
        // Save to the pool, then mark the saved rows as seen so they never
        // repeat for this student on the next attempt.
        const savedIds = await questionPool.savePooled({
          scope: 'practice', category, grade, level, ldType, questions: fresh,
        });
        if (savedIds && savedIds.length) {
          questionPool.markSeen(req.user.id, savedIds).catch(() => {});
        }
        return res.json({ questions: fresh, source: 'ai', grade, level });
      }
    }

    // OFFLINE (or AI failed): serve from the stored pool, avoiding repeats.
    const pooled = await questionPool.getPooled({ scope: 'practice', category, grade, level, userId: req.user.id, count: n });
    if (pooled && pooled.length) {
      questionPool.markSeen(req.user.id, pooled.map(q => q._poolId)).catch(() => {});
      const clean = pooled.map(({ _poolId, ...q }) => q);
      return res.json({ questions: clean, source: 'pool', grade, level });
    }

    // Last resort: frontend uses its built-in hardcoded questions.
    return res.json({ questions: null, source: 'fallback', reason: 'no_pool_no_ai' });
  } catch (err) { next(err); }
});

// GET /start — Start an adaptive practice session
router.get('/start', requireAuth, async (req, res, next) => {
  try {
    const result = await practiceEngine.startSession(req.user.id);
    res.json({
      ...result,
      message: result.resumed
        ? 'Resuming your practice session'
        : "Practice session started! Let's go! 🚀",
    });
  } catch (err) { next(err); }
});

// POST /quick-submit — Save a quick practice session (from the hardcoded category quiz)
router.post('/quick-submit', requireAuth, async (req, res, next) => {
  try {
    const { category, exercises_total, exercises_correct } = req.body;
    if (!category || !exercises_total) {
      return res.status(400).json({ error: 'category and exercises_total required' });
    }
    const id = uuid();
    // NOTE: shared DB uses student_id (not user_id) on practice_sessions.
    await query(
      `INSERT INTO practice_sessions (id, student_id, session_type, status, exercises_total, exercises_correct, completed_at)
       VALUES ($1, $2, $3, 'completed', $4, $5, NOW())`,
      [id, req.user.id, category, exercises_total || 0, exercises_correct || 0]
    );

    // ── Update streak on the students table (what the dashboard reads) ──
    // Compare last activity date to today: same day = no change, yesterday =
    // +1, older/none = reset to 1.
    try {
      const st = (await query(
        'SELECT streak_count, last_activity_at FROM students WHERE user_id = $1',
        [req.user.id]
      )).rows[0] || {};
      const last = st.last_activity_at ? new Date(st.last_activity_at) : null;
      let newStreak;
      if (!last) {
        newStreak = 1;
      } else {
        const dayMs = 24 * 60 * 60 * 1000;
        const d0 = new Date(new Date().toDateString()).getTime();
        const d1 = new Date(last.toDateString()).getTime();
        const diffDays = Math.round((d0 - d1) / dayMs);
        if (diffDays === 0) newStreak = st.streak_count || 1;      // already today
        else if (diffDays === 1) newStreak = (st.streak_count || 0) + 1; // consecutive
        else newStreak = 1;                                        // gap -> reset
      }
      await query(
        `UPDATE students SET streak_count = $2, last_activity_at = NOW() WHERE user_id = $1`,
        [req.user.id, newStreak]
      );
    } catch (e) { /* streak update is best-effort */ }

    res.json({ success: true, session_id: id });
  } catch (err) { next(err); }
});

// GET /next-exercise — Get next adaptive exercise in active session
router.get('/next-exercise', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }

    const result = await practiceEngine.getNextExercise(sessionId, req.user.id);
    if (result.complete) {
      return res.json({
        complete: true,
        totalAnswered: result.totalAnswered,
        message: 'Great job! You finished all exercises! 🎉',
      });
    }
    res.json(result);
  } catch (err) { next(err); }
});

// POST /answer — Submit an answer for the current exercise
router.post('/answer', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, exerciseId, answer, durationSeconds } = req.body;
    if (!sessionId || !exerciseId || answer === undefined) {
      return res.status(400).json({ error: 'sessionId, exerciseId, and answer are required' });
    }

    const result = await practiceEngine.submitAnswer(
      sessionId, req.user.id, exerciseId, answer, durationSeconds || 0
    );

    // Encouraging response messages
    let message = '';
    if (result.isCorrect) {
      const msgs = ['Correct! 🌟', 'Great job! ⭐', 'You got it! 🎯', 'Wonderful! ✨', 'Perfect! 💫'];
      message = msgs[Math.floor(Math.random() * msgs.length)];
      if (result.streak >= 3) message += ` ${result.streak} in a row! 🔥`;
    } else {
      message = "Almost! Let's learn from this 💡";
    }

    if (result.levelChange?.levelChanged) {
      if (result.levelChange.direction === 'up') {
        message = `🎉 LEVEL UP! You're now Level ${result.levelChange.toLevel}! Keep shining! ⭐`;
      } else {
        message = "Let's practice a bit more at this level — you're doing great! 💪";
      }
    }

    res.json({ ...result, message });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// POST /complete — End the session, store stats
router.post('/complete', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const result = await practiceEngine.completeSession(sessionId, req.user.id);

    let message = 'Practice complete! ';
    if (result.accuracy >= 80) message += "Amazing work — you're a star! 🌟";
    else if (result.accuracy >= 60) message += 'Good effort! Keep practicing! 💪';
    else message += 'Great try! Every practice makes you stronger! 🌱';

    res.json({ ...result, message });
  } catch (err) { next(err); }
});

// GET /progress — Overall progress (level, streak, mastery)
router.get('/progress', requireAuth, async (req, res, next) => {
  try {
    const progress = await practiceEngine.getProgress(req.user.id);
    res.json(progress);
  } catch (err) { next(err); }
});

// GET /history — Past sessions
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const sessions = await practiceEngine.getHistory(req.user.id, limit);
    res.json({ sessions });
  } catch (err) { next(err); }
});

// GET /streak — Streak info with last 7 days
router.get('/streak', requireAuth, async (req, res, next) => {
  try {
    const streak = await practiceEngine.getStreak(req.user.id);
    res.json(streak);
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
// LEGACY ROUTES (backward-compatible)
// ═══════════════════════════════════════════════════════════════════

// GET /exercises — Get exercises by type/level (direct fetch)
router.get('/exercises', requireAuth, async (req, res, next) => {
  try {
    const { type, level } = req.query;
    const state = await practiceEngine.getStudentState(req.user.id);
    const targetLevel = level || state?.current_level || 1;

    const vals = [targetLevel];
    const typeFilter = type ? `AND type=$${vals.push(type)}` : '';
    const { rows } = await query(
      `SELECT id, type, level, title, instructions, content, media_url
       FROM exercises WHERE level=$1 AND is_active=TRUE ${typeFilter}
       ORDER BY RANDOM() LIMIT 10`,
      vals
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /sessions/start — Legacy session start (simple)
router.post('/sessions/start', requireAuth, async (req, res, next) => {
  try {
    const { session_type = 'practice' } = req.body;
    const { rows } = await query(
      `INSERT INTO practice_sessions (id, student_id, session_type, status)
       VALUES ($1,$2,$3,'active') RETURNING *`,
      [uuid(), req.user.id, session_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// POST /sessions/:sessionId/attempt — Legacy attempt recording
router.post('/sessions/:sessionId/attempt', requireAuth, async (req, res, next) => {
  try {
    const { exercise_id, user_answer, correct_answer, score, duration_seconds, error_type } = req.body;
    const correct = String(user_answer).toLowerCase().trim() === String(correct_answer).toLowerCase().trim();

    await query(
      `INSERT INTO practice_session_exercises
         (id, session_id, exercise_id, user_answer, is_correct, score, duration_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [uuid(), req.params.sessionId, exercise_id, user_answer, correct || (score >= 70), score || 0, duration_seconds || 0]
    );

    if (!correct && error_type) {
      await query(
        `INSERT INTO student_errors (id, student_id, exercise_id, error_type)
         VALUES ($1,$2,$3,$4)`,
        [uuid(), req.user.id, exercise_id, error_type]
      );
    }

    res.json({ correct, score });
  } catch (err) { next(err); }
});

// POST /sessions/:sessionId/complete — Legacy session complete
router.post('/sessions/:sessionId/complete', requireAuth, async (req, res, next) => {
  try {
    const { duration_minutes } = req.body;
    await query(
      `UPDATE practice_sessions SET status='completed', duration_minutes=$1, completed_at=NOW()
       WHERE id=$2 AND student_id=$3`,
      [duration_minutes || 0, req.params.sessionId, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /errors — Error summary
router.get('/errors', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT error_type, COUNT(*)::int AS count FROM student_errors
       WHERE student_id=$1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY error_type ORDER BY count DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /sessions/sync — Offline sync
router.post('/sessions/sync', requireAuth, async (req, res, next) => {
  try {
    const { sessions } = req.body;
    let synced = 0;
    for (const s of (sessions || [])) {
      const exists = (await query('SELECT 1 FROM practice_sessions WHERE id=$1', [s.id])).rows.length;
      if (!exists) {
        await query(
          `INSERT INTO practice_sessions (id, student_id, session_type, status, duration_minutes, created_at)
           VALUES ($1,$2,$3,'completed',$4,$5) ON CONFLICT DO NOTHING`,
          [s.id, req.user.id, s.session_type || 'practice', s.duration_minutes || 0, s.created_at || new Date()]
        );
        synced++;
      }
    }
    res.json({ synced });
  } catch (err) { next(err); }
});

module.exports = router;
