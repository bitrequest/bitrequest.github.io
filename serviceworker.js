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