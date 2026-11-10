// #235: Exact-production mobile touchscreen acceptance. The learner uses real
// Playwright touch input rather than focusing SVG elements or dispatching clicks.
import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { auditFrame, openLocationsScope } from './helpers/locations-audit.js';

test.setTimeout(90_000);

const CASES = [
  { activity: 'Learn', route: '/#/locations/africa/west-africa', label: 'Learn West Africa', viewport: { width: 390, height: 844 } },
  { activity: 'Play', route: '/#/locations/north-america/caribbean', label: 'Play Caribbean', viewport: { width: 844, height: 390 } },
] as const;

async function currentTarget(page: Page) {
  const name = await page.locator('#map-prompt-heading').innerText();
  const country = COUNTRIES.find((item) => item.name === name);
  expect(country, `known country target: ${name}`).toBeTruthy();
  return country!;
}

async function fingerPoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  // The true-scale Caribbean panel owns touch input while it is visible.
  const insetHit = page.locator(`.map-inset__hit[data-action="map-answer"][data-id="${id}"]`).first();
  if (await insetHit.count()) {
    const box = await insetHit.boundingBox();
    expect(box, `${id} inset is visible at phone size`).not.toBeNull();
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  }

  const frame = await auditFrame(page);
  const point = frame.countries.find((entry) => entry.id === id)?.actionablePoint;
  expect(point, `${id} has a real tappable pixel on the phone viewport`).toBeTruthy();
  return point!;
}

for (const fixture of CASES) {
  test(`${fixture.activity} accepts a finger tap and advances exactly once on a phone`, async ({ page }) => {
    test.skip(!test.info().project.name.includes('mobile'), 'A mobile touchscreen is the product acceptance surface.');

    await openLocationsScope(page, fixture.route, fixture.label, fixture.viewport);
    const target = await currentTarget(page);
    const point = await fingerPoint(page, target.id);
    const owner = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)
      ?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null, point);
    expect(owner, `${target.id} owns the finger's touch-down pixel`).toBe(target.id);

    const counter = page.locator('.map-round-count');
    const firstCount = await counter.innerText();
    await page.touchscreen.tap(point.x, point.y);

    // The accepted-answer feedback precedes the 620ms question transition.
    await expect(page.locator('.map-prompt__status--correct, .answer-feedback--correct').first(),
      'finger tap is accepted by the normal scoring path').toBeVisible({ timeout: 2_000 });
    await expect(counter, 'the accepted touch advances the round').not.toHaveText(firstCount, { timeout: 10_000 });

    const secondCount = await counter.innerText();
    const secondTarget = await currentTarget(page);
    expect(secondTarget.id).not.toBe(target.id);
    await page.waitForTimeout(1_800);
    await expect(counter, 'one tap must not advance a second time').toHaveText(secondCount);
    await expect(page.locator('#map-prompt-heading')).toHaveText(secondTarget.name);
  });
}
