/// <reference lib="webworker" />

import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const __ATLAS_BUILD_IDENTITY__: string;

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>;
};

const BUILD_IDENTITY = __ATLAS_BUILD_IDENTITY__;
// These generations describe Atlas-owned runtime-cache schemas, not releases.
// Routine application deployments invalidate through Workbox revisions,
// content-hashed Vite assets and BUILD_IDENTITY without changing these names.
const FLAG_CACHE = 'flag-atlas-flags-v1';
const RUNTIME_CACHE = 'flag-atlas-runtime-v1';
const LEGACY_CACHE_PATTERN = /^flag-atlas-v(\d+)-(flags|runtime)$/;
const SAFETY_RESPONSE_TIMEOUT_MS = 1_500;
const SPATIAL_PREVIEW_PATH = new URL('spatial/', self.registration.scope).pathname;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

interface UpdateAttemptMessage {
  type: 'ATLAS_UPDATE_ATTEMPT';
}

interface UpdateSafetyResponse {
  type: 'ATLAS_UPDATE_SAFETY_RESPONSE';
  requestId: string;
  safe: boolean;
}

let activationAttempt: Promise<void> | null = null;

function relevantWindowClients(): Promise<WindowClient[]> {
  const scope = new URL(self.registration.scope);
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => clients.filter((client): client is WindowClient => {
    const url = new URL(client.url);
    return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
  }));
}

function sameClientSet(left: readonly WindowClient[], right: readonly WindowClient[]): boolean {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right.map((client) => client.id));
  return left.every((client) => rightIds.has(client.id));
}

function queryClientSafety(client: WindowClient, phase: number): Promise<boolean> {
  const requestId = `${BUILD_IDENTITY}:${phase}:${Date.now()}:${Math.random()}`;
  const channel = new MessageChannel();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (safe: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      channel.port1.close();
      resolve(safe);
    };
    const timeout = setTimeout(() => finish(false), SAFETY_RESPONSE_TIMEOUT_MS);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data as Partial<UpdateSafetyResponse> | null;
      finish(Boolean(
        response
        && response.type === 'ATLAS_UPDATE_SAFETY_RESPONSE'
        && response.requestId === requestId
        && response.safe === true,
      ));
    };
    client.postMessage({
      type: 'ATLAS_UPDATE_SAFETY_QUERY',
      requestId,
      buildIdentity: BUILD_IDENTITY,
    }, [channel.port2]);
  });
}

async function allClientsSafe(clients: readonly WindowClient[], phase: number): Promise<boolean> {
  if (clients.length === 0) return true;
  const responses = await Promise.all(clients.map((client) => queryClientSafety(client, phase)));
  return responses.every(Boolean);
}

async function coordinateSafeActivation(): Promise<void> {
  if (activationAttempt) return activationAttempt;
  activationAttempt = (async () => {
    const firstClients = await relevantWindowClients();
    if (!await allClientsSafe(firstClients, 1)) return;

    const secondClients = await relevantWindowClients();
    if (!sameClientSet(firstClients, secondClients)) return;
    if (!await allClientsSafe(secondClients, 2)) return;

    const finalClients = await relevantWindowClients();
    if (!sameClientSet(secondClients, finalClients)) return;

    await self.skipWaiting();
  })().finally(() => { activationAttempt = null; });
  return activationAttempt;
}

self.addEventListener('message', (event) => {
  const message = event.data as Partial<UpdateAttemptMessage> | null;
  if (message?.type !== 'ATLAS_UPDATE_ATTEMPT') return;
  event.waitUntil(coordinateSafeActivation());
});

async function copyCacheEntries(sourceName: string, targetName: string): Promise<void> {
  const source = await caches.open(sourceName);
  const target = await caches.open(targetName);
  for (const request of await source.keys()) {
    if (await target.match(request)) continue;
    const response = await source.match(request);
    if (response) await target.put(request, response);
  }
}

async function migrateAndCleanAtlasRuntimeCaches(): Promise<void> {
  const keys = await caches.keys();
  const legacy = keys
    .map((name) => ({ name, match: name.match(LEGACY_CACHE_PATTERN) }))
    .filter((entry): entry is { name: string; match: RegExpMatchArray } => entry.match !== null)
    .sort((left, right) => Number(right.match[1]) - Number(left.match[1]));

  for (const { name, match } of legacy) {
    const target = match[2] === 'flags' ? FLAG_CACHE : RUNTIME_CACHE;
    await copyCacheEntries(name, target);
  }
  await Promise.all(legacy.map(({ name }) => caches.delete(name)));
}

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await migrateAndCleanAtlasRuntimeCaches();
    // Preserve first-install control, but claim only after activation has been
    // earned by the browser lifecycle or the all-client safety handshake.
    await self.clients.claim();
    for (const client of await relevantWindowClients()) {
      client.postMessage({ type: 'ATLAS_UPDATE_ACTIVATED', buildIdentity: BUILD_IDENTITY });
    }
  })());
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
  ({ url }) => url.origin === self.location.origin && !url.pathname.startsWith(SPATIAL_PREVIEW_PATH),
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
