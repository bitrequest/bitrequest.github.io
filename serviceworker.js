const CACHE = "bitrequest-page";

const offlineFallbackPage = "index.html";

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", function(event) {
	console.log("Install Event processing");
	event.waitUntil(
		caches.open(CACHE).then(function(cache) {
			console.log("Cached offline page during install");
			return cache.add(offlineFallbackPage);
		})
	);
});

// If any fetch fails, it will show the offline page.
self.addEventListener("fetch", function(event) {
	if (event.request.method !== "GET") return;

	// --- IMAGE CACHING LOGIC ---
	if (event.request.destination === "image") {
		event.respondWith(
			// CORRECTED: Use the 'CACHE' variable you defined.
			caches.open(CACHE).then(cache => {
				// 1. Check if the image is in our cache
				return cache.match(event.request).then(cachedResponse => {
					// 2. If it's in the cache, return it immediately
					if (cachedResponse) {
						return cachedResponse;
					}

					// 3. If not, fetch it from the network
					return fetch(event.request).then(networkResponse => {
						// 4. And store a copy in the cache for next time
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					});
				});
			})
		);
		// Important: Return here to stop the rest of the function from running for images
		return;
	}

	// --- OFFLINE FALLBACK LOGIC for other requests ---
	event.respondWith(
		fetch(event.request).catch(function(error) {
			// The following validates that the request was for a navigation to a new document
			if (event.request.destination !== "document" || event.request.mode !== "navigate") {
				return;
			}
			console.error("Error", "Network request Failed. Serving offline page " + error);
			return caches.open(CACHE).then(function(cache) {
				return cache.match(offlineFallbackPage);
			});
		})
	);
});

// This is an event that can be fired from your page to tell the SW to update the offline page
self.addEventListener("refreshOffline", function() {
	const offlinePageRequest = new Request(offlineFallbackPage);
	return fetch(offlineFallbackPage).then(function(response) {
		return caches.open(CACHE).then(function(cache) {
			console.log("Offline page updated from refreshOffline event: " + response.url);
			return cache.put(offlinePageRequest, response);
		});
	});
});