// Service Worker - Mfumo wa Mahudhurio
// Cache inabadilika automatically kila siku — Tanzania timezone

const CACHE_NAME = 'mahudhurio-' + new Date().toLocaleDateString('en-CA', {
  timeZone: 'Africa/Dar_es_Salaam'
});
const ASSETS = [
  '/',
  '/index.html',
  '/teacher-attendance.html',
  '/admin-dashboard.html',
  '/manifest.json',
  '/app-icon.svg',
  '/school-logo.svg',
  '/govt-logo.svg',
];

// Install - cache assets individually so one failure won't break install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.log('Cache miss:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML files → Network First (mabadiliko yanaonekana mara moja)
// - Static assets (svg, json, icons) → Cache First (haraka)
self.addEventListener('fetch', event => {
  // Skip API calls — always network
  if (event.request.url.includes('/api/')) return;

  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/';

  if (isHTML) {
    // Network First — pata mpya kutoka server, cache kama backup
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network imeshindwa — tumia cache kama backup (offline)
          return caches.match(event.request).then(cached =>
            cached || caches.match('/index.html')
          );
        })
    );
  } else {
    // Cache First kwa assets (svg, icons, manifest)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null);
      })
    );
  }
});
