import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = resolve('.pwa-runtime-builds');
const VERSIONS = ['runtime-a', 'runtime-b'] as const;
type Version = typeof VERSIONS[number];

type FixtureIdentity = {
  marker: Version;
  buildIdentity: string;
  files: Record<string, string>;
};

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

let identities: { artifacts: FixtureIdentity[] };

function buildFixtures() {
  const result = spawnSync(process.execPath, ['scripts/build-pwa-runtime-fixtures.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`PWA runtime fixture build failed:\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { artifacts: FixtureIdentity[] };
}

async function startVersionedServer() {
  let active: Version = 'runtime-a';
  let serviceWorkerFailure = false;
  const requests: Array<{ version: Version; path: string }> = [];
  const server: Server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const relative = requestUrl.pathname === '/' ? 'index.html' : decodeURIComponent(requestUrl.pathname.slice(1));
    requests.push({ version: active, path: relative });
    if (relative === 'sw.js' && serviceWorkerFailure) {
      response.writeHead(503, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' });
      response.end('Service worker unavailable');
      return;
    }

    try {
      const root = resolve(ROOT, active);
      const file = resolve(root, relative);
      if (!file.startsWith(`${root}/`) && file !== root) throw new Error('Invalid fixture path.');
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Fixture path is not a file.');
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': contentTypes[extname(file)] ?? 'application/octet-stream',
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404, { 'cache-control': 'no-store' });
      response.end('Not found');
    }
  });
  await new Promise<void>((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('PWA runtime fixture server did not bind to TCP.');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    switchTo(version: Version) { active = version; },
    failServiceWorker(value: boolean) { serviceWorkerFailure = value; },
    requestCount(path: string, version?: Version) {
      return requests.filter((entry) => entry.path === path && (!version || entry.version === version)).length;
    },
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  };
}

function buildIdentity(version: Version): string {
  const artifact = identities.artifacts.find((candidate) => candidate.marker === version);
  if (!artifact) throw new Error(`Missing fixture identity for ${version}.`);
  return artifact.buildIdentity;
}

async function instrumentDocumentLoads(page: Page) {
  await page.addInitScript(() => {
    const key = 'atlas-pwa-test-document-loads';
    const count = Number(sessionStorage.getItem(key) ?? '0') + 1;
    sessionStorage.setItem(key, String(count));
  });
}

async function documentLoads(page: Page) {
  return page.evaluate(() => Number(sessionStorage.getItem('atlas-pwa-test-document-loads') ?? '0'));
}

async function waitForServiceWorkerControl(page: Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  });
}

async function waitForWaitingWorker(page: Page) {
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
}

async function expectBuild(page: Page, version: Version) {
  await expect(page.locator('meta[name="atlas-build"]')).toHaveAttribute('content', buildIdentity(version));
}

async function cacheState(page: Page, targetUrl?: string) {
  return page.evaluate(async (url) => {
    const names = await caches.keys();
    const entries = await Promise.all(names.map(async (name) => ({
      name,
      urls: (await (await caches.open(name)).keys()).map((request) => request.url),
    })));
    return {
      names,
      hasTarget: url ? entries.some((entry) => entry.urls.includes(url)) : false,
    };
  }, targetUrl);
}

async function openAfricaMap(page: Page, origin: string) {
  await page.goto(`${origin}/#/locations/africa`);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function exitAfricaRound(page: Page) {
  await page.getByRole('button', { name: 'Exit map round' }).click();
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
}

async function triggerProductionDiscovery(page: Page) {
  // Exercise Atlas's reconnect hook. The test deliberately does not call
  // ServiceWorkerRegistration.update() or reload the document.
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
}

async function launchPersistent(profile: string): Promise<BrowserContext> {
  return chromium.launchPersistentContext(profile, { viewport: { width: 1280, height: 720 } });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  identities = buildFixtures();
  expect(identities.artifacts[0].files['sw.js']).not.toBe(identities.artifacts[1].files['sw.js']);
});

