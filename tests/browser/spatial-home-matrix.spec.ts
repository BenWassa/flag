import { expect, test, type Page } from '@playwright/test';

const STAGE = '.spatial-stage[data-ready="true"] canvas';
const MODES = ['Flags', 'Locations', 'Outlines', 'Neighbours'] as const;

test.setTimeout(120_000);

async function openHome(page: Page) {
  await page.goto('/#/');
  await page.waitForSelector(STAGE, { timeout: 30_000 });
}

for (const viewport of [
  { label: 'small portrait', width: 320, height: 568 },
  { label: 'tablet portrait', width: 768, height: 1024 },
  { label: 'desktop', width: 1440, height: 900 },
]) {
  test(`#187 ${viewport.label} keeps the full globe and complete chooser in one viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openHome(page);

    const stage = (await page.locator('.spatial-stage').boundingBox())!;
    const chooser = page.locator('.spatial-command[data-surface="domains"]');
    const chooserBox = (await chooser.boundingBox())!;

    expect(stage.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(stage.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(chooserBox.x).toBeGreaterThanOrEqual(0);
    expect(chooserBox.x + chooserBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(chooserBox.y).toBeGreaterThanOrEqual(0);
    expect(chooserBox.y + chooserBox.height).toBeLessThanOrEqual(viewport.height + 1);

    if (viewport.width >= 768) expect(chooserBox.width).toBeLessThanOrEqual(562);

    for (const mode of MODES) {
      const button = page.getByRole('button', { name: new RegExp(`^${mode}, \\d+ of \\d+ cleared$`) });
      await expect(button).toBeVisible();
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y).toBeGreaterThanOrEqual(-1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }

    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow.x).toBeLessThanOrEqual(1);
    expect(overflow.y).toBeLessThanOrEqual(1);
  });
}

test('#187 Home accessibility tree exposes one navigation group with four progress-labelled buttons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);

  const modes = page.getByRole('navigation', { name: 'Learning modes' });
  await expect(modes).toBeVisible();
  const snapshot = await modes.ariaSnapshot();
  for (const mode of MODES) {
    expect(snapshot).toMatch(new RegExp(`button "${mode}, \\d+ of \\d+ cleared"`));
  }
  expect(snapshot).not.toContain('dialog');
});
