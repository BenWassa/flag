const VERSION = 'flag-atlas-v3';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/app-icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

/**
 * Flags are content-addressed by country code and never change, so serving them
 * from the cache is both correct and the fastest path.
 */
async function flagFirstFromCache(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

/**
 * The app shell is versioned by deploy, not by URL. Serving it cache-first meant
 * a returning learner kept running the previously installed build until the
 * cache name happened to change, so a shipped fix could sit invisible behind a
 * warm cache. The network decides, and the cache is what makes the app work
 * offline rather than what defines which build runs.
 */
async function shellFromNetwork(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // A navigation to any in-app URL still resolves to the one document.
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname === 'flagcdn.com') {
    event.respondWith(flagFirstFromCache(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(shellFromNetwork(request));
  }
});
