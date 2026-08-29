import { expect, test } from '@playwright/test';

const STORAGE_PROBE = 'atlas-spatial-preview-deployment-probe';

test('classic Atlas opts into the same-origin Spatial Atlas preview safely', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toHaveCount(0);

  const previewLink = page.getByRole('link', { name: 'Try Spatial Atlas' });
  await expect(previewLink).toBeVisible();
  await expect(previewLink).toHaveAttribute('href', './spatial/#/');

  await page.evaluate((key) => localStorage.setItem(key, 'shared'), STORAGE_PROBE);
  await previewLink.click();
  await expect(page).toHaveURL(/\/spatial\/#\/$/);
  await expect(page.getByText('Spatial preview', { exact: true })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toBeVisible();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_PROBE)).toBe('shared');

  await page.getByRole('link', { name: 'Return to classic Atlas' }).click();
  await expect(page).toHaveURL(/\/#\/$/);
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await expect(page.locator('.spatial-shell')).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_PROBE)).toBe('shared');
});

test('preview escape preserves the current typed hash route', async ({ page }) => {
  await page.goto('/spatial/#/flags/africa');
  await expect(page.getByText('Spatial preview', { exact: true })).toBeVisible();
  const classic = page.getByRole('link', { name: 'Return to classic Atlas' });
  await expect(classic).toHaveAttribute('href', '../#/flags/africa');
  await classic.click();
  await expect(page).toHaveURL(/\/#\/flags\/africa$/);
  await expect(page.getByRole('heading', { name: /Africa flags launcher/ })).toBeVisible();
});
