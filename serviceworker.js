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

const CODE_CACHE_VERSION = "v0.330",
	CODE_CACHE = "bitrequest-code-" + CODE_CACHE_VERSION,
	STATIC_CACHE = "bitrequest-static-v1", // bump only if you replace a static asset in-place
	OFFLINE_FALLBACK = "index.html";

// Extensions classed as "static" — long-lived, version-tolerant.
// Everything else (.js, .css, .html, .json) goes to CODE_CACHE.
const STATIC_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|mp3|ogg|wav)$/i;

function pick_cache(url_or_path) {
	const path = (typeof url_or_path === "string") ? url_or_path : url_or_path.pathname;
	return STATIC_EXTS.test(path) ? STATIC_CACHE : CODE_CACHE;
}

// Pull asset URLs out of index.html. Skips external (http(s)://, //...) URLs
// so we don't try to precache Google Fonts, CDNs, etc.
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

// Same-origin file-extensioned URLs are cache candidates.
// Excludes the SPA shell (e.g. "/?p=settings"), API/proxy calls, cross-origin.
function should_cache(url) {
	if (url.origin !== self.location.origin) return false;
	if (url.pathname.startsWith("/proxy/")) return false;
	return /\.[a-z0-9]+$/i.test(url.pathname);
}

// Install: fetch index.html, parse, precache discovered assets into the
// appropriate cache (code vs. static). Uses individual cache.add() with
// .catch() instead of cache.addAll() so a single missing/renamed file
// doesn't break the entire install.
self.addEventListener("install", function(event) {
	event.waitUntil(
		fetch(OFFLINE_FALLBACK, { cache: "reload" })
			.then(function(response) { return response.text(); })
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
							const target = (asset === OFFLINE_FALLBACK)
								? code_cache
								: (pick_cache(asset) === STATIC_CACHE ? static_cache : code_cache);
							return target.add(asset).catch(function(err) {
								console.warn("SW: precache failed for " + asset, err);
							});
						})
					);
				});
			})
	);
	self.skipWaiting();
});

// Activate: delete old versioned code caches. STATIC_CACHE is left alone
// so users don't re-download 124KB of SVG + sound on every release.
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
		})
	);
	self.clients.claim();
});

// Fetch: network-first for code, cache-first for images/static.
// Runtime-caches any cacheable same-origin response into the right bucket.
self.addEventListener("fetch", function(event) {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);

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
						if (networkResponse.ok && url.origin === self.location.origin) {
							cache.put(event.request, networkResponse.clone());
						}
						return networkResponse;
					});
				});
			})
		);
		return;
	}

	// Everything else (code, HTML): network-first, cache successes, fall back to cache offline.
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
				// Try both caches before giving up.
				return caches.match(event.request).then(function(cachedResponse) {
					if (cachedResponse) return cachedResponse;
					if (event.request.mode === "navigate" || event.request.destination === "document") {
						return caches.match(OFFLINE_FALLBACK);
					}
				});
			})
	);
});
