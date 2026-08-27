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
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();

  const assetUrls = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
  expect(assetUrls.some((url) => /\/app\.js$/.test(url))).toBe(true);
  expect(assetUrls.filter((url) => /\.(?:js|css)$/.test(url)).every((url) => new URL(url).origin === location.origin)).toBe(true);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifestResponse = await page.request.get(new URL(manifestHref ?? '', page.url()).href);
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json() as { start_url?: string; scope?: string; lang?: string; name?: string };
  expect(manifest).toMatchObject({ name: 'Atlas', lang: 'en-GB', start_url: './#/', scope: './' });

  await waitForServiceWorkerControl(page);
  await page.goto('/#/locations/africa');
  await expect(page.getByRole('heading', { name: /Africa locations launcher/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Africa locations launcher/ })).toBeVisible();

  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  const africaUrl = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .find((name) => /\/assets\/africa-[^/]+\.js$/.test(name)) ?? null);
  expect(africaUrl).toBeTruthy();
  expect(new URL(africaUrl ?? origin).origin).toBe(origin);

  await context.setOffline(true);
  await page.goto('/#/locations/africa', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Africa locations launcher/ })).toBeVisible();
  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await context.setOffline(false);
});

test('Firebase-origin Google sign-in reaches the provider flow without an unauthorised-domain failure (#107)', async ({ page }) => {
  await page.goto('/#/profile');
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  const button = page.getByRole('button', { name: 'Sign in with Google' });
  await expect(button).toBeVisible();

  const popupPromise = page.waitForEvent('popup', { timeout: 15_000 }).catch(() => null);
  await button.click();
  const popup = await popupPromise;
  const statusText = await page.getByRole('status').allTextContents();
  expect(statusText.join(' ')).not.toContain('unauthorised domain');
  expect(statusText.join(' ')).not.toContain('unauthorized domain');
  expect(popup, 'Google Auth should open its provider popup on the Firebase Hosting origin').not.toBeNull();
  await popup?.close();
});

test('local learning stays usable when Firebase service requests fail (#107)', async ({ page, context }) => {
  await context.route(/(?:googleapis|firebaseio|firebaseapp)\.com/, (route) => route.abort('failed'));
  await page.goto('/#/flags/africa');
  await expect(page.getByRole('heading', { name: /Africa flags launcher/ })).toBeVisible();
  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page.locator('.quiz-question')).toBeVisible();
  await expect(page.locator('.answer-grid button').first()).toBeEnabled();
});
