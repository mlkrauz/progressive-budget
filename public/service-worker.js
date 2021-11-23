const STATIC_CACHE = 'static-cache-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'
const CACHED_ASSETS = [
  '/',
  'index.html',
  'index.js',
  'db.js',
  'styles.css',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'db.js',
]

/**
 * Install service worker, open and append cached files.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
    .then(cache => cache.addAll(CACHED_ASSETS))
    .then(self.skipWaiting())
    .catch((error) => console.log(error))
  )
})

/**
 * Activate service worker. Delete old caches if present.
 */
self.addEventListener('activate', (event) => {
	const currentCaches = [STATIC_CACHE, RUNTIME_CACHE]
	event.waitUntil(
		caches.keys()
		.then((cacheNames) => {
			return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
		})
		.then((cachesToDelete) => Promise.all(
			cachesToDelete.map((cacheToDelete) => caches.delete(cacheToDelete))
		))
		.then(() => self.clients.claim())
    .catch((error) => console.log(error))
	)
})

/**
 * Fetch cached data, taking into consideration the current route.
 */
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE)
      .then(cache => 
        fetch(event.request)
        .then(response => {
          // Clone response and append to cache.
          cache.put(event.request.url, response.clone())
          return response
        })
        .catch(
          // No need to return an error, we're likely offline and can at least serve what was last cached.
          () => caches.match(event.request)
        )
      )
    )
    // Data fetched, returning.
    return
  }

  event.respondWith(
    caches.open(STATIC_CACHE)
    .then(async cache => 
      cache.match(event.request)
      .then(response => response || fetch(event.request))
    )
  )
})