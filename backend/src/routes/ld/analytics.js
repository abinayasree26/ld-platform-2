/**
 * LD Student Analytics Route — Production endpoint
 * Returns the full dashboard data in the same shape as demoMode.
 * 
 * GET /api/ld/analytics/student — Student dashboard data
 * GET /api/ld/analytics/parent  — Parent scorecard data
 * GET /api/ld/analytics/admin   — Admin overview data
 */

const router = require('express').Router();
const { query } = require('../../config/database');
const { requireAuth, requireRole } = require('../../middleware/auth');

const MOTIVATIONAL_QUOTES = [
  'Every expert was once a beginner. Keep going! 🌟',
  'Practice makes progress! 📈',
  'Your brain is growing stronger every day! 🧠',
  'Small steps lead to big changes! 👣',
  'You can do hard things! 💪',
  'Mistakes help your brain learn! 💡',
];

// ─── GET /student — Full student dashboard data ─────────────────────────
router.get('/student', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [
      studentRow,
      screeningRow,
      sessionsRows,
      categoryRows,
      weekActivityRows,
      totalStatsRow,
    ] = await Promise.all([
      // Student profile
      query(`
        SELECT s.current_level, s.streak_count, s.longest_streak, s.ld_type, s.ld_risk_score,
               s.last_screened_at, u.name
        FROM students s JOIN users u ON u.id = s.user_id
        WHERE s.user_id = $1
      `, [uid]).catch(() => ({ rows: [] })),

      // Latest screening
      query(`
        SELECT ld_type, risk_score, created_at
        FROM screenings WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 1
      `, [uid]).catch(() => ({ rows: [] })),

      // Recent practice sessions
      query(`
        SELECT id, score, duration_minutes, exercises_count, DATE(created_at) as date
        FROM practice_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 10
      `, [uid]).catch(() => ({ rows: [] })),

      // Category mastery (aggregate from answers)
      query(`
        SELECT category, 
               ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 1) as mastery,
               COUNT(*) as attempts
        FROM practice_answers
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY category
        ORDER BY mastery ASC
      `, [uid]).catch(() => ({ rows: [] })),

      // This week's activity (Mon-Sun)
      query(`
        SELECT DATE(created_at) as day
        FROM practice_sessions
        WHERE user_id = $1
          AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
          AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
        GROUP BY day
      `, [uid]).catch(() => ({ rows: [] })),

      // Total stats
      query(`
        SELECT 
          COUNT(*)::int as total_sessions,
          COALESCE(SUM(duration_minutes), 0)::int as total_minutes,
          COALESCE(ROUND(AVG(score), 1), 0) as avg_score
        FROM practice_sessions
        WHERE user_id = $1
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `, [uid]).catch(() => ({ rows: [] })),
    ]);

    const student = studentRow.rows[0] || {};
    const screening = screeningRow.rows[0] || {};
    const sessions = sessionsRows.rows || [];
    const categories = categoryRows.rows || [];
    const weekActivity = weekActivityRows.rows || [];
    const totalStats = totalStatsRow.rows[0] || {};

    // Build progressHistory from sessions (last 30 days)
    const progressHistory = sessions.slice(0, 30).reverse().map(s => ({
      date: s.date,
      mastery: Number(s.score) || 0,
    }));

    // Build weekDays array (Mon=0 to Sun=6)
    const weekStart = getMonday(new Date());
    const practicedDays = new Set(weekActivity.map(r => r.day?.toISOString?.().slice(0, 10) || r.day));
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7; // Mon=0
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      if (i > todayIdx) return null; // future
      return practicedDays.has(key);
    });

    // Build category mastery with trend
    const categoryMastery = categories.map(c => ({
      category: c.category,
      mastery: Number(c.mastery) || 0,
      trend: Number(c.mastery) >= 70 ? 'up' : Number(c.mastery) >= 40 ? 'stable' : 'down',
    }));

    // Determine if test ready (mastery avg > 65%)
    const avgMastery = categoryMastery.length > 0
      ? categoryMastery.reduce((s, c) => s + c.mastery, 0) / categoryMastery.length
      : 0;

    const level = student.current_level || 1;

    res.json({
      name: student.name || req.user.name || 'Student',
      level,
      streak: student.streak_count || 0,
      totalPracticeMinutes: totalStats.total_minutes || 0,
      mastery: Math.round(avgMastery) || 0,
      ldType: screening.ld_type || student.ld_type || null,
      riskScore: screening.risk_score || student.ld_risk_score || null,
      lastScreeningDate: screening.created_at ? new Date(screening.created_at).toISOString().slice(0, 10) : null,
      weeklyGoal: { target: 5, completed: weekDays.filter(d => d === true).length },
      categoryMastery,
      progressHistory,
      recentSessions: sessions.slice(0, 5).map(s => ({
        id: s.id,
        date: s.date,
        score: Number(s.score) || 0,
        duration: s.duration_minutes || 0,
        exercises: s.exercises_count || 0,
      })),
      weekDays,
      testReady: avgMastery >= 65 && student.streak_count >= 3,
      totalPractices: totalStats.total_sessions || 0,
      totalTests: 0, // TODO: count from test_attempts
      avgScore: Number(totalStats.avg_score) || 0,
      quote: MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    });
  } catch (err) { next(err); }
});

// ─── GET /parent — Parent scorecard ─────────────────────────────────────
router.get('/parent', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;

    // Find the parent's child
    const childRow = await query(`
      SELECT s.user_id as child_id, u.name, s.current_level, s.ld_type, s.ld_risk_score, s.streak_count
      FROM parent_student_links psl
      JOIN students s ON s.user_id = psl.student_id
      JOIN users u ON u.id = psl.student_id
      WHERE psl.parent_id = $1
      LIMIT 1
    `, [uid]).catch(() => ({ rows: [] }));

    if (!childRow.rows[0]) {
      return res.status(404).json({ error: 'No linked child found' });
    }

    const child = childRow.rows[0];
    res.json({
      child: { name: child.name, level: child.current_level },
      ldType: child.ld_type,
      currentLevel: child.current_level,
      riskScore: child.ld_risk_score,
      streak: child.streak_count,
    });
  } catch (err) { next(err); }
});

// ─── GET /admin — Admin overview ────────────────────────────────────────
router.get('/admin', requireAuth, requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;

    const [total, screened, ldDist] = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM users WHERE role = 'student' AND school_id = $1`, [schoolId]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(DISTINCT user_id)::int as count FROM screenings WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)`, [schoolId]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`
        SELECT ld_type as type, COUNT(*)::int as count
        FROM screenings
        WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)
        GROUP BY ld_type
      `, [schoolId]).catch(() => ({ rows: [] })),
    ]);

    res.json({
      totalStudents: total.rows[0]?.count || 0,
      screenedCount: screened.rows[0]?.count || 0,
      ldDistribution: ldDist.rows,
    });
  } catch (err) { next(err); }
});

// Helper: Get Monday of current week
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

module.exports = router;
