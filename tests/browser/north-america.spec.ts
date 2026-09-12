import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { loadOutlineAsset } from '../../src/data/outlines.js';
import { landAdjacencyForScope } from '../../src/data/neighbors/index.js';

/**
 * North America expansion browser regression.
 *
 * Exhaustive curriculum, topology, cartography and multipart-geometry coverage
 * lives in the canonical Node verifiers (`verify-north-america.mjs`, map/outline
 * and neighbour verification). Generic browser contracts own Spatial framing,
 * Mastery, three-strike scoring, marker parity and accessibility. This file
 * therefore keeps only representative North America facts that need a rendered
 * production surface, rather than preserving the pre-#198/#202 mega-matrix.
 */

test.setTimeout(120_000);

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openCaribbeanPlay(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto('/#/locations/north-america/caribbean');
  await page.getByRole('button', { name: 'Play Caribbean' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function keyboardAnswer(page: Page, countryId: string) {
  const answer = page.locator(`[data-action="map-answer"][data-id="${countryId}"][tabindex]`).first();
  await expect(answer).toBeVisible();
  await answer.focus();
  await answer.press('Enter');
}

for (const viewport of [
  { name: 'narrow portrait', width: 320, height: 568 },
  { name: 'short landscape', width: 844, height: 390 },
]) {
  test(`Caribbean keeps complete rendered geography and retryable Play on ${viewport.name}`, async ({ page }) => {
    await openCaribbeanPlay(page, viewport);

    await expect(page.locator('.map-active-countries > .map-country')).toHaveCount(13);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const targetName = await page.locator('#map-prompt-heading').innerText();
    const targetId = countryIdForName(targetName);
    const wrongId = await page.locator('[data-action="map-answer"][data-id][tabindex]').evaluateAll((nodes, target) => (
      nodes.map((node) => node.getAttribute('data-id')).find((id) => id && id !== target) ?? null
    ), targetId);
    expect(wrongId).toBeTruthy();

    await keyboardAnswer(page, wrongId!);
    await expect(page.locator('#map-prompt-heading')).toHaveText(targetName);
    await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
    await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
    await expect(page.locator('.map-country--revealed')).toHaveCount(0);

    await keyboardAnswer(page, targetId);
    await expect(page.locator('.map-country--one-miss').first()).toBeAttached();
  });
}

test('North America topology edge cases remain complete in the browser bundle', async () => {
  const central = landAdjacencyForScope('central-america');
  const caribbean = landAdjacencyForScope('caribbean');
  expect(central).toBeDefined();
  expect(caribbean).toBeDefined();

  expect(central!.PAN).toContain('COL');
  expect(caribbean!.HTI).toEqual(['DOM']);
  expect(caribbean!.DOM).toEqual(['HTI']);

  const zeroNeighbourIds = Object.entries(caribbean!)
    .filter(([, neighbours]) => neighbours.length === 0)
    .map(([id]) => id)
    .sort();
  expect(zeroNeighbourIds).toEqual(['ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'GRD', 'JAM', 'KNA', 'LCA', 'TTO', 'VCT']);
});

test('Caribbean canonical multipart outlines remain available to the rendered activity', async ({ page }) => {
  const asset = await loadOutlineAsset('caribbean');
  expect(asset).toBeDefined();
  for (const id of ['BHS', 'ATG', 'KNA', 'VCT', 'TTO']) {
    expect(asset!.geometries[id]?.subpathCount, `${id} keeps canonical multipart geometry`).toBeGreaterThanOrEqual(2);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/outlines/north-america/caribbean');
  await page.getByRole('button', { name: 'Play Caribbean' }).click();
  await expect(page.locator('.outline-svg')).toBeVisible();
  const frame = await page.locator('.outline-svg').evaluate((svg) => {
    const svgRect = svg.getBoundingClientRect();
    const paths = [...svg.querySelectorAll<SVGPathElement>('path')]
      .map((path) => path.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    return {
      count: paths.length,
      inside: paths.every((rect) => rect.left >= svgRect.left - 1 && rect.right <= svgRect.right + 1
        && rect.top >= svgRect.top - 1 && rect.bottom <= svgRect.bottom + 1),
    };
  });
  expect(frame.count).toBeGreaterThan(0);
  expect(frame.inside).toBe(true);
});

test('North America Neighbours launches with topology-backed interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/neighbors/north-america/central-america');
  await page.getByRole('button', { name: 'Play Central America' }).click();
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-neighbor-map-host]')).toHaveAttribute('data-target-id', /.+/);
  await expect(page.locator('#neighbor-country-input')).toBeVisible();
});
