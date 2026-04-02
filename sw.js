const CACHE = 'maaltijdplanner-v1';

const PRECACHE_URLS = [
  'Weekly%20Meal%20Planner.html',
  'manifest.json',
  'icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Sla Google Calendar API-calls niet op
  if (e.request.url.includes('googleapis.com') || e.request.url.includes('openweathermap')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        if (response.ok) {
          const cacheable =
            e.request.url.includes('cdnjs.cloudflare.com') ||
            e.request.url.includes('fonts.googleapis.com') ||
            e.request.url.includes('fonts.gstatic.com');
          if (cacheable) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
        }
        return response;
      }).catch(() => cached || new Response('Offline – geen verbinding', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      }));
    })
  );
});
