// DO NOT EDIT THIS COPY OF sw.js
/**
 * Service worker for audio-tour-player
 * Place in your root or public folder as sw.js
 * It will be registered by the player and will cache the player library and tour data for offline use.
 * You can customize the caching strategy here if needed.
 * By default, it will cache all GET requests and serve from cache when offline.
 * dean@celticquietplaces.com
 */

const params = new URLSearchParams(self.location.search);
const CACHE_NAME = params.get('cacheName') || 'audio-tour-player-cache-v1';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                // store everything it is asked for
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        }).catch(() => {
            // Optional: return a fallback if both fail
        })
    );
});