test('fresh install retains shell, lazy geography and honest first-use offline behaviour', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);
  const server = await startVersionedServer();
  const profileRoot = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-fresh-'));
  let context: BrowserContext | undefined;
  let firstTimeContext: BrowserContext | undefined;

  try {
    context = await launchPersistent(resolve(profileRoot, 'returning'));
    const page = await context.newPage();
    await page.goto(`${server.origin}/#/`);
    await expectBuild(page, 'runtime-a');
    await waitForServiceWorkerControl(page);
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.updateViaCache)).toBe('none');

    await openAfricaMap(page, server.origin);
    const africaUrl = await page.evaluate(() => performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => /\/assets\/africa-[^/]+\.js$/.test(name)) ?? null);
    expect(africaUrl).not.toBeNull();
    await expect.poll(() => cacheState(page, africaUrl ?? undefined)).toMatchObject({ hasTarget: true });
    await expect.poll(() => cacheState(page)).toMatchObject({ names: expect.arrayContaining(['flag-atlas-runtime-v1']) });

    await context.setOffline(true);
    await page.goto(`${server.origin}/#/`, { waitUntil: 'domcontentloaded' });
    await expectBuild(page, 'runtime-a');
    await waitForServiceWorkerControl(page);
    await openAfricaMap(page, server.origin);

    firstTimeContext = await launchPersistent(resolve(profileRoot, 'first-time-lazy'));
    const firstTimePage = await firstTimeContext.newPage();
    await firstTimePage.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(firstTimePage);
    await firstTimeContext.setOffline(true);
    await firstTimePage.goto(`${server.origin}/#/locations/africa`, { waitUntil: 'domcontentloaded' });
    await expect(firstTimePage.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
    await firstTimePage.getByRole('button', { name: 'Play Africa' }).click();
    await expect(firstTimePage.getByRole('status').filter({ hasText: 'Africa map could not be loaded' })).toBeVisible();
  } finally {
    await firstTimeContext?.close();
    await context?.close();
    await server.close();
    await rm(profileRoot, { recursive: true, force: true });
  }
});

