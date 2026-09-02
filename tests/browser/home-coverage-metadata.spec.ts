import { expect, test, type Page } from '@playwright/test';

const modes = ['Flags', 'Locations', 'Outlines', 'Neighbours'] as const;

async function disableWebGl(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (typeof type === 'string' && type.includes('webgl')) return null;
      return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test('Spatial Home uses useful progress instead of repeated World metadata', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/');
  await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30_000 });

  const command = page.locator('.spatial-command');
  await expect(command).not.toContainText(/\bWorld\b/);
  for (const mode of modes) {
    await expect(command.getByRole('button', { name: new RegExp(`^${mode}, \\d+ of \\d+ cleared$`) })).toBeVisible();
  }
});

for (const viewport of [
  { label: 'phone portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 844, height: 390 },
]) {
  test(`fallback Home stays clear without coverage labels at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await disableWebGl(page);
    await page.goto('/#/');

    await expect(page.locator('.spatial-shell')).toHaveCount(0);
    await expect(page.locator('.atlas-card__identity small')).toHaveCount(0);
    for (const mode of modes) {
      await expect(page.locator('.atlas-card').filter({ hasText: mode })).toHaveAccessibleName(new RegExp(`${mode}.*\\d+ of \\d+ cleared`, 'i'));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
