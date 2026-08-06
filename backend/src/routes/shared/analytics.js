const router = require('express').Router();
const { query } = require('../../config/database');
const { requireAuth, requireRole } = require('../../middleware/auth');

// School dashboard stats (for school mobile / school ERP dashboard)
router.get('/dashboard', requireAuth, requireRole('teacher', 'school_admin', 'super_admin'), async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const today    = new Date().toISOString().slice(0, 10);

    const [students, present, fees] = await Promise.all([
      query('SELECT COUNT(*)::int AS total FROM users WHERE school_id = $1 AND role = $2', [schoolId, 'student']),
      query(
        `SELECT COUNT(*)::int AS present FROM student_attendance
         WHERE date = $1 AND status = 'present' AND
               student_id IN (SELECT id FROM users WHERE school_id = $2)`,
        [today, schoolId]
      ),
      query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS collected
         FROM fee_transactions WHERE school_id = $1 AND DATE(created_at) = $2`,
        [schoolId, today]
      ),
    ]);

    res.json({
      as_of:      today,
      students:   students.rows[0].total,
      attendance: { present: present.rows[0].present },
      fees:       { collected_today: fees.rows[0].collected },
    });
  } catch (err) { next(err); }
});

// Student personal analytics — full dashboard stats computed from the real DB
router.get('/student/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.id;

    const [profile, trend, errors, totals, cats, recent, weekRows] = await Promise.all([
      query(`SELECT streak_count, current_level FROM students WHERE user_id = $1`, [uid]),
      query(
        // Individual attempts (most recent 15) so the progress line shows even
        // when all attempts happen on the same day. Ordered oldest->newest.
        `SELECT attempted_at AS created_at, score_percent AS score
         FROM test_attempts WHERE student_id = $1
         ORDER BY attempted_at DESC LIMIT 15`,
        [uid]
      ),
      query(
        `SELECT error_type, COUNT(*)::int AS count
         FROM student_errors WHERE student_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY error_type ORDER BY count DESC LIMIT 5`,
        [uid]
      ),
      // Aggregate totals from real tables
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM practice_sessions WHERE student_id = $1 AND status='completed') AS total_practices,
           (SELECT COALESCE(SUM(duration_minutes),0)::int FROM practice_sessions WHERE student_id = $1) AS total_minutes,
           (SELECT COUNT(*)::int FROM test_attempts WHERE student_id = $1) AS total_tests,
           (SELECT ROUND(AVG(score_percent))::int FROM test_attempts WHERE student_id = $1) AS avg_score`,
        [uid]
      ),
      // Category mastery: average accuracy per practice category (session_type)
      query(
        `SELECT session_type AS category,
                ROUND(AVG(CASE WHEN exercises_total>0 THEN (exercises_correct::numeric/exercises_total)*100 ELSE 0 END))::int AS mastery
         FROM practice_sessions
         WHERE student_id = $1 AND status='completed' AND exercises_total > 0
         GROUP BY session_type`,
        [uid]
      ),
      // Recent sessions (practice + tests)
      query(
        `SELECT session_type, exercises_total, exercises_correct, completed_at, created_at
         FROM practice_sessions WHERE student_id = $1 AND status='completed'
         ORDER BY COALESCE(completed_at, created_at) DESC LIMIT 5`,
        [uid]
      ),
      // Days practiced in the last 7 days (for the weekly goal dots)
      query(
        `SELECT DISTINCT EXTRACT(DOW FROM COALESCE(completed_at, created_at))::int AS dow
         FROM practice_sessions
         WHERE student_id = $1 AND status='completed'
           AND COALESCE(completed_at, created_at) > NOW() - INTERVAL '7 days'`,
        [uid]
      ),
    ]);

    const t = totals.rows[0] || {};
    // weekDays: Mon..Sun for the CURRENT week.
    //   true  = practiced that day
    //   false = a past day this week with no practice (missed)
    //   null  = today's future / days that haven't happened yet (neutral)
    const practicedDows = new Set(weekRows.rows.map(r => r.dow)); // JS DOW 0=Sun..6=Sat
    const todayDow = new Date().getDay();                        // 0=Sun..6=Sat
    // Position in a Monday-first week (Mon=0 .. Sun=6)
    const todayIdx = (todayDow + 6) % 7;
    const weekDays = [1,2,3,4,5,6,0].map((dow, idx) => {
      if (practicedDows.has(dow)) return true;   // practiced
      if (idx <= todayIdx) return false;          // past/today, not practiced -> missed
      return null;                                // future day -> neutral
    });

    const categoryMastery = cats.rows.map(c => ({ category: c.category, mastery: c.mastery, trend: 'stable' }));
    const recentSessions = recent.rows.map(r => ({
      date: (r.completed_at || r.created_at),
      score: r.exercises_total > 0 ? Math.round((r.exercises_correct / r.exercises_total) * 100) : 0,
      exercises: r.exercises_total,
      category: r.session_type,
    }));

    res.json({
      profile:   { ...(profile.rows[0] || {}) },
      level:     profile.rows[0]?.current_level || 1,
      streak:    profile.rows[0]?.streak_count || 0,
      totalPractices: t.total_practices || 0,
      totalPracticeMinutes: t.total_minutes || 0,
      totalTests: t.total_tests || 0,
      avgScore:  t.avg_score || 0,
      mastery:   t.avg_score || 0,
      categoryMastery,
      recentSessions,
      weekDays,
      trend:     trend.rows.slice().reverse().map((r, i) => ({
        date:    r.created_at,
        label:   `Test ${i + 1}`,
        mastery: Number(r.score) || 0,
        score:   Number(r.score) || 0,
      })),
      weakAreas: errors.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
