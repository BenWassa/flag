import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorkerControl(page: Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  });
}

test.describe.configure({ mode: 'serial' });

test('accepts the live Firebase Hosting PWA origin (#107)', async ({ page, context, baseURL }) => {
  if (!baseURL) throw new Error('Firebase Hosting baseURL is required.');
  const origin = new URL(baseURL).origin;

  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Choose what to learn' })).toBeVisible();

  const assetUrls = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
  expect(assetUrls.some((url) => /\/app\.js$/.test(url))).toBe(true);
  expect(assetUrls.filter((url) => /\.(?:js|css)$/.test(url)).every((url) => new URL(url).origin === origin)).toBe(true);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifestResponse = await page.request.get(new URL(manifestHref ?? '', page.url()).href);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json() as { start_url?: string; scope?: string; lang?: string; name?: string };
  expect(manifest).toMatchObject({ name: 'Atlas', lang: 'en-GB', start_url: './#/', scope: './' });

  await waitForServiceWorkerControl(page);
  await page.goto('/#/locations/africa');
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  const africaUrl = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .find((name) => /\/assets\/africa-[^/]+\.js$/.test(name)) ?? null);
  expect(africaUrl).toBeTruthy();
  expect(new URL(africaUrl ?? origin).origin).toBe(origin);

  await context.setOffline(true);
  await page.goto('/#/locations/africa', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await context.setOffline(false);
});

test('serves Spatial Atlas as the default presentation on the live origin (#166)', async ({ page }) => {
  await page.goto('/#/');
  // The globe is the navigation surface, not an opt-in preview beside it.
  await expect(page.locator('.spatial-shell')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try Spatial Atlas' })).toHaveCount(0);

  await page.goto('/#/locations/africa/west-africa');
  await expect(page.getByRole('heading', { name: 'West Africa', exact: true })).toBeVisible();
  // Play is immediately available, with no launcher page underneath the globe.
  await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
  await expect(page.locator('.page--launcher')).toHaveCount(0);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifestResponse = await page.request.get(new URL(manifestHref ?? '', page.url()).href);
  expect(manifestResponse.ok()).toBe(true);
  expect(await manifestResponse.json()).toMatchObject({ name: 'Atlas', scope: './', start_url: './#/' });

  // The retired preview path is gone from the deployed origin.
  const retired = await page.request.get(new URL('./spatial/preview-source.json', page.url()).href);
  expect(retired.ok()).toBe(false);
});
