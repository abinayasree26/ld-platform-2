const cron = require('node-cron');
const { query } = require('../config/database');
const { generateStudentTips } = require('../services/llamaService');

// Reset daily streaks for inactive students
async function resetInactiveStreaks() {
  const { rowCount } = await query(
    `UPDATE students SET streak_count=0
     WHERE last_activity_at < CURRENT_DATE - INTERVAL '1 day'
       AND streak_count > 0`
  );
  console.log(`[Cron] Reset streaks for ${rowCount} inactive students`);
}

// Flag students due for re-screening (every 90 days)
async function flagRescreening() {
  const { rowCount } = await query(
    `UPDATE students SET last_screened_at=NULL
     WHERE last_screened_at < NOW() - INTERVAL '90 days'
       AND last_screened_at IS NOT NULL`
  );
  console.log(`[Cron] Flagged ${rowCount} students for re-screening`);
}

// Weekly AI recommendations (lightweight)
async function generateWeeklyRecommendations() {
  const { rows } = await query(
    `SELECT s.user_id, s.ld_type, s.ld_risk_score, s.current_level, u.name
     FROM students s JOIN users u ON u.id = s.user_id
     WHERE s.ld_type IS NOT NULL
       AND s.user_id NOT IN (
         SELECT user_id FROM ai_recommendations WHERE created_at > NOW() - INTERVAL '7 days'
       )
     LIMIT 50`
  );

  let generated = 0;
  for (const student of rows) {
    const result = await generateStudentTips({
      studentName: student.name,
      ldType: student.ld_type,
      riskScore: student.ld_risk_score,
      currentLevel: student.current_level,
    });
    if (!result) continue;

    await query(
      `INSERT INTO ai_recommendations (id, user_id, audience, content, tips, created_at)
       VALUES (uuid_generate_v4(), $1, 'student', $2, $3::jsonb, NOW())`,
      [student.user_id, result.content, JSON.stringify(result.tips)]
    );
    generated++;
  }
  console.log(`[Cron] Generated weekly recommendations for ${generated}/${rows.length} students`);
}

// Notify teachers when a student hasn't been active for 3+ days (FR-08)
async function notifyInactiveStudents() {
  const { rows } = await query(
    `SELECT DISTINCT s.user_id AS student_id, u.name AS student_name,
            c.teacher_id, c.school_id
     FROM students s
     JOIN users u ON u.id = s.user_id
     JOIN class_students cs ON cs.student_id = s.user_id
     JOIN classes c ON c.id = cs.class_id
     WHERE s.last_activity_at < NOW() - INTERVAL '3 days'
       AND c.teacher_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = c.teacher_id
           AND n.type = 'student_inactive'
           AND n.body LIKE '%[student:' || s.user_id || ']%'
           AND n.created_at > NOW() - INTERVAL '3 days'
       )`
  );

  for (const row of rows) {
    await query(
      `INSERT INTO notifications (id, user_id, school_id, type, title, body, created_at)
       VALUES (uuid_generate_v4(), $1, $2, 'student_inactive', $3, $4, NOW())`,
      [
        row.teacher_id,
        row.school_id,
        `${row.student_name} hasn't practiced in 3+ days`,
        `${row.student_name} hasn't logged in for over 3 days. Consider checking in with them. [student:${row.student_id}]`,
      ]
    );
  }
  console.log(`[Cron] Notified teachers about ${rows.length} inactive students`);
}

// Send streak reminder notifications to students with active streaks
// who haven't practiced today yet (runs at 4 PM daily)
async function sendStreakReminders() {
  const { rows } = await query(
    `SELECT s.user_id, s.streak_count, u.name
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.streak_count > 0
       AND s.user_id NOT IN (
         SELECT user_id FROM practice_sessions
         WHERE DATE(created_at) = CURRENT_DATE
       )
       AND s.user_id NOT IN (
         SELECT user_id FROM notifications
         WHERE type = 'streak_reminder'
           AND DATE(created_at) = CURRENT_DATE
       )`
  );

  for (const student of rows) {
    const messages = [
      `You have a ${student.streak_count}-day streak! Don't let it break — just 10 minutes today! 🔥`,
      `${student.streak_count} days in a row! Come back for a quick practice to keep going! 💪`,
      `Your ${student.streak_count}-day streak is waiting! A short session keeps your brain sharp! 🧠`,
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];

    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, action, read, created_at)
       VALUES (uuid_generate_v4(), $1, 'streak_reminder', $2, $3, $4, false, NOW())`,
      [
        student.user_id,
        '🔥 Keep your streak alive!',
        body,
        JSON.stringify({ type: 'navigate', path: '/ld/practice' }),
      ]
    );
  }
  console.log(`[Cron] Sent streak reminders to ${rows.length} students`);
}

// Send subscription expiry warning emails (runs daily at 08:00 AM)
async function checkSubscriptionExpirations() {
  const { sendExpiryReminderEmail } = require('../services/email.service');
  if (process.env.DEMO_MODE === 'true') {
    console.log('[Cron] Subscription expiry check completed (Demo Mode)');
    return;
  }
  try {
    const { rows } = await query(
      `SELECT u.email, u.name, po.plan_type,
              EXTRACT(DAY FROM (po.expires_at - NOW()))::int AS days_remaining
       FROM payment_orders po
       JOIN users u ON u.id = po.user_id
       WHERE po.status = 'paid'
         AND po.expires_at > NOW()
         AND po.expires_at <= NOW() + INTERVAL '7 days'`
    );

    for (const sub of rows) {
      await sendExpiryReminderEmail(sub.email, sub.name, sub.plan_type, sub.days_remaining).catch(() => {});
    }
    console.log(`[Cron] Sent subscription expiry warnings to ${rows.length} users`);
  } catch (err) {
    console.error('[Cron Expiry Warning Error]:', err.message);
  }
}

function startCronJobs() {
  // Every day at 01:00
  cron.schedule('0 1 * * *', () => resetInactiveStreaks().catch(console.error));
  // Every Sunday at 02:00
  cron.schedule('0 2 * * 0', () => flagRescreening().catch(console.error));
  // Every Monday at 06:00
  cron.schedule('0 6 * * 1', () => generateWeeklyRecommendations().catch(console.error));
  // Every day at 07:00
  cron.schedule('0 7 * * *', () => notifyInactiveStudents().catch(console.error));
  // Every day at 08:00 — subscription expiry reminders
  cron.schedule('0 8 * * *', () => checkSubscriptionExpirations().catch(console.error));
  // Every day at 16:00 (4 PM) — streak reminders
  cron.schedule('0 16 * * *', () => sendStreakReminders().catch(console.error));
  console.log('[Cron] Jobs scheduled');
}

module.exports = {
  startCronJobs,
  resetInactiveStreaks,
  flagRescreening,
  generateWeeklyRecommendations,
  notifyInactiveStudents,
  sendStreakReminders,
  checkSubscriptionExpirations,
};
