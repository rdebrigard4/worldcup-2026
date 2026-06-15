/* Minimal service worker for the World Cup 2026 PWA.
 *
 * Purpose: stop the home-screen (standalone) install from getting stuck on a
 * STALE build after a deploy — the bug that made tabs go black on the phone
 * while desktop was fine. Also gives basic offline support.
 *
 * Strategy:
 *  - Navigations (the HTML document) → NETWORK-FIRST. The HTML references the
 *    hashed asset files, so fetching it fresh whenever online means a new
 *    deploy is picked up immediately. Falls back to the cached shell offline.
 *  - Same-origin fingerprinted assets (Vite's hashed JS/CSS/images) →
 *    CACHE-FIRST. They're immutable (a new build = a new filename), so caching
 *    is safe + fast and works offline.
 *  - Cross-origin requests (e.g. ESPN's score API) are never intercepted — they
 *    go straight to the network so live scores stay live.
 *
 * skipWaiting + clients.claim activate a new worker immediately; the page's
 * controllerchange listener (see main.tsx) then reloads once, so a fresh deploy
 * lands without anyone reinstalling the home-screen shortcut.
 */

const CACHE = 'wc2026-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Precache the app shell so a cold offline open still works.
      const cache = await caches.open(CACHE)
      try {
        await cache.add(new Request(self.registration.scope, { cache: 'reload' }))
      } catch {
        /* offline at install time — fine, it'll cache on first online navigation */
      }
    })(),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older worker versions.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // ESPN & other cross-origin: leave untouched

  if (req.mode === 'navigate') {
    // Network-first for the document → new deploys are picked up at once.
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put(req, fresh.clone())
          return fresh
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match(self.registration.scope)) ||
            Response.error()
          )
        }
      })(),
    )
    return
  }

  // Only cache Vite's fingerprinted, immutable build assets (/assets/*).
  // Everything else — notably main.tsx's index.html freshness probe — passes
  // straight to the network, so it never serves stale and never pollutes cache.
  if (!url.pathname.includes('/assets/')) return

  // Cache-first for fingerprinted, same-origin assets.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      const fresh = await fetch(req)
      if (fresh.ok && fresh.type === 'basic') {
        const cache = await caches.open(CACHE)
        cache.put(req, fresh.clone())
      }
      return fresh
    })(),
  )
})
