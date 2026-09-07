import { expect, test, type Page } from '@playwright/test';

const HOME = '.spatial-command[data-surface="domains"]';
const STAGE = '.spatial-stage[data-ready="true"]';

test.setTimeout(120_000);

async function openHome(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/#/');
  await expect(page.locator(HOME)).toBeVisible();
  await expect(page.locator(STAGE)).toBeVisible({ timeout: 30_000 });
}

async function material(page: Page) {
  return page.locator(HOME).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      shadow: style.boxShadow,
      backdrop: style.backdropFilter,
    };
  });
}

function expectOpaque(background: string) {
  // Chromium may serialise modern color-mix output as rgb(), rgba() or
  // color(srgb ...). Explicit alpha below 1 is the contract violation; the
  // serialisation family itself is not a product behaviour.
  expect(background).not.toMatch(/\/\s*0(?:\.\d+)?\s*\)?$/);
  expect(background).not.toMatch(/rgba\([^)]*,\s*0(?:\.\d+)?\s*\)$/);
}

async function rotateGlobe(page: Page, dx: number, dy: number) {
  const stage = page.locator('.spatial-stage__surface');
  const box = (await stage.boundingBox())!;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(180);
}

test('#196 Home chooser is stable neutral chrome across globe positions and core viewports', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await openHome(page, viewport.width, viewport.height);
    const initial = await material(page);

    expectOpaque(initial.background);
    expect(initial.backdrop).toBe('none');
    expect(initial.shadow).not.toBe('none');

    await page.screenshot({ path: test.info().outputPath(`home-neutral-${viewport.width}x${viewport.height}-initial.png`) });

    await rotateGlobe(page, Math.round(viewport.width * 0.24), -24);
    expect((await material(page)).background).toBe(initial.background);
    await page.screenshot({ path: test.info().outputPath(`home-neutral-${viewport.width}x${viewport.height}-position-b.png`) });

    await rotateGlobe(page, -Math.round(viewport.width * 0.48), 34);
    expect((await material(page)).background).toBe(initial.background);
    await page.screenshot({ path: test.info().outputPath(`home-neutral-${viewport.width}x${viewport.height}-position-c.png`) });
  }
});

test('#196 neutral material is already present while WebGL loads and remains accessible in alternate media', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/assets\/stage-controller-[^/]+\.js$/, async (route) => {
    await gate;
    await route.continue();
  });

  try {
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator(HOME)).toBeVisible();
    const loading = await material(page);
    expectOpaque(loading.background);
    expect(loading.backdrop).toBe('none');
  } finally {
    release();
  }

  await expect(page.locator(STAGE)).toBeVisible({ timeout: 30_000 });

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator(HOME)).toBeVisible();
  await expect(page.locator('.spatial-stage')).toBeHidden();
  for (const mode of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
    await expect(page.getByRole('button', { name: new RegExp(`^${mode}, \\d+ of \\d+ cleared$`) })).toBeVisible();
  }
});
