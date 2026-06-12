const CACHE = 'coach-noa-v1';
const ASSETS = ['/', '/index.html', '/app.css', '/app.js', '/manifest.json'];

// ── Install: cache core assets ─────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, network-first for API ──────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache Anthropic API calls
  if (url.hostname === 'api.anthropic.com') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Coach Noa', {
      body: data.body || "Time to check in with your coach!",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'coach-noa',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const url = e.notification.data?.url || '/';
      const existing = wins.find(w => w.url === url && 'focus' in w);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── Local scheduled notifications (no backend needed) ─────────────────────
const DAILY_SCHEDULE = [
  { hour: 8,  minute: 0,  title: "Good morning! 🌅", body: "Ready to log your breakfast? Starting the day with a logged meal keeps you on track." },
  { hour: 12, minute: 30, title: "Lunch time 🥗",    body: "Don't forget to log your lunch. Eating before 1pm helps avoid the 2pm energy dip!" },
  { hour: 14, minute: 0,  title: "Energy check ⚡",   body: "How are you feeling? If you're dragging, a handful of nuts or a piece of fruit can help." },
  { hour: 16, minute: 0,  title: "Step check 🚶",     body: "How are your steps looking? A short walk can close your goal and boost your energy." },
  { hour: 19, minute: 30, title: "Dinner time 🍽️",   body: "Time to log your dinner. Remember to get that protein in!" },
];

function msUntilNext(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

DAILY_SCHEDULE.forEach(({ hour, minute, title, body }) => {
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: `noa-${hour}-${minute}`,
      });
    }
    // Re-schedule for next day
    setInterval(() => {
      if (Notification.permission === 'granted') {
        self.registration.showNotification(title, { body, icon: '/icons/icon-192.png', tag: `noa-${hour}-${minute}` });
      }
    }, 24 * 60 * 60 * 1000);
  }, msUntilNext(hour, minute));
});
