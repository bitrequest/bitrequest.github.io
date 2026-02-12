const CACHE = "bitrequest-page-v0.297",
	offlineFallbackPage = "index.html";

// Install: cache core assets with new version
self.addEventListener("install", function(event) {
	event.waitUntil(
		caches.open(CACHE).then(function(cache) {
			return cache.add(offlineFallbackPage);
		})
	);
	self.skipWaiting(); // activate immediately
});

// Activate: delete old versioned caches
self.addEventListener("activate", function(event) {
	event.waitUntil(
		caches.keys().then(function(keys) {
			return Promise.all(
				keys.filter(function(key) {
					return key.startsWith("bitrequest-page-") && key !== CACHE;
				}).map(function(key) {
					return caches.delete(key);
				})
			);
		})
	);
	self.clients.claim(); // take control of open tabs
});

// Fetch: try network first, fall back to cache for offline
self.addEventListener("fetch", function(event) {
	if (event.request.method !== "GET") return;

	if (event.request.destination === "image") {
		event.respondWith(
			caches.open(CACHE).then(function(cache) {
				return cache.match(event.request).then(function(cachedResponse) {
					if (cachedResponse) {
						return cachedResponse;
					}
					return fetch(event.request).then(function(networkResponse) {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				});
			})
		);
		return;
	}

	event.respondWith(
		fetch(event.request).catch(function(error) {
			if (event.request.destination !== "document" || event.request.mode !== "navigate") {
				return;
			}
			return caches.open(CACHE).then(function(cache) {
				return cache.match(offlineFallbackPage);
			});
		})
	);
});