test('returning learner launch discovers B and performs exactly one controlled reload', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);
  const server = await startVersionedServer();
  const profile = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-returning-'));
  let context: BrowserContext | undefined;

  try {
    context = await launchPersistent(profile);
    let page = await context.newPage();
    await page.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(page);
    await openAfricaMap(page, server.origin);
    await exitAfricaRound(page);

    // Seed one pre-#191 Atlas-owned cache entry to prove the schema migration
    // preserves data before deleting only the old Atlas cache.
    const legacySentinel = `${server.origin}/legacy-runtime-sentinel`;
    await page.evaluate(async (url) => {
      const cache = await caches.open('flag-atlas-v30-runtime');
      await cache.put(url, new Response('legacy', { status: 200 }));
    }, legacySentinel);
    await context.close();
    context = undefined;

    server.switchTo('runtime-b');
    context = await launchPersistent(profile);
    page = await context.newPage();
    await instrumentDocumentLoads(page);
    const bSwRequestsBefore = server.requestCount('sw.js', 'runtime-b');
    await page.goto(`${server.origin}/#/`);
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();

    await expect.poll(() => server.requestCount('sw.js', 'runtime-b')).toBeGreaterThan(bSwRequestsBefore);
    await expectBuild(page, 'runtime-b');
    await expect.poll(() => documentLoads(page)).toBe(2);
    await page.waitForTimeout(1_000);
    expect(await documentLoads(page)).toBe(2);

    await expect.poll(() => cacheState(page, legacySentinel)).toMatchObject({
      names: expect.not.arrayContaining(['flag-atlas-v30-runtime']),
      hasTarget: true,
    });
    await context.setOffline(true);
    await openAfricaMap(page, server.origin);
  } finally {
    await context?.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('active round defers B until the learner exits to a safe surface', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);
  const server = await startVersionedServer();
  const profile = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-active-'));
  let context: BrowserContext | undefined;

  try {
    context = await launchPersistent(profile);
    const page = await context.newPage();
    await instrumentDocumentLoads(page);
    await page.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(page);
    await openAfricaMap(page, server.origin);
    expect(await documentLoads(page)).toBe(1);

    server.switchTo('runtime-b');
    await triggerProductionDiscovery(page);
    await waitForWaitingWorker(page);
    await expectBuild(page, 'runtime-a');
    await expect(page.locator('#map-prompt-heading')).toBeVisible();
    expect(await documentLoads(page)).toBe(1);

    await exitAfricaRound(page);
    await expectBuild(page, 'runtime-b');
    await expect.poll(() => documentLoads(page)).toBe(2);
    await page.waitForTimeout(1_000);
    expect(await documentLoads(page)).toBe(2);
  } finally {
    await context?.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('offline to online transition automatically discovers and adopts B', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);
  const server = await startVersionedServer();
  const profile = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-reconnect-'));
  let context: BrowserContext | undefined;

  try {
    context = await launchPersistent(profile);
    const page = await context.newPage();
    await instrumentDocumentLoads(page);
    await page.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(page);
    await context.setOffline(true);
    await expectBuild(page, 'runtime-a');

    server.switchTo('runtime-b');
    await context.setOffline(false);
    await triggerProductionDiscovery(page);
    await expectBuild(page, 'runtime-b');
    await expect.poll(() => documentLoads(page)).toBe(2);
  } finally {
    await context?.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('safe tab cannot force an active-round tab to reload; all clients adopt once safe', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(220_000);
  const server = await startVersionedServer();
  const profile = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-multiclient-'));
  let context: BrowserContext | undefined;

  try {
    context = await launchPersistent(profile);
    const safePage = await context.newPage();
    const activePage = await context.newPage();
    await instrumentDocumentLoads(safePage);
    await instrumentDocumentLoads(activePage);
    await safePage.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(safePage);
    await activePage.goto(`${server.origin}/#/locations/africa`);
    await activePage.getByRole('button', { name: 'Play Africa' }).click();
    await expect(activePage.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });

    server.switchTo('runtime-b');
    await triggerProductionDiscovery(safePage);
    await waitForWaitingWorker(safePage);
    await expectBuild(safePage, 'runtime-a');
    await expectBuild(activePage, 'runtime-a');
    await expect(activePage.locator('#map-prompt-heading')).toBeVisible();
    expect(await documentLoads(safePage)).toBe(1);
    expect(await documentLoads(activePage)).toBe(1);

    await exitAfricaRound(activePage);
    await expectBuild(safePage, 'runtime-b');
    await expectBuild(activePage, 'runtime-b');
    await expect.poll(() => documentLoads(safePage)).toBe(2);
    await expect.poll(() => documentLoads(activePage)).toBe(2);
    await safePage.waitForTimeout(1_000);
    expect(await documentLoads(safePage)).toBe(2);
    expect(await documentLoads(activePage)).toBe(2);
  } finally {
    await context?.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('failed B update leaves A usable and preserves its offline shell', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);
  const server = await startVersionedServer();
  const profile = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-failure-'));
  let context: BrowserContext | undefined;

  try {
    context = await launchPersistent(profile);
    const page = await context.newPage();
    await page.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(page);
    await expectBuild(page, 'runtime-a');

    server.switchTo('runtime-b');
    server.failServiceWorker(true);
    const requestsBefore = server.requestCount('sw.js', 'runtime-b');
    await triggerProductionDiscovery(page);
    await expect.poll(() => server.requestCount('sw.js', 'runtime-b')).toBeGreaterThan(requestsBefore);
    await page.waitForTimeout(500);
    await expectBuild(page, 'runtime-a');
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    expect((await cacheState(page)).names.some((name) => name.startsWith('workbox-precache-v2-'))).toBe(true);

    await context.setOffline(true);
    await page.goto(`${server.origin}/#/`, { waitUntil: 'domcontentloaded' });
    await expectBuild(page, 'runtime-a');
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible({ timeout: 40_000 });
  } finally {
    await context?.close();
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});
