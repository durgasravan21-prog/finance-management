self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch (network-first/network-only is fine since it's database-driven)
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
