/* JUICY STUD — Service Worker v4 */
const CACHE_STATIC = 'hw-static-v4';
const CACHE_PAGES  = 'hw-pages-v4';
const CACHE_IMAGES = 'hw-images-v4';

const STATIC_FILES = ['/', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

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

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // NUNCA cachear: auth, API calls, videos, CDN
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/auth/')) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('b-cdn.net')) return;
  if (url.hostname.includes('bunny')) return;
  if (url.pathname.includes('.mp4') || url.pathname.includes('.webm')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('accounts.google.com')) return;

  // Imágenes externas — cache 7 días
  if (url.hostname.includes('imgbox') || url.hostname.includes('imgcdn') || e.request.destination === 'image') {
    e.respondWith(
      caches.open(CACHE_IMAGES).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached || new Response('', {status: 404}));
        })
      )
    );
    return;
  }

  // HTML — network first, sin cache si falla
  if (e.request.destination === 'document' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE_PAGES).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
    );
    return;
  }

  // Assets estáticos — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE_STATIC).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'JUICY STUD', {
    body: data.body || 'New content available',
    icon: 'https://images2.imgbox.com/a6/b9/tfJsnAfF_o.png',
    badge: 'https://images2.imgbox.com/a6/b9/tfJsnAfF_o.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
