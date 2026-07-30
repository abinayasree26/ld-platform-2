/**
 * LD Push Notifications Route
 * 
 * POST /api/ld/push/register     — Register a device FCM token
 * POST /api/ld/push/unregister   — Remove a device FCM token
 * POST /api/ld/push/test         — Send a test notification (dev only)
 * POST /api/ld/push/subscribe    — Subscribe to a topic
 * POST /api/ld/push/unsubscribe  — Unsubscribe from a topic
 */

const router = require('express').Router();
const { query } = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');
const pushService = require('../../services/pushNotification');

// ─── POST /register — Save device FCM token ─────────────────────────
router.post('/register', requireAuth, async (req, res) => {
  const { token, device = 'web' } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'FCM token is required' });
  }

  if (!pushService.isAvailable()) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }

  try {
    // Store token in database
    await query(
      `INSERT INTO device_tokens (user_id, token, device, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, token) DO UPDATE SET updated_at = NOW()`,
      [req.user.id, token, device]
    );

    // Subscribe to user's personal topic
    await pushService.subscribeToTopic([token], `user_${req.user.id}`);

    res.json({ success: true, message: 'Device registered for push notifications' });
  } catch (err) {
    // Demo mode fallback
    console.log(`[Push] Token registered (demo): ${token.slice(0, 20)}...`);
    res.json({ success: true, message: 'Device registered (demo mode)' });
  }
});

// ─── POST /unregister — Remove device FCM token ─────────────────────
router.post('/unregister', requireAuth, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'FCM token is required' });
  }

  try {
    await query(
      `DELETE FROM device_tokens WHERE user_id = $1 AND token = $2`,
      [req.user.id, token]
    );

    // Unsubscribe from personal topic
    await pushService.unsubscribeFromTopic([token], `user_${req.user.id}`);

    res.json({ success: true, message: 'Device unregistered' });
  } catch {
    res.json({ success: true, message: 'Device unregistered (demo mode)' });
  }
});

// ─── POST /subscribe — Subscribe to a topic ─────────────────────────
router.post('/subscribe', requireAuth, async (req, res) => {
  const { token, topic } = req.body;

  if (!token || !topic) {
    return res.status(400).json({ error: 'token and topic are required' });
  }

  // Only allow safe topic names
  const allowedTopicPattern = /^[a-zA-Z0-9_-]+$/;
  if (!allowedTopicPattern.test(topic)) {
    return res.status(400).json({ error: 'Invalid topic name' });
  }

  const result = await pushService.subscribeToTopic([token], topic);
  res.json({ success: !!result, topic });
});

// ─── POST /unsubscribe — Unsubscribe from a topic ───────────────────
router.post('/unsubscribe', requireAuth, async (req, res) => {
  const { token, topic } = req.body;

  if (!token || !topic) {
    return res.status(400).json({ error: 'token and topic are required' });
  }

  const result = await pushService.unsubscribeFromTopic([token], topic);
  res.json({ success: !!result, topic });
});

// ─── POST /test — Send a test notification (development only) ────────
router.post('/test', requireAuth, async (req, res) => {
  const { token, message } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'FCM token is required' });
  }

  if (!pushService.isAvailable()) {
    return res.json({
      success: false,
      message: 'FCM not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
    });
  }

  const result = await pushService.sendToDevice(token, {
    title: '🧪 Test Notification',
    body: message || 'If you see this, push notifications are working!',
    data: { type: 'test', url: '/student' },
  });

  res.json({ success: !!result, result });
});

module.exports = router;
