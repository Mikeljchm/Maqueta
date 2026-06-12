/* HOTT WRESTLING — Service Worker v5 */
const VERSION      = 'v5';
const CACHE_STATIC = 'hw-static-' + VERSION;
const CACHE_PAGES  = 'hw-pages-'  + VERSION;
const CACHE_IMAGES = 'hw-images-' + VERSION;

const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/assets/css/hw-index.css',
  '/assets/js/hw-index.js',
  '/404.html'
];

/* ── INSTALL — precache static assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE — delete old caches ── */
self.addEventListener('activate', e => {
  const current = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !current.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  /* Skip non-GET */
  if (req.method !== 'GET') return;

  /* Skip: auth, API, CDN, videos, Google */
  if (url.pathname.startsWith('/auth/'))  return;
  if (url.pathname.startsWith('/api/'))   return;
  if (url.hostname.includes('b-cdn.net')) return;
  if (url.hostname.includes('bunnycdn'))  return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('accounts.google.com')) return;
  if (/\.(mp4|webm|m4v|ogg|m4a)$/i.test(url.pathname)) return;

  /* Images — cache 7 days */
  if (req.destination === 'image' || url.hostname.includes('imgbox') || url.hostname.includes('imgcdn')) {
    e.respondWith(
      caches.open(CACHE_IMAGES).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached || new Response('', { status: 404 }));
        })
      )
    );
    return;
  }

  /* HTML pages — network first, fallback to cache then /404.html */
  if (req.destination === 'document' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) caches.open(CACHE_PAGES).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(req)
            .then(cached => cached || caches.match('/404.html'))
        )
    );
    return;
  }

  /* Static assets (CSS, JS, fonts) — cache first, network fallback */
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok) caches.open(CACHE_STATIC).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
});

/* ── PUSH NOTIFICATIONS ── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'HOTT WRESTLING', {
    body:    data.body    || 'New content available',
    icon:    data.icon    || 'https://images2.imgbox.com/a6/b9/tfJsnAfF_o.png',
    badge:   'https://images2.imgbox.com/a6/b9/tfJsnAfF_o.png',
    vibrate: [200, 100, 200],
    tag:     data.tag     || 'hw-notif',
    renotify: true,
    data:    { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const target = e.notification.data.url;
        const existing = list.find(c => c.url === target && 'focus' in c);
        if (existing) return existing.focus();
        return clients.openWindow(target);
      })
  );
});
