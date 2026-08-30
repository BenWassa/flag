import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = resolve('.pwa-runtime-builds');
const VERSIONS = ['runtime-a', 'runtime-b'] as const;
type Version = typeof VERSIONS[number];

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

function buildFixtures() {
  const result = spawnSync(process.execPath, ['scripts/build-pwa-runtime-fixtures.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`PWA runtime fixture build failed:\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { artifacts: Array<{ marker: Version; files: Record<string, string> }> };
}

async function startVersionedServer() {
  let active: Version = 'runtime-a';
  const server: Server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const relative = requestUrl.pathname === '/' ? 'index.html' : decodeURIComponent(requestUrl.pathname.slice(1));
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
    close: () => new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())),
  };
}

async function waitForServiceWorkerControl(page: Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  });
}

async function cacheState(page: Page, africaUrl?: string) {
  return page.evaluate(async (lazyUrl) => {
    const names = await caches.keys();
    const entries = await Promise.all(names.map(async (name) => ({
      name,
      urls: (await (await caches.open(name)).keys()).map((request) => request.url),
    })));
    return {
      names,
      hasAfrica: lazyUrl ? entries.some((entry) => entry.urls.includes(lazyUrl)) : false,
    };
  }, africaUrl);
}

async function openAfricaMap(page: Page, origin: string) {
  await page.goto(`${origin}/#/locations/africa`);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
}

test.describe.configure({ mode: 'serial' });

test('validates production PWA shell, lazy geography, offline reopening, and update recovery (#93/#101)', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'This persistent-context service-worker test has one desktop Chromium authority.');
  test.setTimeout(180_000);

  const identities = buildFixtures();
  expect(identities.artifacts[0].files['sw.js']).not.toBe(identities.artifacts[1].files['sw.js']);
  const server = await startVersionedServer();
  const profileRoot = await mkdtemp(resolve(tmpdir(), 'atlas-pwa-runtime-'));
  let context: BrowserContext | undefined;
  let firstTimeContext: BrowserContext | undefined;

  try {
    context = await chromium.launchPersistentContext(resolve(profileRoot, 'returning-learner'), { viewport: { width: 1280, height: 720 } });
    let page = await context.newPage();
    // First establish a controlled shell. A browser cannot runtime-cache a
    // lazy request made before its first service worker takes control.
    await page.goto(`${server.origin}/#/`);
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    await expect(page.locator('meta[name="atlas-pwa-runtime-build"]')).toHaveAttribute('content', 'runtime-a');
    await waitForServiceWorkerControl(page);
    await openAfricaMap(page, server.origin);

    const africaUrl = await page.evaluate(() => performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => /\/assets\/africa-[^/]+\.js$/.test(name)) ?? null);
    expect(africaUrl).not.toBeNull();
    await expect.poll(() => cacheState(page, africaUrl ?? undefined)).toMatchObject({ hasAfrica: true });
    await expect.poll(() => cacheState(page)).toMatchObject({ names: expect.arrayContaining(['flag-atlas-v30-runtime']) });

    // The returning learner closes the app, loses the network, and reopens the
    // shell. This uses a fresh document, so the lazy chunk must come from the
    // Workbox runtime cache rather than the original module graph.
    await context.setOffline(true);
    await page.close();
    page = await context.newPage();
    await page.goto(`${server.origin}/#/`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    await openAfricaMap(page, server.origin);

    // First-time lazy geography is deliberately not promised offline. A new
    // persistent profile receives the cached shell online, then attempts its
    // first Africa chunk while offline and receives the existing retry notice.
    firstTimeContext = await chromium.launchPersistentContext(resolve(profileRoot, 'first-time-lazy'), { viewport: { width: 1280, height: 720 } });
    const firstTimePage = await firstTimeContext.newPage();
    await firstTimePage.goto(`${server.origin}/#/`);
    await waitForServiceWorkerControl(firstTimePage);
    await firstTimeContext.setOffline(true);
    await firstTimePage.goto(`${server.origin}/#/locations/africa`, { waitUntil: 'domcontentloaded' });
    await expect(firstTimePage.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
    await firstTimePage.getByRole('button', { name: 'Play Africa' }).click();
    await expect(firstTimePage.getByRole('status').filter({ hasText: 'Africa map could not be loaded' })).toBeVisible();

    // Switch only the fixture server's deployed artifact. The same origin and
    // persistent returning-learner profile exercise registration, skipWaiting
    // and clientsClaim rather than treating an update as a new installation.
    await context.setOffline(false);
    server.switchTo('runtime-b');
    // The browser's periodic update check is represented explicitly here so
    // the test does not pretend a normal reload bypasses a cache-first
    // precache entry. The deployed app still performs the same registration;
    // this call advances the normally browser-scheduled update check now.
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('No service-worker registration to update.');
      await registration.update();
    });
    await page.waitForTimeout(250);
    await page.reload();
    await expect(page.locator('meta[name="atlas-pwa-runtime-build"]')).toHaveAttribute('content', 'runtime-b');
    await waitForServiceWorkerControl(page);
    await expect.poll(() => cacheState(page)).toMatchObject({ names: expect.arrayContaining(['flag-atlas-v30-runtime']) });
    // An active map route remains intentionally ephemeral after a document
    // reload, so update recovery returns to its stable Africa launcher.
    await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  } finally {
    await firstTimeContext?.close();
    await context?.close();
    await server.close();
    await rm(profileRoot, { recursive: true, force: true });
  }
});
