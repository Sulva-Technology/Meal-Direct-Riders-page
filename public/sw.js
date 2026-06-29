self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Meal Direct';
  const options = {
    body: payload.body || 'You have a new rider update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || payload.aggregateId || 'meal-direct-rider',
    data: {
      url: payload.linkPath || payload.url || '/?view=notifications',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
