// App-shell caching only. API calls and third-party data always go to the
// network so nothing stale is ever shown as if it were live.
const CACHE = 'angler-dashboard-shell-v1';
const SCOPE = new URL('./', self.location).pathname;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isCacheable = url =>
  url.origin === self.location.origin &&
  url.pathname.startsWith(SCOPE) &&
  !url.pathname.startsWith(`${SCOPE}api/`);

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!isCacheable(url)) return;

  // Hashed build assets are immutable: serve from cache when present.
  if (url.pathname.startsWith(`${SCOPE}assets/`)) {
    event.respondWith(
      caches.match(req).then(
        hit =>
          hit ||
          fetch(req).then(res => {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else in scope (document, manifest, icons): network first so a
  // deploy is picked up immediately, cache as offline fallback.
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then(hit => hit || (req.mode === 'navigate' ? caches.match(SCOPE) : undefined)),
      ),
  );
});
