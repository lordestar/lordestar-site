/* lordestar Service Worker
 * 策略：
 *  - 静态资源（/_astro、/media、/photos）：缓存优先
 *  - 页面导航：网络优先，失败回退缓存（离线可看上次访问的页面）
 *  - 其余同源 GET：swr（先用缓存，后台更新）
 */
const VERSION = 'lordestar-v1';
const PRECACHE = ['/', '/journal/', '/diary/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 静态资源：缓存优先
  if (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/media/') ||
    url.pathname.startsWith('/photos/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((resp) => {
            const copy = resp.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
            return resp;
          }),
      ),
    );
    return;
  }

  // 页面导航：网络优先，失败回退缓存
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // 其余：先用缓存，后台刷新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fresh = fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy));
        return resp;
      });
      return cached || fresh;
    }),
  );
});
