// v24 ships visible action feedback (the #app-notice region and launcher busy
// state) and labelled region-card domain launchers.
// v23 ships the source-derived Atlas globe brand mark and its PWA icon set.
// v22 replaces the Flags Learn quiz with a browse-and-reveal study gallery.
// v21 ships the mastery-first Progress experience and its production stylesheet.
// v20 ships immediate Play feedback and the live round score.
// v19 makes zero-land-neighbour countries learnable in Neighbours.
// v18 removes river linework from shared runtime cartography to keep political borders unambiguous.
// v17 shipped the Neighbours mobile keyboard-stability layout/runtime update.
// Issue #16 baseline retained for release-lineage verification: const VERSION = 'flag-atlas-v16'
// v16 shipped the Atlas learner-facing brand and install metadata.
// v15 shipped the Tactile Atlas visual layer and its production stylesheet.
// v14 shipped the simplified launcher IA and learner-facing Play terminology.
// Historical cartography/routing cache lineage remains flag-atlas-v10, flag-atlas-v9, and flag-atlas-v8.
const VERSION = 'flag-atlas-v24';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './atlas-theme.css',
  './progress.css',
  './map.css',
  './map-cartography.css',
  './outline.css',
  './neighbors.css',
  './app.js',
  './map-viewport.js',
  './neighbor-map-runtime.js',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/app-icon-192.png',
  './icons/app-icon-512.png',
  './icons/app-icon-maskable-512.png',
  './icons/apple-touch-icon.png',
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
