// ============================================================
// Bitrequest Service Worker
//
// VERSION DISCIPLINE
// Bump CODE_CACHE_VERSION on every release (or whenever any cached code/HTML
// file changes). The activate handler deletes any older versioned code cache,
// forcing a re-fetch.
//
// Static assets (images, fonts, sounds, the inline SVG bundle) live in a
// separate, unversioned cache that survives releases — they don't need to be
// re-downloaded every time a JS file changes. If a static file is genuinely
// replaced, rename it or change its query string to bust.
//
// PRECACHE STRATEGY
// At install, fetch index.html and parse out every <script src>, <link href>,
// and <source src> — that's the precache list. Any URL referenced from
// index.html is cached automatically, no manual list to maintain. Each asset
// is sorted into CODE_CACHE or STATIC_CACHE by extension.
//
// CSS-referenced assets (fonts, background images) and the dynamically
// injected non-English lang file aren't in index.html, so they're handled
// by the fetch handler (cache successful same-origin responses).
// ============================================================

const CODE_CACHE_VERSION = "v0.357",
	CODE_CACHE = "bitrequest-code-" + CODE_CACHE_VERSION,
	STATIC_CACHE = "bitrequest-static-v1",
	OFFLINE_FALLBACK = "index.html";

const STATIC_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|mp3|ogg|wav)$/i;

function pick_cache(url_or_path) {
	const path = (typeof url_or_path === "string") ? url_or_path : url_or_path.pathname;
	return STATIC_EXTS.test(path) ? STATIC_CACHE : CODE_CACHE;
}

function discover_assets(html) {
	const urls = new Set([OFFLINE_FALLBACK]);
	const patterns = [
		/<script\s+[^>]*src=["']([^"']+)["']/gi,
		/<link\s+[^>]*href=["']([^"']+)["']/gi,
		/<source\s+[^>]*src=["']([^"']+)["']/gi,
	];
	for (const re of patterns) {
		let m;
		while ((m = re.exec(html)) !== null) {
			const url = m[1];
			if (!url.startsWith("http") && !url.startsWith("//")) {
				urls.add(url);
			}
		}
	}
	return [...urls];
}

function should_cache(url) {
	if (url.origin !== self.location.origin) return false;
	if (url.pathname.startsWith("/proxy/")) return false;
	return /\.[a-z0-9]+$/i.test(url.pathname);
}

function precache_asset(asset, code_cache, static_cache) {
	const is_code = asset === OFFLINE_FALLBACK || pick_cache(asset) !== STATIC_CACHE,
		target = is_code ? code_cache : static_cache;
	return fetch(asset, { cache: "reload" }).then(function(response) {
		if (!response.ok) {
			throw new Error("HTTP " + response.status);
		}
		return target.put(asset, response);
	}).catch(function(err) {
		console.warn("SW: precache failed for " + asset, err);
		if (is_code) {
			throw err; // incomplete code cache: abort install, the current version stays active
		}
	});
}

self.addEventListener("install", function(event) {
	event.waitUntil(
		fetch(OFFLINE_FALLBACK, { cache: "reload" })
			.then(function(response) {
				if (!response.ok) {
					throw new Error("SW: " + OFFLINE_FALLBACK + " fetch failed (HTTP " + response.status + ")");
				}
				return response.text();
			})
			.then(function(html) {
				const assets = discover_assets(html);
				return Promise.all([
					caches.open(CODE_CACHE),
					caches.open(STATIC_CACHE),
				]).then(function(opened) {
					const code_cache = opened[0],
						static_cache = opened[1];
					return Promise.all(
						assets.map(function(asset) {
							return precache_asset(asset, code_cache, static_cache);
						})
					);
				});
			})
			.then(function() {
				return self.skipWaiting();
			})
	);
});

self.addEventListener("activate", function(event) {
	event.waitUntil(
		caches.keys().then(function(keys) {
			return Promise.all(
				keys.filter(function(key) {
					return key.startsWith("bitrequest-code-") && key !== CODE_CACHE;
				}).map(function(key) {
					return caches.delete(key);
				})
			);
		}).then(function() {
			return self.clients.claim();
		})
	);
});

self.addEventListener("fetch", function(event) {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);

	if (url.origin !== self.location.origin) return;

	// Static (images, fonts, sounds): cache-first
	if (event.request.destination === "image"
		|| event.request.destination === "font"
		|| event.request.destination === "audio"
		|| STATIC_EXTS.test(url.pathname)) {
		event.respondWith(
			caches.open(STATIC_CACHE).then(function(cache) {
				return cache.match(event.request).then(function(cachedResponse) {
					if (cachedResponse) return cachedResponse;
					return fetch(event.request).then(function(networkResponse) {
						if (networkResponse.ok) {
							cache.put(event.request, networkResponse.clone());
						}
						return networkResponse;
					}).catch(function() {
						return new Response("", { status: 504, statusText: "Offline" });
					});
				});
			})
		);
		return;
	}

	// Code / HTML / navigation: network-first
	event.respondWith(
		fetch(event.request)
			.then(function(networkResponse) {
				if (networkResponse.ok && should_cache(url)) {
					const clone = networkResponse.clone();
					caches.open(CODE_CACHE).then(function(cache) {
						cache.put(event.request, clone);
					});
				}
				return networkResponse;
			})
			.catch(function() {
				return caches.match(event.request).then(function(cachedResponse) {
					if (cachedResponse) return cachedResponse;
					if (event.request.mode === "navigate" || event.request.destination === "document") {
						return caches.match(OFFLINE_FALLBACK);
					}
				}).then(function(response) {
					return response || new Response("", { status: 504, statusText: "Offline" });
				});
			})
	);
});