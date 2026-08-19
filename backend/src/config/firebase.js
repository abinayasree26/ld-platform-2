/**
 * Firebase Admin SDK Configuration
 */
const admin = require('firebase-admin');
const env = require('./env');

let firebaseMessaging = null;

try {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
    }
    firebaseMessaging = admin.messaging();
    console.log('[Firebase Admin] Initialized successfully');
  } else {
    console.log('[Firebase Admin] Running in Demo/Mock Mode (missing credentials)');
  }
} catch (err) {
  console.warn('[Firebase Admin Warning]:', err.message);
}

/**
 * Send Multicast FCM Push Notification Helper
 */
async function sendPushNotification(tokens, notification, data = {}) {
  if (!tokens || !tokens.length) {
    return { success: false, reason: 'No target tokens provided' };
  }

  if (firebaseMessaging) {
    try {
      const response = await firebaseMessaging.sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: { ...data, timestamp: String(Date.now()) },
      });
      return { success: true, successCount: response.successCount, failureCount: response.failureCount };
    } catch (err) {
      console.error('[FCM Push Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Demo Mode Push Simulation
  console.log(`[FCM Push Simulated]: Title: "${notification.title}" | Body: "${notification.body}" | Tokens: ${tokens.length}`);
  return { success: true, demo: true, tokensCount: tokens.length };
}

module.exports = {
  admin,
  sendPushNotification,
  isConfigured: () => !!firebaseMessaging,
};
