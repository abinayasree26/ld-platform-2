const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const { classifyLD } = require('../../services/ldClassifier');

// Get screening questions
router.get('/questions', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, question_text, question_type, options, correct_answer, category, order_index
       FROM screening_questions WHERE is_active=TRUE
       ORDER BY order_index`
    );
    res.json({ questions: rows, totalQuestions: rows.length, estimatedMinutes: 15 });
  } catch (err) { next(err); }
});

// Submit screening answers — uses AI classifier (llama.cpp) with rule-based fallback
router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const { answers, duration_seconds } = req.body;
    if (!Array.isArray(answers) || !answers.length) return res.status(400).json({ error: 'answers[] required' });

    // ── Server-side scoring (never trust client-sent is_correct) ──
    // Look up the real correct answers + metadata from the DB for the
    // submitted question IDs, then compute correctness on the server.
    const ids = answers.map(a => a.question_id).filter(Boolean);
    let qmap = {};
    if (ids.length) {
      const { rows } = await query(
        `SELECT id, question_text, category, correct_answer
         FROM screening_questions WHERE id = ANY($1)`,
        [ids]
      );
      qmap = Object.fromEntries(rows.map(q => [String(q.id), q]));
    }

    // Normalize for a robust comparison (case/space tolerant)
    const norm = (v) => (v === null || v === undefined ? '' : String(v).trim().toLowerCase());

    const classifierInput = answers.map(a => {
      const q = qmap[String(a.question_id)] || {};
      const correctAnswer = q.correct_answer;
      const isCorrect = correctAnswer !== undefined && correctAnswer !== null
        ? norm(a.student_answer) === norm(correctAnswer)
        : false;
      return {
        questionText: q.question_text || a.question_text || `Question ${a.question_id}`,
        category: q.category || a.category || 'reading',
        ld_target: a.ld_target || q.category || null,
        studentAnswer: a.student_answer,
        correctAnswer,
        isCorrect,
        responseTimeMs: a.response_time_ms || 0,
      };
    });

    // Run AI classification (falls back to rule-based if no API key)
    const result = await classifyLD(classifierInput);

    const sessionId = uuid();
    await query(
      `INSERT INTO screening_sessions (id, user_id, status, ld_type_detected, risk_score, result_data, completed_at)
       VALUES ($1,$2,'completed',$3,$4,$5,NOW())`,
      [sessionId, req.user.id, result.ldType, result.riskScore, JSON.stringify(result)]
    );
    await query(
      `INSERT INTO students (user_id, ld_type, ld_risk_score, current_level, last_screened_at)
       VALUES ($1,$2,$3,1,NOW())
       ON CONFLICT (user_id) DO UPDATE SET ld_type=$2, ld_risk_score=$3, last_screened_at=NOW()`,
      [req.user.id, result.ldType, result.riskScore]
    );

    res.json({
      sessionId,
      ldType: result.ldType,
      overallRiskScore: result.riskScore,
      breakdown: result.breakdown || null,
      recommendations: result.recommendations || [],
      reasoning: result.reasoning || '',
      classifiedBy: result.classifiedBy || 'unknown',
    });
  } catch (err) { next(err); }
});

// Screening status
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ss.*, s.ld_type, s.ld_risk_score FROM screening_sessions ss
       LEFT JOIN students s ON s.user_id = ss.user_id
       WHERE ss.user_id=$1 ORDER BY ss.created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!rows[0] || rows[0].status !== 'completed') {
      return res.json({ screened: false, status: rows[0]?.status || 'not_started' });
    }
    res.json({ screened: true, ...rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
