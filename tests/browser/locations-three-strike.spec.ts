import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openPlay(page: Page, continent: string, region: string, label: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`/#/locations/${continent}/${region}`);
  await page.getByRole('button', { name: `Play ${label}` }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentTarget(page: Page) {
  const name = await page.locator('#map-prompt-heading').innerText();
  return { id: countryIdForName(name), name };
}

async function selectableIds(page: Page, targetId: string): Promise<string[]> {
  return page.locator('[data-action="map-answer"][tabindex]').evaluateAll((elements, target) => (
    [...new Set(elements.map((element) => element.getAttribute('data-id')).filter((id): id is string => Boolean(id) && id !== target))]
  ), targetId);
}

function answerControl(page: Page, countryId: string) {
  return page.locator(`[data-action="map-answer"][data-id="${countryId}"][tabindex]`).first();
}

async function expectCountryFocus(page: Page, countryId: string) {
  await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.id ?? null)).toBe(countryId);
}

async function answer(page: Page, countryId: string) {
  const control = answerControl(page, countryId);
  await expect(control).toBeVisible();
  await control.focus();
  await control.press('Enter');
}

test('miss, miss, correct resolves orange without answer leakage', async ({ page }) => {
  await openPlay(page, 'north-america', 'caribbean', 'Caribbean', { width: 412, height: 915 });
  const target = await currentTarget(page);
  const wrongIds = await selectableIds(page, target.id);
  expect(wrongIds.length).toBeGreaterThanOrEqual(2);

  await answer(page, wrongIds[0]);
  await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
  await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
  await expect(page.locator('.map-country--revealed')).toHaveCount(0);
  await expect(answerControl(page, target.id)).not.toHaveClass(/map-country--current-correct/);
  await expect(page.locator('.map-country[data-action="map-answer"]')).not.toHaveCount(0);
  await expectCountryFocus(page, wrongIds[0]);

  await answer(page, wrongIds[1]);
  await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
  await expect(page.locator('.answer-feedback--neutral')).toContainText('1 try left');
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
  await expect(page.locator('.map-country--revealed')).toHaveCount(0);
  await expectCountryFocus(page, wrongIds[1]);

  await answer(page, target.id);
  const targetGroup = page.locator('.map-country--two-miss').first();
  await expect(targetGroup).toBeAttached();
  await expect(targetGroup).not.toHaveClass(/map-country--current-correct/);
});

test('three misses reveal only on the third wrong guess and lock resolution', async ({ page }) => {
  await openPlay(page, 'africa', 'west-africa', 'West Africa', { width: 390, height: 844 });
  const target = await currentTarget(page);
  const wrongIds = await selectableIds(page, target.id);
  expect(wrongIds.length).toBeGreaterThanOrEqual(3);

  for (let index = 0; index < 2; index += 1) {
    await answer(page, wrongIds[index]);
    await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
    await expect(page.locator('.answer-feedback--neutral')).toContainText(index === 0 ? '2 tries left' : '1 try left');
    await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
    await expect(page.locator('.map-country--revealed')).toHaveCount(0);
    await expectCountryFocus(page, wrongIds[index]);
  }

  await answer(page, wrongIds[2]);
  await expect(page.locator('.map-country--revealed').first()).toBeAttached();
});

const VIEWPORT_CASES = [
  { viewport: { width: 320, height: 568 }, continent: 'africa', region: 'west-africa', label: 'West Africa' },
  { viewport: { width: 390, height: 844 }, continent: 'asia', region: 'caucasus', label: 'Caucasus' },
  { viewport: { width: 412, height: 915 }, continent: 'oceania', region: 'australia-new-zealand', label: 'Australia & New Zealand' },
  { viewport: { width: 844, height: 390 }, continent: 'asia', region: 'middle-east', label: 'Middle East' },
  { viewport: { width: 1024, height: 768 }, continent: 'africa', region: 'southern-africa', label: 'Southern Africa' },
] as const;

for (const fixture of VIEWPORT_CASES) {
  test(`${fixture.viewport.width}x${fixture.viewport.height} keeps one-miss recovery usable`, async ({ page }) => {
    await openPlay(page, fixture.continent, fixture.region, fixture.label, fixture.viewport);
    const target = await currentTarget(page);
    const [wrongId] = await selectableIds(page, target.id);
    expect(wrongId).toBeTruthy();
    await answer(page, wrongId);
    await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
    await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
    await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
    await expectCountryFocus(page, wrongId);
    await answer(page, target.id);
    await expect(page.locator('.map-country--one-miss').first()).toBeAttached();
  });
}

test('reduced motion and forced colours retain the complete semantic ladder', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await openPlay(page, 'africa', 'west-africa', 'West Africa', { width: 390, height: 844 });
  const target = await currentTarget(page);
  const wrongIds = await selectableIds(page, target.id);
  await answer(page, wrongIds[0]);
  await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
  await expectCountryFocus(page, wrongIds[0]);
  const wrongShape = page.locator('.map-country--wrong-pulse .map-country__shape, .map-country--wrong-pulse .map-country__feedback-shape').first();
  await expect(wrongShape).toBeAttached();
  await expect(wrongShape).toHaveCSS('animation-name', 'none');
  await answer(page, target.id);
  await expect(page.locator('.map-country--one-miss').first()).toBeAttached();
});
