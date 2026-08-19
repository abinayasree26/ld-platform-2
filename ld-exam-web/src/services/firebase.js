/**
 * Firebase Configuration & Push Notification Client
 * 
 * Uses compat SDK for better FCM token registration compatibility.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// VAPID key for web push
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messaging = null;

// ——— Initialize Firebase ————————————————————————————————————
export function initFirebase() {
  if (messaging) return { app: firebase.app(), messaging };

  try {
    if (!firebaseConfig.projectId) {
      console.log('[Firebase] Not configured — push notifications disabled');
      return { app: null, messaging: null };
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    messaging = firebase.messaging();
    console.log('[Firebase] Initialized (compat)');
    return { app: firebase.app(), messaging };
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message);
    return { app: null, messaging: null };
  }
}

// ——— Request notification permission & get token ————————————
export async function requestPushPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Push] Permission denied');
      return null;
    }

    if (!messaging) {
      initFirebase();
      if (!messaging) return null;
    }

    // Register and wait for service worker
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready');

    // Get token with VAPID key and service worker registration
    const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration });

    if (token) {
      console.log('[Push] Token received:', token.slice(0, 20) + '...');
      return token;
    }

    console.log('[Push] No token available');
    return null;
  } catch (err) {
    console.error('[Push] Failed to get token:', err.message);
    return null;
  }
}

// ——— Register token with backend ————————————————————————————
export async function registerPushToken(authToken) {
  const fcmToken = await requestPushPermission();
  if (!fcmToken) return false;

  try {
    const response = await fetch('/api/ld/push/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken, device: 'web' }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('[Push] Token registered with backend');
      localStorage.setItem('fcm_token', fcmToken);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Push] Registration failed:', err.message);
    return false;
  }
}

// ——— Unregister token from backend ——————————————————————————
export async function unregisterPushToken(authToken) {
  const fcmToken = localStorage.getItem('fcm_token');
  if (!fcmToken) return;

  try {
    await fetch('/api/ld/push/unregister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
    localStorage.removeItem('fcm_token');
  } catch (err) {
    console.error('[Push] Unregister failed:', err.message);
  }
}

// ——— Listen for foreground messages —————————————————————————
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};

  messaging.onMessage((payload) => {
    console.log('[Push] Foreground message:', payload);
    callback(payload);
  });
}

// ——— Check if notifications are supported & permitted ———————
export function isPushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isPushPermitted() {
  return Notification.permission === 'granted';
}
