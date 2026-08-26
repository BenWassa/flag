import { expect, test, type Page } from '@playwright/test';

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

// The opening frame and the CSS-pixel hit normalisation are applied on the first
// animation frame after the map mounts, so measurements must wait for that.
async function settleMapViewport(page: Page) {
  await page.waitForFunction(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    const svg = document.querySelector('.map-svg');
    const normalisedHit = document.querySelector('[data-id="TGO"] .map-country__callout-hit')?.getBoundingClientRect();
    return viewport?.dataset.mapPositioned === 'true'
      && svg?.getAttribute('viewBox') !== viewport.dataset.mapViewbox
      && (!normalisedHit || Math.min(normalisedHit.width, normalisedHit.height) >= 43.5);
  });
}

// Issue #112: the whole-Africa Learn view must open complete, without an initial
// pan or zoom, at phone portrait and short-landscape sizes.
const AFRICA_LEARN_VIEWPORTS = [
  { label: 'small portrait', width: 320, height: 568 },
  { label: 'tall portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 740, height: 360 },
];

for (const viewport of AFRICA_LEARN_VIEWPORTS) {
  test(`opens whole-Africa Learn fully framed on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#/locations/africa');
    await page.getByRole('button', { name: 'Learn Africa' }).click();
    await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.map-country')).toHaveCount(54);
    await settleMapViewport(page);

    const framing = await page.evaluate(() => {
      const stage = document.querySelector('.map-stage')!.getBoundingClientRect();
      const scroll = document.querySelector('[data-map-viewport]')!.getBoundingClientRect();
      const cropped: string[] = [];
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      // #117 moved the assisted touch surfaces into .map-assist-hits, beneath the
      // country shapes. They are still part of the answer surface the generated
      // frame reserves room for (HIT_SURFACE_FOCUS_RESERVE), so framing is still
      // measured across both layers.
      const answerSurfaces = document.querySelectorAll(
        '.map-country, .map-assist-hits > [data-action="map-answer"]',
      );
      for (const country of answerSurfaces) {
        const box = country.getBoundingClientRect();
        left = Math.min(left, box.left); top = Math.min(top, box.top);
        right = Math.max(right, box.right); bottom = Math.max(bottom, box.bottom);
        if (box.left < stage.left - 1 || box.right > stage.right + 1
          || box.top < stage.top - 1 || box.bottom > stage.bottom + 1) {
          cropped.push(country.getAttribute('data-id') ?? '?');
        }
      }
      const callout = document.querySelector('[data-id="TGO"] .map-country__callout-hit')!.getBoundingClientRect();
      return {
        cropped,
        // The map surface must fill the stage; if an intermediate wrapper
        // collapses to the SVG's own ratio the viewport maths frames the wrong box.
        fillsStage: Math.abs(scroll.height - stage.height) <= 2 && Math.abs(scroll.width - stage.width) <= 2,
        usedHeight: (bottom - top) / stage.height,
        usedWidth: (right - left) / stage.width,
        togoTarget: Math.min(callout.width, callout.height),
        togoOnStage: callout.left >= stage.left - 1 && callout.right <= stage.right + 1
          && callout.top >= stage.top - 1 && callout.bottom <= stage.bottom + 1,
      };
    });

    expect(framing.cropped).toEqual([]);
    expect(framing.fillsStage).toBe(true);
    // Breathing room, not dead space: the continent uses most of one stage axis
    // while staying inside both.
    expect(Math.max(framing.usedWidth, framing.usedHeight)).toBeGreaterThan(0.85);
    expect(framing.usedWidth).toBeLessThanOrEqual(1);
    expect(framing.usedHeight).toBeLessThanOrEqual(1);
    expect(Math.round(framing.togoTarget)).toBeGreaterThanOrEqual(44);
    expect(framing.togoOnStage).toBe(true);
  });
}

test("Togo's leader line reads vertically", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/africa');
  await page.getByRole('button', { name: 'Learn Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 30000 });
  await settleMapViewport(page);

  const offVerticalDeg = await page.evaluate(() => {
    const svg = document.querySelector('.map-svg') as SVGSVGElement;
    const line = document.querySelector('[data-id="TGO"] .map-country__callout-line') as SVGLineElement;
    const toScreen = (x: number, y: number) => {
      const point = svg.createSVGPoint();
      point.x = x; point.y = y;
      return point.matrixTransform(svg.getScreenCTM()!);
    };
    const from = toScreen(line.x1.baseVal.value, line.y1.baseVal.value);
    const to = toScreen(line.x2.baseVal.value, line.y2.baseVal.value);
    return Math.atan2(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * 180 / Math.PI;
  });

  expect(offVerticalDeg).toBeLessThanOrEqual(20);
});
