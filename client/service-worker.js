const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/manifest.json',
  '/js/index.js',
  '/js/indexedDb.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const PRECACHE = 'precache-v1.2';
const RUNTIME = 'runtime';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(self.skipWaiting()),
  );
});
/* eslint-disable no-restricted-globals */
// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => cacheNames.filter((cacheName) => !currentCaches.includes(cacheName)))
      .then((cachesToDelete) => Promise.all(cachesToDelete.map((cacheToDelete) => caches
        .delete(cacheToDelete))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/')) {
    // make network request and fallback to cache if network request fails (offline)
    event.respondWith(
      caches.open(RUNTIME).then((cache) => fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            cache.put(event.request.url, response.clone());
          }
          return response;
        }).catch(() => caches.match(event.request))),
    );
  }
});
