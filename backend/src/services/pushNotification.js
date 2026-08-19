/**
 * pushNotification.js — Firebase Cloud Messaging (FCM) Push Notifications
 * 
 * Handles:
 * - Initializing Firebase Admin SDK
 * - Sending push notifications to individual students
 * - Sending push notifications to topics (e.g., all students in a class)
 * - Token management (register/unregister device tokens)
 * 
 * Falls back gracefully if Firebase is not configured.
 */

const admin = require('firebase-admin');
const env = require('../config/env');
const path = require('path');

let firebaseInitialized = false;

// ─── Initialize Firebase Admin SDK ──────────────────────────────────
function initFirebase() {
  if (firebaseInitialized) return true;

  try {
    // Try loading from service account JSON file first
    const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
    let credential = null;

    try {
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } catch (fileErr) {
      // Fall back to env vars
      const { projectId, clientEmail, privateKey } = env.firebase;
      if (!projectId || !clientEmail || !privateKey) {
        console.log('[FCM] Firebase not configured — push notifications disabled');
        return false;
      }
      credential = admin.credential.cert({ projectId, clientEmail, privateKey });
    }

    admin.initializeApp({ credential });
    firebaseInitialized = true;
    console.log('[FCM] Firebase Admin initialized successfully');
    return true;
  } catch (err) {
    console.error('[FCM] Firebase init failed:', err.message);
    return false;
  }
}

// ─── Check if FCM is available ──────────────────────────────────────
function isAvailable() {
  return firebaseInitialized;
}

// ─── Send push to a single device token ─────────────────────────────
async function sendToDevice(token, { title, body, data = {}, imageUrl = null }) {
  if (!firebaseInitialized) return null;

  const message = {
    token,
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      ...data,
      click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/icons/ld-icon-192.png',
        badge: '/icons/ld-badge-72.png',
        ...(imageUrl && { image: imageUrl }),
      },
      fcmOptions: {
        link: data.url || '/',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[FCM] Sent to device: ${response}`);
    return response;
  } catch (err) {
    console.error(`[FCM] Send to device failed:`, err.message);
    // If token is invalid, return special marker
    if (err.code === 'messaging/invalid-registration-token' ||
        err.code === 'messaging/registration-token-not-registered') {
      return { error: 'invalid_token', token };
    }
    return null;
  }
}

// ─── Send push to multiple device tokens ────────────────────────────
async function sendToMultipleDevices(tokens, { title, body, data = {}, imageUrl = null }) {
  if (!firebaseInitialized || !tokens.length) return null;

  const message = {
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data: {
      ...data,
      click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/icons/ld-icon-192.png',
        badge: '/icons/ld-badge-72.png',
      },
      fcmOptions: {
        link: data.url || '/',
      },
    },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Multicast: ${response.successCount} sent, ${response.failureCount} failed`);

    // Collect invalid tokens for cleanup
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && (
        resp.error?.code === 'messaging/invalid-registration-token' ||
        resp.error?.code === 'messaging/registration-token-not-registered'
      )) {
        invalidTokens.push(tokens[idx]);
      }
    });

    return { successCount: response.successCount, failureCount: response.failureCount, invalidTokens };
  } catch (err) {
    console.error('[FCM] Multicast send failed:', err.message);
    return null;
  }
}

// ─── Send push to a topic (e.g., "class_5A", "all_students") ────────
async function sendToTopic(topic, { title, body, data = {} }) {
  if (!firebaseInitialized) return null;

  const message = {
    topic,
    notification: { title, body },
    data: {
      ...data,
      click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/icons/ld-icon-192.png',
      },
      fcmOptions: {
        link: data.url || '/',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[FCM] Sent to topic '${topic}': ${response}`);
    return response;
  } catch (err) {
    console.error(`[FCM] Send to topic '${topic}' failed:`, err.message);
    return null;
  }
}

// ─── Subscribe tokens to a topic ────────────────────────────────────
async function subscribeToTopic(tokens, topic) {
  if (!firebaseInitialized || !tokens.length) return null;

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`[FCM] Subscribed ${response.successCount} tokens to topic '${topic}'`);
    return response;
  } catch (err) {
    console.error(`[FCM] Subscribe to topic failed:`, err.message);
    return null;
  }
}

// ─── Unsubscribe tokens from a topic ────────────────────────────────
async function unsubscribeFromTopic(tokens, topic) {
  if (!firebaseInitialized || !tokens.length) return null;

  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return response;
  } catch (err) {
    console.error(`[FCM] Unsubscribe from topic failed:`, err.message);
    return null;
  }
}

// ─── Pre-defined notification templates ─────────────────────────────
const NotificationTemplates = {
  streakReminder: (streakCount) => ({
    title: '🔥 Keep your streak alive!',
    body: `Your ${streakCount}-day streak is waiting! A short session keeps your brain sharp! 🧠`,
    data: { type: 'streak_reminder', url: '/student/practice' },
  }),

  levelUpAvailable: (level) => ({
    title: '🏆 Level Test Available!',
    body: `Great work! You're ready to attempt the Level ${level} test. Give it a try!`,
    data: { type: 'level_up_available', url: '/student/tests' },
  }),

  aiRecommendation: (category) => ({
    title: `🎯 AI Tip: Focus on ${category} today`,
    body: `Your ${category} skills could use a boost. Try 10 exercises to improve!`,
    data: { type: 'ai_recommendation', url: `/student/practice` },
  }),

  achievement: (title) => ({
    title: `⭐ Achievement Unlocked!`,
    body: title,
    data: { type: 'achievement', url: '/student/certification' },
  }),

  teacherMessage: (teacherName) => ({
    title: `👨🏫 Message from ${teacherName}`,
    body: 'Your teacher sent you a message. Tap to read!',
    data: { type: 'teacher_message', url: '/student/messages' },
  }),

  weeklySummary: (stats) => ({
    title: '📊 Weekly Progress Summary',
    body: `This week: ${stats.sessions} sessions, ${stats.avgAccuracy}% avg accuracy. Keep it up!`,
    data: { type: 'weekly_summary', url: '/student' },
  }),
};

// Initialize on module load
initFirebase();

module.exports = {
  isAvailable,
  initFirebase,
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  NotificationTemplates,
};
