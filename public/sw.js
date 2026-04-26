const CACHE_NAME = 'ptit-pwa-v2'
const PRECACHE_ASSETS = ['/manifest.webmanifest', '/logo-white-circle.png']
const IS_LOCALHOST =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (IS_LOCALHOST) {
    return
  }

  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  // Always prefer fresh HTML to avoid stale UI after deployments.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/')),
    )
    return
  }

  if (!isSameOrigin) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request)
        .then((networkResponse) => {
          const cloned = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned)
          })
          return networkResponse
        })
        .catch(() => caches.match('/logo-white-circle.png'))
    }),
  )
})
