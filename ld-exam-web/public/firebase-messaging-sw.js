/**
 * Firebase Messaging Service Worker
 * 
 * This file MUST be in the /public folder (served at the root).
 * It handles background push notifications when the app tab is not focused.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config (ld-project-main)
firebase.initializeApp({
  apiKey: 'AIzaSyB4hSvJfPARyDOQSg5vbrbTL9057Ncbinc',
  authDomain: 'ld-project-main.firebaseapp.com',
  projectId: 'ld-project-main',
  storageBucket: 'ld-project-main.firebasestorage.app',
  messagingSenderId: '836692328129',
  appId: '1:836692328129:web:e3818e61225a8b05285e40',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'LD Schools';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/ld-icon-192.png',
    badge: '/icons/ld-badge-72.png',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
