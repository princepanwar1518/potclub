/* Service worker — generated at build time by deploy/vite-hosting-parity.ts. Do not edit dist/sw.js. */
const VERSION = '__VERSION__'
const CACHE = `potclub-${VERSION}`
// Also clear caches from before the rename.
const OLD_PREFIXES = ['potclub-', 'group-draws-']
const PRECACHE = __PRECACHE__
const APP_SHELL = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => OLD_PREFIXES.some((p) => k.startsWith(p)) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Never cache API traffic: it must always come from the server.
  if (url.pathname.startsWith('/api/')) return

  // Pages: network first so updates arrive promptly; offline falls back to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_SHELL, { ignoreVary: true }).then((r) => r ?? Response.error())),
    )
    return
  }

  // Hashed build assets and icons: cache first (file names change when content changes).
  // ignoreVary: module scripts are requested with an Origin header; a `Vary: Origin` on the precached
  // response would otherwise make the cached copy never match. Safe because the URL is content-hashed.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'))) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
