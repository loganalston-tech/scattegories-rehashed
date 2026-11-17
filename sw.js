const CACHE = 'scattegories-rehashed-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './dist/style.css',
  './dist/app.js',
  './dist/categories.js',
  './dist/vendor/vue.min.js',
  './dist/vendor/anime.min.js',
  './dist/fonts/Didactic-Regular.woff',
  './dist/fonts/Didactic-Bold.woff',
  './dist/fonts/Mono-Regular.woff',
  './dist/rehashed.png',
  './dist/icon-192.png',
  './dist/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('scattegories-rehashed-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request, { ignoreSearch: true }).then((cached) => {
        const refresh = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(refresh);
          return cached;
        }
        return refresh.then((response) => {
          if (response) return response;

          return request.mode === 'navigate'
            ? cache.match('./index.html')
            : Response.error();
        });
      })
    )
  );
});
