import { expect, test } from '@playwright/test';

test('moves from the Atlas home screen into a live Flags round', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await page.getByRole('button', { name: /Flags/i }).click();
  await expect(page.getByRole('heading', { name: 'Flags' })).toBeVisible();
  await page.getByRole('button', { name: /Africa/i }).click();
  await expect(page.getByRole('heading', { name: /Africa/i })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^1\./ })).toBeVisible();
});

test('loads the interactive Locations launcher map', async ({ page }) => {
  await page.goto('/#/locations');
  await page.getByRole('button', { name: /Africa/i }).click();
  const map = page.getByRole('group', { name: 'Africa region selector' });
  await expect(map).toBeVisible();
  await expect(map.getByRole('button', { name: 'Select North Africa' })).toBeVisible();
});
