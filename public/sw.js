// Taranom Mehr Service Worker — improved caching strategy.
// - Hashed asset files (/assets/*) are cached long-term (they're immutable).
// - The app shell (index.html) is network-first so new deploys appear instantly.
// - API requests are NEVER cached (always go to the network).

const CACHE_VERSION = "taranom-v3"; // v3: never cache non-JS/CSS/HTML-mislabeled asset responses
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Delete ALL old caches from previous versions.
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept same-origin API calls — they must always hit the network.
  if (url.pathname.startsWith("/api/")) return;

  // Same-origin only (don't touch cross-origin fonts/images/CDNs).
  if (url.origin !== self.location.origin) return;

  // Hashed build assets are immutable → cache-first (instant loads, offline).
  // Only cache responses whose Content-Type matches the expected file type —
  // during an edge rollout an asset URL can briefly return the SPA fallback
  // HTML; caching that poisons the module loader for that asset forever.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then(async (resp) => {
          if (resp && resp.status === 200) {
            const ct = (resp.headers.get("content-type") || "").toLowerCase();
            const isJs = url.pathname.endsWith(".js") || url.pathname.endsWith(".mjs");
            const isCss = url.pathname.endsWith(".css");
            const typeOk =
              (isJs && (ct.includes("javascript") || ct.includes("ecmascript") || ct === "")) ||
              (isCss && (ct.includes("css") || ct === "")) ||
              (!isJs && !isCss);
            if (typeOk) {
              const copy = resp.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
            }
          }
          return resp;
        }).catch(() => cached)
      )
    );
    return;
  }

  // App shell (HTML pages) → network-first, fall back to cache when offline.
  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/index.html")))
    );
    return;
  }
});
