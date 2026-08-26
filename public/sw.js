const CACHE_NAME = 'hr-candidate-portal-v2'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
]

// Install Service Worker and pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell')
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate Service Worker and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'hr-cv-documents-v1') {
            console.log('[Service Worker] Clearing old cache:', cache)
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. Supabase Storage CV files (PDFs / Images) - Cache First with Network Fallback
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
            return new Response('CV Document Offline — Connect to internet to load new files.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            })
          })
      })
    )
    return
  }

  // 2. Supabase API Requests - Network Only (handled by Dashboard localStorage fallback)
  if (url.origin.includes('supabase.co')) {
    return
  }

  // 3. Navigation / HTML Page Requests - Network First, fallback to cached /index.html
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseToCache))
          }
          return networkResponse
        })
        .catch(() => {
          // OFFLINE FALLBACK: Serve index.html from cache
          return caches.match('/index.html').then((cachedIndex) => {
            if (cachedIndex) return cachedIndex
            return caches.match('/')
          })
        })
    )
    return
  }

  // 4. JS, CSS, Fonts, Images - Stale-While-Revalidate with Cache Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
