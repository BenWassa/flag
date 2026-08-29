/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>;
};

const CACHE_PREFIX = 'flag-atlas-v30';
const PREVIOUS_CACHE_PREFIX = 'flag-atlas-v29';
const FLAG_CACHE = `${CACHE_PREFIX}-flags`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime`;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => (
          key.startsWith(PREVIOUS_CACHE_PREFIX) || /^flag-atlas-v\d+(?:-.+)?$/.test(key)
        ) && key !== FLAG_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key)),
    )),
  );
});

registerRoute(
  ({ url }) => url.hostname === 'flagcdn.com',
  new CacheFirst({
    cacheName: FLAG_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 195, purgeOnQuotaError: true }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: RUNTIME_CACHE,
    networkTimeoutSeconds: 4,
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  }),
);

setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    return await matchPrecache('index.html') ?? Response.error();
  }
  return Response.error();
});
