import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES, COUNTRY_BY_ID } from '../../src/data/countries.js';
import { LOCATION_WRONG_FEEDBACK_MS } from '../../src/state/locations-round.js';

test.setTimeout(90_000);

function countryId(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openRound(page: Page, activity: 'Learn' | 'Play') {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/africa/west-africa');
  await page.getByRole('button', { name: `${activity} West Africa` }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentTarget(page: Page): Promise<string> {
  return countryId(await page.locator('#map-prompt-heading').innerText());
}

async function wrongChoice(page: Page, target: string): Promise<string> {
  const wrong = await page.locator('.map-country[data-action="map-answer"]').evaluateAll((nodes, targetId) =>
    nodes.find((node) => node.getAttribute('data-id') !== targetId)?.getAttribute('data-id') ?? null,
  target);
  if (!wrong) throw new Error('No wrong country was available');
  return wrong;
}

async function answer(page: Page, id: string) {
  const country = page.locator(`.map-country[data-action="map-answer"][data-id="${id}"]`);
  await expect(country).toBeVisible();
  await country.focus();
  await country.press('Enter');
}

function semanticCountryGeometry(page: Page, id: string) {
  return page.locator(`.map-country[data-id="${id}"] .map-country__shape, .map-country[data-id="${id}"] .map-country__feedback-shape`).first();
}

for (const reducedMotion of [false, true]) {
  test(`Learn wrong feedback settles semantically with ${reducedMotion ? 'reduced' : 'normal'} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
    await openRound(page, 'Learn');
    const target = await currentTarget(page);
    const wrong = await wrongChoice(page, target);
    const wrongCountry = page.locator(`.map-country[data-id="${wrong}"]`);
    const wrongGeometry = semanticCountryGeometry(page, wrong);

    // Install the browser clock only after the round is fully loaded. The
    // production timer created by the answer can then be advanced exactly,
    // without relying on headless-CI wall-clock scheduling.
    await page.clock.install();
    await answer(page, wrong);
    await expect(wrongCountry).toHaveClass(/map-country--wrong-pulse/);
    if (reducedMotion) {
      await expect.poll(
        () => wrongGeometry.evaluate((node) => getComputedStyle(node).animationName),
      ).toBe('none');
    }
    await expect(page.locator('.map-prompt__status')).toContainText(`Not ${COUNTRY_BY_ID.get(wrong)?.name}.`);

    await page.clock.fastForward(LOCATION_WRONG_FEEDBACK_MS);
    await expect(wrongCountry).not.toHaveClass(/map-country--wrong-pulse/);
    await expect(wrongCountry).not.toHaveClass(/map-country--first|map-country--one-miss|map-country--two-miss|map-country--revealed/);
    await expect(page.locator('.map-prompt__status')).toContainText(`Not ${COUNTRY_BY_ID.get(wrong)?.name}.`);
    // A keyboard learner remains focused on the wrong country after the
    // transient pulse clears, so its focus affordance may intentionally change
    // the computed fill. The semantic contract is that no wrong/resolution
    // class remains, not that focused and unfocused countries share a fill.
    await expect.poll(() => page.evaluate((id) => (document.activeElement as HTMLElement | null)?.dataset.id ?? null, wrong)).toBe(wrong);

    await answer(page, target);
    await expect(page.locator('.map-prompt__status--correct')).toHaveText('Correct · after 1 miss');
    await expect(page.locator('.map-country--one-miss')).toHaveCount(1);
  });
}

test('Play unresolved miss stays neutral, retryable and transient', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRound(page, 'Play');
  const target = await currentTarget(page);
  const wrong = await wrongChoice(page, target);

  await page.clock.install();
  await answer(page, wrong);
  const selection = page.locator(`.map-country[data-id="${wrong}"]`);
  await expect(selection).toHaveClass(/map-country--wrong-pulse/);
  await expect(selection).not.toHaveClass(/map-country--current-wrong/);
  await expect(page.locator('.map-country--current-correct')).toHaveCount(0);
  await expect(page.locator('.answer-feedback--neutral')).toBeVisible();
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
  await expect(page.locator('#map-prompt-heading')).toHaveText(COUNTRY_BY_ID.get(target)?.name ?? '');
  await expect(page.locator('.map-country--one-miss, .map-country--two-miss, .map-country--revealed')).toHaveCount(0);

  await page.clock.fastForward(LOCATION_WRONG_FEEDBACK_MS);
  await expect(selection).not.toHaveClass(/map-country--wrong-pulse/);
  await expect(page.locator('.answer-feedback--neutral')).toBeVisible();
  await expect(page.locator(`.map-country[data-action="map-answer"][data-id="${target}"]`)).toHaveCount(1);
});
