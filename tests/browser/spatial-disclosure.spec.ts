import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Issue #197 — progressive disclosure of continent, region and country detail.
 *
 * The derivations behind this are proved in Node by
 * `scripts/verify-spatial-disclosure.mjs`. What only a real renderer can answer
 * is here: that the names actually land on the geography, stay inside the stage,
 * follow the camera, retire when the hierarchy changes, and reach the same
 * routes their equivalent controls do.
 *
 * Headless Chromium is engineering evidence, not physical-device evidence.
 */

const STAGE = '.spatial-stage[data-ready="true"] canvas';

test.setTimeout(120_000);

async function openSpatial(page: Page, path: string) {
  await page.goto(`/#${path}`);
  await page.waitForSelector(STAGE, { timeout: 30000 });
  // One settled camera, so projected positions are the ones a learner sees.
  await page.waitForTimeout(900);
}

const scopeNames = (page: Page) => page.locator('.spatial-scopes .spatial-scope');
const visibleNames = (page: Page) => page.locator('.spatial-scope[data-facing="front"]');
const named = (page: Page, name: string) => page.locator('.spatial-scope', { hasText: name });

async function names(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((elements) => elements.map((element) => element.textContent?.trim() ?? ''));
}

test.describe('the Earth names what can be chosen', () => {
  test('world level offers every continent as a control on the globe', async ({ page }) => {
    await openSpatial(page, '/flags');
    await expect(scopeNames(page)).toHaveCount(6);
    // Distinct from the command surface's own "Continents" group, so a screen
    // reader announces two useful lists rather than the same one twice.
    await expect(page.locator('.spatial-scopes')).toHaveAttribute('aria-label', 'Continents on the globe');
    // The globe opens over Africa and Europe, so at least those are written on it.
    expect(await visibleNames(page).count()).toBeGreaterThan(0);
    for (const label of await names(scopeNames(page))) {
      expect(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']).toContain(label);
    }
  });

  test('a name on the globe reaches the same route as its equivalent control', async ({ page }) => {
    await openSpatial(page, '/flags');
    await named(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    const viaName = page.url();
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags$/);
    await page.locator('.spatial-chip', { hasText: 'Africa' }).click();
    expect(page.url()).toBe(viaName);
  });

  test('choosing a continent reveals its areas and no country borders', async ({ page }) => {
    await openSpatial(page, '/flags');
    await named(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await expect(page.locator('.spatial-scopes')).toHaveAttribute('aria-label', 'Areas of Africa on the globe');
    expect(await names(scopeNames(page))).toEqual([
      'North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa',
    ]);
    // Continent names have retired: the decision in front of the learner changed.
    await expect(named(page, 'Asia')).toHaveCount(0);
  });

  test('choosing an area keeps navigation at area level', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    await named(page, 'West Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    // The siblings stay named and selectable; only the current one is marked.
    await expect(scopeNames(page)).toHaveCount(5);
    await expect(page.locator('.spatial-scope[aria-current="true"]')).toHaveCount(1);
    await expect(page.locator('.spatial-scope[aria-current="true"]')).toContainText('West Africa');
    await named(page, 'North Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa\/north-africa$/);
  });

  test('Back and Forward walk the hierarchy the names present', async ({ page }) => {
    await openSpatial(page, '/flags');
    await named(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await named(page, 'East Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa\/east-africa$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await expect(scopeNames(page)).toHaveCount(5);
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags$/);
    await expect(scopeNames(page)).toHaveCount(6);
    await page.goForward();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
  });

  test('a cold deep link opens already naming its own level', async ({ page }) => {
    await openSpatial(page, '/neighbors/oceania/melanesia');
    expect(await names(scopeNames(page))).toEqual([
      'Australia & New Zealand', 'Melanesia', 'Micronesia', 'Polynesia',
    ]);
    await expect(page.locator('.spatial-scope[aria-current="true"]')).toContainText('Melanesia');
  });

  test('names retire while an activity owns the geography', async ({ page }) => {
    // The names are real DOM anchored over the stage, so a yielding activity has
    // to retire them, not merely stop drawing them: they would otherwise remain
    // controls for a scope the learner is no longer choosing. Every domain,
    // because every live activity yields (#207).
    for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
      await openSpatial(page, `/${domain}/africa/southern-africa`);
      await expect(scopeNames(page), domain).toHaveCount(5);
      await page.getByRole('button', { name: 'Play Southern Africa' }).click();
      await expect(scopeNames(page), domain).toHaveCount(0);
    }
  });

  test('every named area of every continent is present in every domain', async ({ page }) => {
    for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
      for (const continent of ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania']) {
        await openSpatial(page, `/${domain}/${continent}`);
        const chips = await page.locator('.spatial-command__choices .spatial-chip').allTextContents();
        const areas = chips.map((text) => text.trim()).filter((text) => !text.startsWith('All '));
        expect(await names(scopeNames(page)), `${domain}/${continent}`).toEqual(areas);
      }
    }
  });
});

test.describe('names behave as geography, and as controls', () => {
  test('a name carries a full-size touch target whatever its glyph', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    const box = (await visibleNames(page).first().boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  });

  test('a drag that starts on a name rotates the Earth without navigating', async ({ page }) => {
    await openSpatial(page, '/flags');
    const target = visibleNames(page).first();
    const box = (await target.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(page).toHaveURL(/#\/flags$/);
  });

  test('a name is keyboard operable and selects rather than starting a round', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    await named(page, 'East Africa').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/flags\/africa\/east-africa$/);
    await expect(page.getByRole('button', { name: 'Play East Africa' })).toBeVisible();
  });

  test('reaching a name behind the planet turns the Earth to it', async ({ page }) => {
    await openSpatial(page, '/flags');
    // The globe opens over Africa, so a Pacific continent starts out of sight.
    const oceania = named(page, 'Oceania');
    await expect(oceania).toHaveAttribute('data-facing', 'back');
    await oceania.focus();
    await expect(oceania).toHaveAttribute('data-facing', 'front', { timeout: 5000 });
    // Turning to a name is a camera nudge, never a route change.
    await expect(page).toHaveURL(/#\/flags$/);
  });

  test('names follow the camera when the learner rotates the Earth', async ({ page }) => {
    await openSpatial(page, '/flags');
    const africa = named(page, 'Africa');
    const before = (await africa.boundingBox())!;
    const stage = (await page.locator('.spatial-stage__surface').boundingBox())!;
    await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(stage.x + stage.width / 2 - 70, stage.y + stage.height * 0.8, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    const after = (await africa.boundingBox())!;
    expect(Math.abs(after.x - before.x)).toBeGreaterThan(8);
  });

  test('a renderer that cannot start leaves every scope as an ordinary control', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/#/flags/africa');
    await expect(page.locator('.spatial-scopes')).toHaveCount(0);
    for (const area of ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa']) {
      await expect(page.getByRole('button', { name: new RegExp(`Play ${area}`) })).toBeVisible();
    }
  });
});

test.describe('names stay legible on every viewport', () => {
  const viewports = [
    { name: 'small portrait', width: 320, height: 568 },
    { name: 'phone portrait', width: 390, height: 844 },
    { name: 'short landscape', width: 844, height: 390 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} keeps every drawn name inside the geography`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      // Asia is the densest label set Atlas ships: six areas in one frame.
      await openSpatial(page, '/flags/asia');
      const stage = (await page.locator('.spatial-stage__surface').boundingBox())!;
      const drawn = visibleNames(page);
      const count = await drawn.count();
      expect(count).toBeGreaterThan(0);
      const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
      for (let index = 0; index < count; index += 1) {
        const box = (await drawn.nth(index).boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(stage.x - 1);
        expect(box.y).toBeGreaterThanOrEqual(stage.y - 1);
        expect(box.x + box.width).toBeLessThanOrEqual(stage.x + stage.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(stage.y + stage.height + 1);
        boxes.push(box);
      }
      // Names separate rather than pile up: no two drawn names sit on top of
      // one another.
      for (let a = 0; a < boxes.length; a += 1) {
        for (let b = a + 1; b < boxes.length; b += 1) {
          const overlapX = Math.min(boxes[a].x + boxes[a].width, boxes[b].x + boxes[b].width) - Math.max(boxes[a].x, boxes[b].x);
          const overlapY = Math.min(boxes[a].y + boxes[a].height, boxes[b].y + boxes[b].height) - Math.max(boxes[a].y, boxes[b].y);
          expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(0);
        }
      }
      // The geography still owns the viewport and nothing scrolls sideways.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test('reduced motion still arrives at the named destination', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSpatial(page, '/flags');
    await named(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await expect(scopeNames(page)).toHaveCount(5);
  });
});
