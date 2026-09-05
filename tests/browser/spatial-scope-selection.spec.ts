import { expect, test, type Page } from '@playwright/test';

/** Issue #198 — geography owns scope choice; the command band owns only the selected scope. */

const STAGE = '.spatial-stage[data-ready="true"] canvas';
const achievementKey = 'flag-atlas:earned-achievements:v1';

test.setTimeout(120_000);

async function openSpatial(page: Page, path: string) {
  await page.goto(`/#${path}`);
  await page.waitForSelector(STAGE, { timeout: 30_000 });
  await page.waitForTimeout(500);
}

const scope = (page: Page, id: string) => page.locator(`.spatial-scope[data-scope-id="${id}"]`);

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('geography-led scope choice', () => {
  test('world → continent → region exposes only selected-scope progress and actions', async ({ page }) => {
    await openSpatial(page, '/flags');

    await expect(page.locator('.spatial-command__progress')).toHaveCount(0);
    await expect(page.locator('.spatial-command__fallback-choices')).toHaveCount(0);
    await expect(page.locator('.spatial-chip')).toHaveCount(0);

    await scope(page, 'africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Africa' })).toBeVisible();
    await expect(page.locator('.spatial-command__progress[data-scope-id="africa"]')).toHaveCount(1);
    await expect(page.locator('.spatial-command__progress [role="img"]')).toHaveAccessibleName(/\d+ of \d+ cleared/i);
    await expect(page.locator('.spatial-command__crest-slot')).toHaveCount(1);
    await expect(page.locator('.spatial-command__fallback-choices')).toHaveCount(0);

    await scope(page, 'west-africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/West Africa/i);
    await expect(page.locator('.spatial-command__progress[data-scope-id="west-africa"]')).toHaveCount(1);
    await expect(page.locator('.spatial-command__progress')).toHaveCount(1);
    await expect(page.locator('.spatial-command__crest-slot')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Learn West Africa' })).toBeVisible();
    await expect(page.getByRole('button', { name: /North Africa/ })).toHaveCount(1); // projected geography control only
    await expect(page.locator('.spatial-command').getByRole('button', { name: /North Africa/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Learn West Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa\/learn$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await page.getByRole('button', { name: 'Play West Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa\/test$/);
  });

  test('Back/Forward and a cold deep link preserve the geography hierarchy', async ({ page }) => {
    await openSpatial(page, '/neighbors/oceania/melanesia');
    await expect(page.locator('.spatial-command__progress[data-scope-id="melanesia"]')).toHaveCount(1);
    await expect(scope(page, 'melanesia')).toHaveAttribute('aria-current', 'true');

    await scope(page, 'polynesia').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/neighbors\/oceania\/polynesia$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/neighbors\/oceania\/melanesia$/);
    await page.goForward();
    await expect(page).toHaveURL(/#\/neighbors\/oceania\/polynesia$/);
  });
});

test.describe('selected continent prestige', () => {
  test('unearned continent reserves the crest slot without inventing Mastery', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    await expect(page.locator('.spatial-command__crest-slot')).toHaveCount(1);
    await expect(page.getByRole('img', { name: /continent crest earned/i })).toHaveCount(0);
    await expect(page.locator('.spatial-command')).not.toContainText(/Africa Mastered|continent Mastery/i);
  });

  test('earned persisted continent completion exposes the existing crest accessibly', async ({ page }) => {
    await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify({
      version: 1,
      regionDomainMasteries: [],
      completeRegions: [],
      completeContinents: ['africa'],
      worldCrown: false,
    })), { key: achievementKey });
    await openSpatial(page, '/flags/africa');

    await expect(page.getByRole('img', { name: 'Africa complete, continent crest earned' })).toBeVisible();
    await expect(page.locator('.spatial-command')).not.toContainText(/Africa Mastered|continent Mastery/i);
  });
});

test.describe('compact mobile and short-landscape composition', () => {
  for (const viewport of [
    { name: 'small portrait', width: 320, height: 568 },
    { name: 'phone portrait', width: 390, height: 844 },
    { name: 'short landscape', width: 844, height: 390 },
    { name: '200% effective phone zoom', width: 195, height: 422 },
  ]) {
    test(`${viewport.name} keeps geography, progress and actions usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openSpatial(page, '/flags/africa/west-africa');

      await expect(page.locator('.spatial-command__fallback-choices')).toHaveCount(0);
      await expect(page.locator('.spatial-command__progress')).toHaveCount(1);
      await page.getByRole('button', { name: 'Play West Africa' }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Learn West Africa' })).toBeVisible();
      const stage = (await page.locator('.spatial-stage').boundingBox())!;
      expect(stage.width).toBeGreaterThan(80);
      expect(stage.height).toBeGreaterThan(80);
      await expectNoHorizontalOverflow(page);

      if (viewport.width === 390) {
        await page.screenshot({ path: 'test-results/issue-198/selected-region-390x844.png', fullPage: true });
      }
      if (viewport.width === 844) {
        await page.screenshot({ path: 'test-results/issue-198/selected-region-844x390.png', fullPage: true });
      }
    });
  }
});

test.describe('accessibility and fallback', () => {
  test('keyboard selection, progress wording and reduced motion remain intact', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSpatial(page, '/flags/africa');

    const west = scope(page, 'west-africa');
    await west.focus();
    await expect(west).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect(page.locator('.spatial-command__progress [role="img"]')).toHaveAccessibleName(/\d+ of \d+ cleared/i);
    await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
  });

  test('forced colours replaces hidden WebGL choices with an isolated ordinary scope list', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/#/flags/africa');

    await expect(page.locator('.spatial-stage')).toBeHidden();
    const fallback = page.locator('.spatial-command__fallback-choices');
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole('button', { name: 'West Africa' })).toBeVisible();
    await fallback.getByRole('button', { name: 'West Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect(page.locator('.spatial-command__progress[data-scope-id="west-africa"]')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test('renderer failure continues to use the conventional launcher rather than a dead Spatial list', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/#/flags/africa');

    await expect(page.locator('.spatial-shell')).toHaveCount(0);
    await expect(page.locator('.spatial-command__fallback-choices')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Play West Africa/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
