import { expect, test, type Page } from '@playwright/test';

const STORAGE_PROBE = 'atlas-spatial-preview-deployment-probe';

async function waitForServiceWorkerControl(page: Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  });
}

async function classicCachesContainSpatialRequests(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith('flag-atlas-v30'));
    for (const name of names) {
      const requests = await (await caches.open(name)).keys();
      if (requests.some((request) => new URL(request.url).pathname.includes('/spatial/'))) return true;
    }
    return false;
  });
}

test('classic Atlas opts into the same-origin Spatial Atlas preview safely', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toHaveCount(0);
  await waitForServiceWorkerControl(page);

  const previewLink = page.getByRole('link', { name: 'Try Spatial Atlas' });
  await expect(previewLink).toBeVisible();
  await expect(previewLink).toHaveAttribute('href', './spatial/#/');

  await page.evaluate((key) => localStorage.setItem(key, 'shared'), STORAGE_PROBE);
  await previewLink.click();
  await expect(page).toHaveURL(/\/spatial\/#\/$/);
  await expect(page.getByText('Spatial preview', { exact: true })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toBeVisible();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_PROBE)).toBe('shared');
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope.includes('/spatial/') ?? false)).toBe(true);
  expect(await classicCachesContainSpatialRequests(page)).toBe(false);

  await page.getByRole('link', { name: 'Return to classic Atlas home' }).click();
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_PROBE)).toBe('shared');
});

test('preview escape stays independent of spatial navigation state', async ({ page }) => {
  await page.goto('/spatial/#/flags/africa');
  await expect(page.getByText('Spatial preview', { exact: true })).toBeVisible();
  const classic = page.getByRole('link', { name: 'Return to classic Atlas home' });
  await expect(classic).toHaveAttribute('href', '../#/');
  await classic.click();
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toHaveCount(0);
});
