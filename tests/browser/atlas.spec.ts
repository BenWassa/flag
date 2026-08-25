import { expect, test } from '@playwright/test';

test('plays a whole continent from its launcher row', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  await page.getByRole('button', { name: /Flags/i }).click();
  await expect(page.getByRole('heading', { name: 'Flags' })).toBeVisible();
  await page.getByRole('button', { name: /Africa/i }).click();
  await expect(page.getByRole('heading', { name: /Africa/i })).toBeVisible();
  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^1\./ })).toBeVisible();
});

test('plays a region directly from its launcher row', async ({ page }) => {
  await page.goto('/#/flags/africa');
  await page.getByRole('button', { name: 'Play West Africa' }).click();
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'West Africa' })).toBeVisible();
  // The round was started from the continent launcher, so Back returns there
  // rather than to an intermediate region selection.
  await page.goBack();
  await expect(page).toHaveURL(/#\/flags\/africa$/);
});

test('starts a Locations region round without a separate selection step', async ({ page }) => {
  await page.goto('/#/locations/africa');
  await page.getByRole('button', { name: 'Play West Africa' }).click();
  await expect(page.getByRole('heading', { name: 'Find' })).toBeHidden();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/#\/locations\/africa\/west-africa\/test$/);
});
