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

function visualCountryMark(page: Page, id: string) {
  return page.locator(`.map-country[data-id="${id}"] .map-country__shape, .map-country[data-id="${id}"] .map-country__locator, .map-country[data-id="${id}"] .map-country__marker, .map-country[data-id="${id}"] .map-country__callout-target`).first();
}

function feedbackCountryGeometry(page: Page, id: string) {
  return page.locator(`.map-country[data-id="${id}"] .map-country__shape, .map-country[data-id="${id}"] .map-country__feedback-shape`).first();
}

for (const reducedMotion of [false, true]) {
  test(`Learn wrong feedback settles semantically with ${reducedMotion ? 'reduced' : 'normal'} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
    await openRound(page, 'Learn');
    const target = await currentTarget(page);
    const wrong = await wrongChoice(page, target);
    const wrongCountry = page.locator(`.map-country[data-id="${wrong}"]`);
    const wrongFeedbackGeometry = feedbackCountryGeometry(page, wrong);

    await answer(page, wrong);
    await expect(wrongCountry).toHaveClass(/map-country--wrong-pulse/);
    // Observe motion while the transient semantic state is still active. The
    // application clears that state after exactly LOCATION_WRONG_FEEDBACK_MS,
    // so waiting on unrelated text before sampling animation creates a race at
    // the same boundary the test is intended to verify. Issue #201 moves the
    // animation to the canonical polygon rather than locator/callout symbology.
    await expect.poll(
      () => wrongFeedbackGeometry.evaluate((node) => getComputedStyle(node).animationName),
      { timeout: Math.max(250, LOCATION_WRONG_FEEDBACK_MS - 40) },
    ).toBe(reducedMotion ? 'none' : 'map-wrong');
    await expect(page.locator('.map-prompt__status')).toContainText(`Not ${COUNTRY_BY_ID.get(wrong)?.name}.`);

    await page.waitForTimeout(LOCATION_WRONG_FEEDBACK_MS + 180);
    await expect(wrongCountry).not.toHaveClass(/map-country--wrong-pulse/);
    await expect(page.locator('.map-prompt__status')).toContainText(`Not ${COUNTRY_BY_ID.get(wrong)?.name}.`);
    const settled = await visualCountryMark(page, wrong).evaluate((node) => {
      const style = getComputedStyle(node);
      return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
    });
    const neutral = await page.locator(`.map-country[data-action="map-answer"]:not([data-id="${wrong}"]):not([data-id="${target}"]) .map-country__shape, .map-country[data-action="map-answer"]:not([data-id="${wrong}"]):not([data-id="${target}"]) .map-country__locator, .map-country[data-action="map-answer"]:not([data-id="${wrong}"]):not([data-id="${target}"]) .map-country__marker, .map-country[data-action="map-answer"]:not([data-id="${wrong}"]):not([data-id="${target}"]) .map-country__callout-target`).first().evaluate((node) => {
      const style = getComputedStyle(node);
      return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
    });
    expect(settled).toEqual(neutral);

    await answer(page, target);
    // Resolved map countries intentionally stop being answer controls and shed
    // data-action/data-id. Assert the durable resolution class rather than an
    // obsolete answer-control locator, and sample the transient status before
    // the existing Learn advance dwell expires.
    await expect(page.locator('.map-prompt__status--correct')).toHaveText('Correct · after 1 miss', { timeout: 500 });
    await expect(page.locator('.map-country--one-miss')).toHaveCount(1);
  });
}

test('Play current-wrong remains distinct from transient Learn feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRound(page, 'Play');
  const target = await currentTarget(page);
  const wrong = await wrongChoice(page, target);

  await answer(page, wrong);
  // Play resolves in one answer, so the selected country is no longer an answer
  // control. Its semantic feedback classes remain on the rendered geography.
  const selection = page.locator('.map-country--current-wrong');
  await expect(selection).toHaveCount(1);
  await expect(selection).toHaveClass(/map-country--wrong-pulse/);
  await expect(page.locator('.map-country--current-correct')).toHaveCount(1);
  await expect(page.locator('.answer-feedback--wrong')).toBeVisible();
  await expect(page.locator('.map-country--one-miss, .map-country--two-miss, .map-country--revealed')).toHaveCount(0);

  await page.waitForTimeout(LOCATION_WRONG_FEEDBACK_MS + 180);
  await expect(selection).toHaveCount(1);
  await expect(selection).toHaveClass(/map-country--wrong-pulse/);
  await expect(page.locator('.answer-feedback--wrong')).toBeVisible();
});
