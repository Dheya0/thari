const CACHE_NAME = 'thari-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap'
];

// Install Event - cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Thari SW: Cache opened and assets pre-cached');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Thari SW: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - dynamic caching strategy (stale-while-revalidate & cache-first for assets)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass API calls, Google Gemini API, external database services to ensure they are live
  if (url.origin.includes('generativelanguage.googleapis.com') || req.method !== 'GET') {
    return; // Let browser handle it normally
  }

  // Network-first for the main document (to ensure updates are fetched immediately if online)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clonedResponse));
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/') || caches.match(req))
    );
    return;
  }

  // Cache-first for stable assets: fonts, standard scripts, stylesheets, CDN libraries, dynamic chunks
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache but trigger a background fetch to update it for next time (Stale-while-revalidate)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Ignore network errors during background fetch */});
        return cachedResponse;
      }

      // If not in cache, fallback to network and then cache it dynamically
      return fetch(req)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !url.href.includes('esm.sh') && !url.href.includes('tailwindcss.com')) {
            return networkResponse;
          }
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clonedResponse));
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting an image, we can return logo if needed
          const acceptHeader = req.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('image')) {
            return caches.match('logo.svg');
          }
        });
    })
  );
});

// Update the service worker immediately on message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
