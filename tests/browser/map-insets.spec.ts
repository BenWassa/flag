import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { label: 'mobile portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 740, height: 360 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`keeps Levant geography usable without popup chrome in ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#/locations/asia/middle-east');
    await page.getByRole('button', { name: 'Play Middle East' }).click();
    await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
    await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });

    await expect(page.locator('[data-map-inset]')).toHaveCount(0);
    await expect(page.locator('.map-inset-source')).toHaveCount(0);
    for (const id of ['LBN', 'ISR', 'PSE']) {
      await expect(page.locator(`.map-country[data-id="${id}"] .map-country__shape`)).toHaveCount(1);
      await expect(page.locator(`.map-country[data-action="map-answer"][data-id="${id}"]`)).toHaveCount(1);
      await expect(page.locator(`.map-assist-hits [data-action="map-answer"][data-id="${id}"]`)).toHaveCount(1);
    }
  });
}
