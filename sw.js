// Service worker mínimo — sem framework.
// Estratégia: cache-first com atualização em segundo plano (stale-while-revalidate)
// para GET do mesmo domínio. Offline cai no index.html.
const CACHE = 'financas-v4';
const PRECACHE = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/nucleo/main.js',
  './assets/js/nucleo/menu.js',
  './assets/js/nucleo/storage.js',
  './manifest.json',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const rede = fetch(req).then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return res;
      }).catch(() => cached
        || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));

      return cached || rede;
    })
  );
});
