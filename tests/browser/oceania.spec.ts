import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { loadOutlineAsset } from '../../src/data/outlines.js';
import { getNeighborScopeConfig, landAdjacencyForScope } from '../../src/data/neighbors/index.js';

/**
 * Oceania expansion browser regression.
 *
 * Exhaustive scope membership, generated topology, cartography and outline
 * integrity live in `verify-oceania.mjs` and the shared map/outline/neighbour
 * verifiers. Current generic browser suites own Spatial framing, tiny-marker
 * parity, Mastery and the three-strike ladder. Keep only representative Pacific
 * rendering/interaction facts here instead of the historical mega-matrix.
 */

test.setTimeout(120_000);

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openMicronesiaPlay(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto('/#/locations/oceania/micronesia');
  await page.getByRole('button', { name: 'Play Micronesia' }).click();
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
  test(`Micronesia keeps practical assistance and retryable Play on ${viewport.name}`, async ({ page }) => {
    await openMicronesiaPlay(page, viewport);
    await expect(page.locator('.map-active-countries > .map-country')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const targetName = await page.locator('#map-prompt-heading').innerText();
    const targetId = countryIdForName(targetName);
    const assist = page.locator(`.map-current-target-hit[data-id="${targetId}"]`);
    await expect(assist).toHaveCount(1);
    const diameter = await assist.evaluate((element) => {
      const circle = element as SVGCircleElement;
      const matrix = circle.getScreenCTM();
      if (!matrix) return 0;
      const radius = circle.r.baseVal.value;
      return Math.min(
        radius * 2 * Math.hypot(matrix.a, matrix.b),
        radius * 2 * Math.hypot(matrix.c, matrix.d),
      );
    });
    expect(diameter).toBeGreaterThanOrEqual(43.5);

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

test('Oceania topology keeps PNG–Indonesia and zero-neighbour island policy', async () => {
  const melanesia = landAdjacencyForScope('melanesia');
  expect(melanesia).toBeDefined();
  expect(melanesia!.PNG).toEqual(['IDN']);
  for (const id of ['FJI', 'SLB', 'VUT']) expect(melanesia![id]).toEqual([]);

  // landAdjacencyForScope intentionally returns the continent-wide canonical
  // graph. Limit zero-neighbour assertions to each learner scope's target IDs
  // instead of mistaking PNG's truthful cross-continent edge for Micronesia.
  for (const scopeId of ['micronesia', 'polynesia'] as const) {
    const adjacency = landAdjacencyForScope(scopeId);
    const config = getNeighborScopeConfig(scopeId);
    expect(adjacency).toBeDefined();
    expect(config).toBeDefined();
    for (const id of config!.countryIds) expect(adjacency![id]).toEqual([]);
  }
});

test('Pacific canonical multipart outlines remain available to the rendered activity', async ({ page }) => {
  const asset = await loadOutlineAsset('micronesia');
  expect(asset).toBeDefined();
  for (const id of ['KIR', 'MHL', 'FSM', 'PLW']) {
    expect(asset!.geometries[id]?.subpathCount, `${id} keeps canonical multipart geometry`).toBeGreaterThanOrEqual(2);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/outlines/oceania/micronesia');
  await page.getByRole('button', { name: 'Play Micronesia' }).click();
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

test('Oceania Neighbours launches with topology-backed interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/neighbors/oceania/melanesia');
  await page.getByRole('button', { name: 'Play Melanesia' }).click();
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-neighbor-map-host]')).toHaveAttribute('data-target-id', /.+/);
  await expect(page.locator('#neighbor-country-input')).toBeVisible();
});
