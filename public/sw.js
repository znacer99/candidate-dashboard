// Immediate cache cleaner & self-unregistering service worker
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cache) => caches.delete(cache)))
    }).then(() => {
      return self.registration.unregister()
    })
  )
  self.clients.claim()
})

// Always direct fetch, never serve stale cached code
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
