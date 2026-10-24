// Offline copy of the app. Pages and lists go to the network first, so a phone gets the latest build.
// Hashed chunks don't change, so they come from the cache first. Songs and skins come from the cache too,
// and refresh in the background.
const CACHE = "offline-v4";
// Every deploy adds new chunks, so the oldest entries go once the cache grows past this.
const MAX_ENTRIES = 400;
// The worker sits at the app's base path, so its scope ends with it.
const BASE = new URL(self.registration.scope).pathname;
const IMMUTABLE_PREFIXES = [`${BASE}_next/static/`];
const REFRESHED_PREFIXES = [
  `${BASE}songs/`,
  `${BASE}songs-json/`,
  `${BASE}skins/`,
];
// The song list changes with every new song, so it stays network-first.
const NETWORK_FIRST_PATHS = new Set([`${BASE}songs/index.json`]);

const trimCache = async () => {
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, keys.length - MAX_ENTRIES).map((key) => cache.delete(key))
  );
};

// The trim runs once per page load, so a burst of chunk responses doesn't list the cache each time.
const fetchAndCache = async (event, trim) => {
  const response = await fetch(event.request);
  // A 206 for a byte range can't go in the cache.
  if (response.status === 200) {
    const copy = response.clone();
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.put(event.request, copy))
        .then(() => (trim ? trimCache() : undefined))
        .catch(() => {})
    );
  }
  return response;
};

const networkFirst = async (event) => {
  try {
    return await fetchAndCache(event, event.request.mode === "navigate");
  } catch (error) {
    const cached = await caches.match(event.request);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

const cacheFirst = async (event, refresh) => {
  const cached = await caches.match(event.request);
  if (!cached) {
    return fetchAndCache(event, false);
  }
  if (refresh) {
    event.waitUntil(fetchAndCache(event, false).catch(() => {}));
  }
  return cached;
};

const startsWithAny = (path, prefixes) =>
  prefixes.some((prefix) => path.startsWith(prefix));

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
  const path = url.pathname;
  if (startsWithAny(path, IMMUTABLE_PREFIXES)) {
    event.respondWith(cacheFirst(event, false));
  } else if (
    startsWithAny(path, REFRESHED_PREFIXES) &&
    !NETWORK_FIRST_PATHS.has(path)
  ) {
    event.respondWith(cacheFirst(event, true));
  } else {
    event.respondWith(networkFirst(event));
  }
});
