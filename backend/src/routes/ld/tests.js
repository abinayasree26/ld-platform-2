/**
 * LD Level Tests Route — 5 progressive levels, 70% to pass
 * 
 * GET  /api/ld/tests/levels        — Get all levels with unlock status
 * GET  /api/ld/tests/questions      — Get questions for a level (?level=N)
 * POST /api/ld/tests/submit         — Submit test answers
 * GET  /api/ld/tests/history        — Get attempt history
 * 
 * Frontend contract (what ld-exam-web expects):
 *   GET /levels     → { levels: [{ level, label, unlocked }] }
 *   GET /questions  → { questions: [{ id, question_text, options, ... }] }
 *   POST /submit    → body: { level, answers: [{ questionId, studentAnswer }], time_taken_ms }
 *                     returns: { score, passed, correct, total, ... }
 */

const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const { generateWrongAnswerFeedback } = require('../../services/llamaService');

// ─── GET /levels — All levels with unlock status ────────────────────
router.get('/levels', requireAuth, async (req, res, next) => {
  try {
    const student = (await query('SELECT current_level FROM students WHERE user_id=$1', [req.user.id])).rows[0];
    const current = student?.current_level || 1;
    const levels = [1, 2, 3, 4, 5].map((l) => ({
      level: l,
      label: ['Starter', 'Basic', 'Intermediate', 'Advanced', 'Mastery'][l - 1],
      unlocked: l <= current,
      isCurrent: l === current,
    }));
    // Frontend expects { levels: [...] }
    res.json({ levels });
  } catch (err) { next(err); }
});

// ─── GET /questions — Questions for a specific level ────────────────
router.get('/questions', requireAuth, async (req, res, next) => {
  try {
    const level = parseInt(req.query.level) || 1;
    const { rows } = await query(
      `SELECT id, level, question_type, question_text, options, correct_answer, media_url, audio_url
       FROM test_questions WHERE level=$1 AND is_active=TRUE
       ORDER BY RANDOM() LIMIT 20`,
      [level]
    );
    // Frontend expects { questions: [...] }
    res.json({ questions: rows });
  } catch (err) { next(err); }
});

// ─── POST /submit — Submit test answers ─────────────────────────────
router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const { level, answers, time_taken_ms, duration_seconds } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers[] required' });

    let correct = 0;
    const review = [];

    for (const a of answers) {
      // Frontend sends { questionId, studentAnswer } — normalize field names
      const qId = a.questionId || a.question_id;
      const studentAns = a.studentAnswer || a.answer;

      const q = (await query(
        'SELECT question_text, question_type, correct_answer FROM test_questions WHERE id=$1',
        [qId]
      )).rows[0];

      const isCorrect = !!q && String(q.correct_answer).trim().toLowerCase() === String(studentAns).trim().toLowerCase();
      if (isCorrect) correct++;
      review.push({ question_id: qId, your_answer: studentAns, is_correct: isCorrect, q });
    }

    const score = Math.round((correct / answers.length) * 100);
    const passed = score >= 70;
    const durationSec = duration_seconds || (time_taken_ms ? Math.round(time_taken_ms / 1000) : 0);

    const attemptId = uuid();
    await query(
      `INSERT INTO test_attempts (id, user_id, level, score, passed, duration_seconds, answers)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [attemptId, req.user.id, level, score, passed, durationSec, JSON.stringify(answers)]
    );

    if (passed) {
      await query(
        'UPDATE students SET current_level=LEAST(current_level+1,5) WHERE user_id=$1 AND current_level=$2',
        [req.user.id, level]
      );
      await query(
        `INSERT INTO level_history (id, user_id, from_level, to_level, trigger)
         VALUES ($1,$2,$3,$4,'test_pass') ON CONFLICT DO NOTHING`,
        [uuid(), req.user.id, level, Math.min(level + 1, 5)]
      );
    }

    // AI feedback on wrong answers — warm, simple explanation + memory hook
    const wrong = review.filter((r) => !r.is_correct && r.q);
    let student = null;
    if (wrong.length) {
      student = (await query('SELECT age, ld_type FROM students WHERE user_id=$1', [req.user.id])).rows[0];
    }
    await Promise.all(wrong.map(async (r) => {
      r.feedback = await generateWrongAnswerFeedback({
        questionText: r.q.question_text,
        studentAnswer: r.your_answer,
        correctAnswer: r.q.correct_answer,
        questionType: r.q.question_type,
        studentAge: student?.age,
        ldType: student?.ld_type,
      });
    }));

    const reviewOut = review.map((r) => ({
      question_id: r.question_id,
      question_text: r.q?.question_text,
      your_answer: r.your_answer,
      correct_answer: r.q?.correct_answer,
      is_correct: r.is_correct,
      feedback: r.feedback || null,
    }));

    // Response shape matches what frontend expects
    res.json({
      score,
      scorePercent: score,
      passed,
      correct,
      correctCount: correct,
      total: answers.length,
      totalQuestions: answers.length,
      attemptId,
      leveledUp: passed && level < 5,
      review: reviewOut,
      timeTakenSeconds: durationSec,
    });
  } catch (err) { next(err); }
});

// ─── GET /history — Attempt history ─────────────────────────────────
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM test_attempts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ attempts: rows });
  } catch (err) { next(err); }
});

module.exports = router;
