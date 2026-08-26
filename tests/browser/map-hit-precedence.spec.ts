import { expect, test, type Page } from '@playwright/test';

// Issue #117. Every assisted mark grows to a 44 CSS px touch surface, which is
// far larger than the mark itself — across Europe and Asia only the Maldives
// locator has clean clearance. While those discs painted inside their own
// country group, a disc could cover a co-active neighbour's real polygon and
// win the tap, with the winner decided by array order in map-scopes.
//
// The measured worst case: in a Western Europe round, a tap on eastern Germany
// within 22 CSS px of Liechtenstein's callout answered Liechtenstein.

async function openWesternEuropeRound(page: Page) {
  await page.goto('/#/locations/europe');
  await page.getByRole('button', { name: 'Play Western Europe' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40000 });
  await page.waitForFunction(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    return viewport?.dataset.mapPositioned === 'true';
  });
}

// Walks the points a disc covers and reports, for each one that lies inside the
// named country's real polygon, which country the browser would actually answer.
async function answersOverPolygon(page: Page, discCountryId: string, polygonCountryId: string) {
  return page.evaluate(([discId, polyId]) => {
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    const disc = document.querySelector<SVGCircleElement>(
      `[data-action="map-answer"][data-id="${discId}"] circle[data-map-hit], [data-id="${discId}"] .map-country__callout-hit, [data-id="${discId}"] .map-country__locator-hit`,
    );
    const polygon = document.querySelector<SVGPathElement>(`[data-id="${polyId}"] .map-country__shape`);
    if (!svg || !disc || !polygon) return { error: `missing ${!disc ? discId + ' disc' : polyId + ' polygon'}` };

    const cx = disc.cx.baseVal.value;
    const cy = disc.cy.baseVal.value;
    const r = disc.r.baseVal.value;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { error: 'no screen CTM' };

    const sampled: string[] = [];
    let inside = 0;
    for (let ring = 1; ring <= 6; ring += 1) {
      for (let step = 0; step < 24; step += 1) {
        const angle = (step / 24) * Math.PI * 2;
        const x = cx + Math.cos(angle) * (r * ring) / 6;
        const y = cy + Math.sin(angle) * (r * ring) / 6;
        const point = new DOMPoint(x, y);
        if (!polygon.isPointInFill(point)) continue;
        inside += 1;
        const screen = point.matrixTransform(matrix);
        const hit = document.elementFromPoint(screen.x, screen.y);
        const owner = hit?.closest('[data-action="map-answer"]');
        sampled.push(owner?.getAttribute('data-id') ?? 'none');
      }
    }
    return { inside, answers: [...new Set(sampled)] };
  }, [discCountryId, polygonCountryId] as const);
}

test("a tap on Germany's polygon answers Germany, not Liechtenstein's disc", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWesternEuropeRound(page);

  const result = await answersOverPolygon(page, 'LIE', 'DEU');
  expect(result.error).toBeUndefined();
  // The disc has to genuinely overlap Germany, or the test proves nothing.
  expect(result.inside ?? 0).toBeGreaterThan(0);
  expect(result.answers).toEqual(['DEU']);
});

test("a tap on France's polygon answers France, not Luxembourg's disc", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWesternEuropeRound(page);

  const result = await answersOverPolygon(page, 'LUX', 'FRA');
  expect(result.error).toBeUndefined();
  expect(result.inside ?? 0).toBeGreaterThan(0);
  expect(result.answers).toEqual(['FRA']);
});

test('assisted marks keep their 44 CSS px surface where nothing else claims it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWesternEuropeRound(page);

  const smallest = await page.evaluate(() => {
    const discs = [...document.querySelectorAll<SVGCircleElement>('.map-assist-hits [data-map-hit]')];
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    if (!svg || !viewport || !discs.length) return null;
    const unitsPerCssPx = svg.viewBox.baseVal.width / viewport.clientWidth;
    return Math.min(...discs.map((disc) => (disc.r.baseVal.value / unitsPerCssPx) * 2));
  });

  expect(smallest).not.toBeNull();
  expect(smallest as number).toBeGreaterThanOrEqual(43.5);
});
