const CACHE_NAME = 'hr-candidate-portal-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
]

// Install Service Worker and cache core static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core app shell')
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache)
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Intercept requests and fetch Stale-While-Revalidate for local assets & Cache-First for Supabase Storage CVs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache Supabase Storage CV documents (PDFs, Images, Docs) for offline viewing
  if (url.origin.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open('hr-cv-documents-v1').then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        }).catch(() => {
          // If network fails and not cached, return offline fallback response
          return new Response('CV File Offline — Please connect to internet once to download this CV for offline access.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          })
        })
      })
    )
    return
  }

  // Skip caching for direct Supabase database REST API requests
  if (url.origin.includes('supabase.co')) {
    return
  }

  // Handle local app shell & assets: Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch updated version in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
            }
          })
          .catch(() => { /* Ignore background fetch errors */ })

        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        // Cache new local resources dynamically
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})
