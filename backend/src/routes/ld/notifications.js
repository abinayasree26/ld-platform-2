/**
 * LD Notifications Route
 * 
 * GET  /api/ld/notifications        — Get student's notifications (paginated)
 * POST /api/ld/notifications/:id/read — Mark a notification as read
 * POST /api/ld/notifications/read-all — Mark all as read
 * GET  /api/ld/notifications/unread-count — Get unread count
 */

const router = require('express').Router();
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');

// ─── Demo notifications (used when DB is unavailable) ───────────────────
const DEMO_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'streak_reminder',
    title: "🔥 Keep your streak alive!",
    body: "You practiced yesterday — come back today to keep your 5-day streak going! Just 10 minutes makes a difference.",
    read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    action: { type: 'navigate', path: '/ld/practice' },
  },
  {
    id: 'n2',
    type: 'ai_recommendation',
    title: "🎯 AI Tip: Focus on Phonics today",
    body: "Your phonics mastery is at 48% — below your other categories. Try 10 exercises focused on letter-sound connections to boost it!",
    read: false,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
    action: { type: 'navigate', path: '/ld/practice/session?focus=phonics' },
  },
  {
    id: 'n3',
    type: 'level_up_available',
    title: "🏆 Level Test Available!",
    body: "Great work! Your mastery is above 65% and you have a 3-day streak. You're eligible to attempt the Level 4 test!",
    read: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // yesterday
    action: { type: 'navigate', path: '/ld/tests' },
  },
  {
    id: 'n4',
    type: 'weekly_summary',
    title: "📊 Weekly Progress Summary",
    body: "This week: 4 practice sessions, 72% avg accuracy, +8% mastery improvement. Your strongest area: Letter Recognition (85%). Keep it up!",
    read: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    action: { type: 'navigate', path: '/ld/student' },
  },
  {
    id: 'n5',
    type: 'achievement',
    title: "⭐ Achievement Unlocked: 5-Day Streak!",
    body: "Amazing dedication! You've practiced 5 days in a row. Your brain is getting stronger every single day! 🧠",
    read: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
    action: null,
  },
  {
    id: 'n6',
    type: 'teacher_message',
    title: "👨🏫 Message from your teacher",
    body: "Hi! I noticed you're doing really well in Letter Recognition. Try some of the harder phonics exercises next — I think you're ready!",
    read: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
    action: { type: 'navigate', path: '/ld/practice/session?focus=phonics' },
  },
];

// Track read status in memory for demo mode
const demoReadIds = new Set();

// ─── GET / — Get notifications ──────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  try {
    const { rows } = await query(
      `SELECT id, type, title, body, read, action, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM notifications WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );

    res.json({
      notifications: rows,
      unreadCount: countResult.rows[0]?.total || 0,
      total: rows.length,
    });
  } catch {
    // Fallback to demo notifications
    const notifications = DEMO_NOTIFICATIONS.map(n => ({
      ...n,
      read: n.read || demoReadIds.has(n.id),
    }));
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount, total: notifications.length });
  }
});

// ─── GET /unread-count — Quick unread count ─────────────────────────────
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    res.json({ count: rows[0]?.count || 0 });
  } catch {
    const count = DEMO_NOTIFICATIONS.filter(n => !n.read && !demoReadIds.has(n.id)).length;
    res.json({ count });
  }
});

// ─── POST /:id/read — Mark single notification as read ──────────────────
router.post('/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    res.json({ success: true });
  } catch {
    demoReadIds.add(id);
    res.json({ success: true });
  }
});

// ─── POST /read-all — Mark all as read ──────────────────────────────────
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch {
    DEMO_NOTIFICATIONS.forEach(n => demoReadIds.add(n.id));
    res.json({ success: true });
  }
});

module.exports = router;
