const CACHE_NAME = "dolical-pwa-v2"; // <-- sube la versión cuando cambies index
const ASSETS = ["./", "./index.html", "./manifest.json", "./sw.js"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network-first para HTML (para que se actualice), cache-first para lo demás
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Para la página principal: intenta red primero
  if (req.mode === "navigate" || req.url.includes("index.html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  // Para otros archivos: cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
