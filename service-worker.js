// service-worker.js — hand-written, no-build (matches the project's vanilla ES
// setup). Runtime caching only (no precache/asset-URL coupling), so the
// cache-bust token can change freely without a stale precache manifest.
//
// Version comes from the ?v=<token> the page registers with (app/pwa.js reads
// it from <meta name="cb">). A new token = a new SW script URL = an update,
// and the cache name is keyed to it so old caches are dropped on activate.
//
// Strategy (per mobile-pwa skill matrix):
//   navigations        NetworkFirst (+ navigation preload) -> cache -> offline.html
//   fonts (Google)     CacheFirst (1y)
//   same-origin assets StaleWhileRevalidate (URLs are ?v=fingerprinted, so safe)
// Update UX: never skipWaiting() unprompted — the page asks, then posts
// SKIP_WAITING, then reloads on controllerchange.

const VERSION = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE = `gs-${VERSION}`;
const PRECACHE = [
  '/offline.html',
  '/manifest.webmanifest',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png',
  '/public/icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // No skipWaiting: wait for user consent (see app/pwa.js update toast).
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('gs-') && k !== CACHE).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

const sameOrigin = (url) => new URL(url).origin === self.location.origin;
const cacheable = (res) => res && (res.status === 200 || res.status === 0);

async function putCache(req, res) {
  if (!cacheable(res)) return res;
  const c = await caches.open(CACHE);
  c.put(req, res.clone());
  return res;
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try { return await putCache(req, await fetch(req)); }
  catch { return hit || Response.error(); }
}

async function staleWhileRevalidate(req) {
  const hit = await caches.match(req);
  const net = fetch(req).then((res) => putCache(req, res)).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const pre = await e.preloadResponse;
        if (pre) return await putCache(req, pre);
        return await putCache(req, await fetch(req));
      } catch {
        const c = await caches.open(CACHE);
        return (await c.match(req)) || (await c.match('/')) ||
               (await c.match('/index.html')) || (await c.match('/offline.html')) ||
               Response.error();
      }
    })());
    return;
  }

  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(cacheFirst(req));
    return;
  }

  if (sameOrigin(req.url)) e.respondWith(staleWhileRevalidate(req));
});
