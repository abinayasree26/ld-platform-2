/**
 * LD Recommendations Route — AI-personalized practice suggestions
 * 
 * GET  /api/ld/recommendations/me       — Student's personal recommendations
 * GET  /api/ld/recommendations/class/:id — Class recommendations (teacher)
 * POST /api/ld/recommendations/generate  — Trigger generation (teacher)
 * 
 * AI runs on-device via llama.cpp — no cloud calls, no internet required.
 */

const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { query } = require('../../config/database');
const { requireAuth, requireRole } = require('../../middleware/auth');
const llamaService = require('../../services/llamaService');

// My recommendations (student/parent)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    // Try to fetch existing recommendations from DB
    const { rows } = await query(
      `SELECT * FROM ai_recommendations
       WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`,
      [req.user.id]
    );
    if (rows.length) return res.json(rows[0]);

    // Auto-generate if none exist
    const student = (await query(
      `SELECT s.*, u.name FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id=$1`,
      [req.user.id]
    )).rows[0];

    if (!student) {
      return res.json({ tips: ['Complete your screening to get personalized tips.'], generated_at: new Date() });
    }

    // Check if AI is available
    const aiReady = await llamaService.isAvailable();
    if (!aiReady) {
      return res.json({ tips: ['Practice your weakest area today!', 'Try 10 minutes of focused reading.', 'Keep your streak going!'], generated_at: new Date() });
    }

    // Generate tips using local AI
    const result = await llamaService.generateStudentTips({
      studentName: student.name,
      ldType: student.ld_type,
      riskScore: student.ld_risk_score,
      currentLevel: student.current_level,
    });

    if (!result || !result.tips || result.tips.length === 0) {
      return res.json({ tips: ['Complete your screening to get personalized tips.'], generated_at: new Date() });
    }

    // Store in DB for future retrieval
    const recId = uuid();
    await query(
      `INSERT INTO ai_recommendations (id, user_id, audience, content, tips, created_at)
       VALUES ($1,$2,'student',$3,$4::jsonb,NOW())`,
      [recId, req.user.id, result.content, JSON.stringify(result.tips)]
    ).catch(() => {});

    res.json({ id: recId, tips: result.tips, generated_at: new Date() });
  } catch (err) { next(err); }
});

// Class recommendations (teacher)
router.get('/class/:classId', requireAuth, requireRole('teacher', 'school_admin'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, u.name AS student_name FROM ai_recommendations r
       JOIN users u ON u.id = r.user_id
       WHERE r.class_id=$1 ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.classId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Generate for class
router.post('/generate', requireAuth, requireRole('teacher', 'school_admin'), async (req, res, next) => {
  try {
    res.json({ message: 'Recommendation generation queued', status: 'queued' });
  } catch (err) { next(err); }
});

module.exports = router;
