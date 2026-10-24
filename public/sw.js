// Offline copy of the app. The network goes first, so a phone gets the latest build and its matching chunks.
const CACHE = "offline-v3";
// Every deploy adds new chunks, so the oldest entries go once the cache grows past this.
const MAX_ENTRIES = 400;

const trimCache = async (cache) => {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, keys.length - MAX_ENTRIES).map((key) => cache.delete(key))
  );
};

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // API answers depend on the user and go stale, so they stay out of the cache.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.includes("/api/")
  ) {
    return;
  }
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        // A 206 for a byte range can't go in the cache.
        if (response.status === 200) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE)
              .then(async (cache) => {
                await cache.put(request, copy);
                await trimCache(cache);
              })
              .catch(() => {})
          );
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        throw error;
      }
    })()
  );
});
