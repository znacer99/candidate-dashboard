const CACHE_NAME = 'hr-candidate-portal-v3'

// Install Service Worker immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate Service Worker and take control of all open pages immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'hr-cv-documents-v1') {
            console.log('[Service Worker] Deleting outdated cache:', cache)
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Intercept requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. Supabase Storage CV files (PDFs, images) - Cache First
  if (url.origin.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone()
              caches.open('hr-cv-documents-v1').then((cache) => cache.put(event.request, responseToCache))
            }
            return networkResponse
          })
          .catch(() => {
            return new Response('CV Document Offline — Connect to internet once to download this CV.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            })
          })
      })
    )
    return
  }

  // 2. Direct Supabase API database queries - Network Only (handled by Dashboard localStorage)
  if (url.origin.includes('supabase.co')) {
    return
  }

  // 3. Navigation / HTML Document requests - Network First, fallback to cached index.html
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache.clone())
              cache.put('/', responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/')
          })
        })
    )
    return
  }

  // 4. JS, CSS, Fonts, Images - Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => {
        return new Response('', { status: 404, statusText: 'Offline Asset Not Found' })
      })
    })
  )
})
