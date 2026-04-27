const CACHE_NAME = 'ptit-pwa-v9'
const PRECACHE_ASSETS = ['/manifest.webmanifest', '/logo-white-circle.png']
const IS_LOCALHOST =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'
const STATIC_FILE_PATTERN = /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|eot|map)$/i

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

  // Never cache API responses in service worker.
  if (requestUrl.pathname.startsWith('/api/')) {
    return
  }

  // Cache only static assets (js/css/images/fonts/etc).
  const isStaticAsset = STATIC_FILE_PATTERN.test(requestUrl.pathname)
  if (!isStaticAsset) {
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
