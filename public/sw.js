// v12 adds the Neighbors map presentation runtime while retaining the v11 four-domain shell.
// Historical cartography/routing cache lineage remains flag-atlas-v10, flag-atlas-v9, and flag-atlas-v8.
const VERSION = 'flag-atlas-v12';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './map.css',
  './map-cartography.css',
  './outline.css',
  './neighbors.css',
  './app.js',
  './map-viewport.js',
  './neighbor-map-runtime.js',
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

async function shellFromNetwork(request) {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
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

  // Dynamically imported continent assets are cached here after first geography use,
  // preserving a light initial shell while making revisits offline-capable.
  if (url.origin === self.location.origin) {
    event.respondWith(shellFromNetwork(request));
  }
});
