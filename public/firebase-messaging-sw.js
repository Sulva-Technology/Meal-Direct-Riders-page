/* Firebase Cloud Messaging background service worker.
 * Loaded from the web root at /firebase-messaging-sw.js.
 * Keep the config below in sync with src/lib/firebase.ts. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAYKfgVS5WGsbZLQ42dsKTJy98fRRjj1w8',
  authDomain: 'mealdirect-2192b.firebaseapp.com',
  projectId: 'mealdirect-2192b',
  storageBucket: 'mealdirect-2192b.firebasestorage.app',
  messagingSenderId: '99018858239',
  appId: '1:99018858239:web:9ff663f20b28f8c5d036ca',
  measurementId: 'G-34V8S6D2GF',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || 'Meal Direct';
  const options = {
    body: notification.body || data.body || 'You have a new rider update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || data.aggregateId || 'meal-direct-rider',
    data: {
      url: data.linkPath || data.url || '/?view=notifications',
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) return client.navigate(targetUrl.href);
        return;
      }
    }

    if (self.clients.openWindow) await self.clients.openWindow(targetUrl.href);
  })());
});
