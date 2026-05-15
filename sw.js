/* =====================================================================
   BECE Computing Game — Service Worker
   Caches the game and all assets for full offline use
===================================================================== */

const CACHE_NAME = 'bece-game-v1';

/* Files to cache on install */
const PRECACHE = [
  './bece_computing_game.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  /* External CDN resources — cached on first load */
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Orbitron:wght@700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

/* ---- Install: pre-cache local files only ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      /* Cache local files reliably; CDN files cached on fetch */
      return cache.addAll([
        './bece_computing_game.html',
        './manifest.json'
      ]);
    }).then(() => self.skipWaiting())
  );
});

/* ---- Activate: clean up old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- Fetch: cache-first for everything ---- */
self.addEventListener('fetch', event => {
  /* Skip non-GET requests */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      /* Not in cache — fetch from network and cache it */
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        /* Offline fallback — return the main HTML for navigation requests */
        if (event.request.mode === 'navigate') {
          return caches.match('./bece_computing_game.html');
        }
      });
    })
  );
});
