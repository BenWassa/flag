import { expect, test, type Locator, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

type FeedbackCase = Readonly<{
  label: string;
  continent: string;
  region: string;
  scopeLabel: string;
  countryId: string;
  viewport: Readonly<{ width: number; height: number }>;
  requiresFallback?: boolean;
  multipart?: boolean;
  helper?: 'locator' | 'callout';
}>;

const CASES: readonly FeedbackCase[] = [
  { label: 'dense West Africa narrow country', continent: 'africa', region: 'west-africa', scopeLabel: 'West Africa', countryId: 'TGO', viewport: { width: 390, height: 844 }, helper: 'callout' },
  { label: 'West Africa locator-only island', continent: 'africa', region: 'west-africa', scopeLabel: 'West Africa', countryId: 'CPV', viewport: { width: 390, height: 844 }, requiresFallback: true, helper: 'locator' },
  { label: 'Middle East dense borders in short landscape', continent: 'asia', region: 'middle-east', scopeLabel: 'Middle East', countryId: 'LBN', viewport: { width: 844, height: 390 } },
  { label: 'Caucasus dense borders', continent: 'asia', region: 'caucasus', scopeLabel: 'Caucasus', countryId: 'ARM', viewport: { width: 390, height: 844 } },
  { label: 'Caribbean multipart island in short landscape', continent: 'north-america', region: 'caribbean', scopeLabel: 'Caribbean', countryId: 'KNA', viewport: { width: 844, height: 390 }, multipart: true },
  { label: 'Pacific multipart island geography', continent: 'oceania', region: 'micronesia', scopeLabel: 'Micronesia', countryId: 'KIR', viewport: { width: 390, height: 844 }, multipart: true },
  { label: 'ordinary large country', continent: 'oceania', region: 'australia-new-zealand', scopeLabel: 'Australia & New Zealand', countryId: 'AUS', viewport: { width: 844, height: 390 } },
];

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

function expectNoVisibleStroke(stroke: string, label?: string) {
  expect(stroke === '' || stroke === 'none', label).toBe(true);
}

async function openPlay(page: Page, fixture: FeedbackCase) {
  await page.setViewportSize(fixture.viewport);
  await page.goto(`/#/locations/${fixture.continent}/${fixture.region}`);
  await page.getByRole('button', { name: `Play ${fixture.scopeLabel}` }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function freezeFeedbackTimers(page: Page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
}

async function currentTargetId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

async function answerMainMapCountry(page: Page, countryId: string) {
  const group = page.locator(`.map-svg .map-country[data-action="map-answer"][data-id="${countryId}"]`).first();
  await expect(group).toBeVisible();
  await group.evaluate((node) => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  });
}

async function inspectCountryStructure(group: Locator) {
  return group.evaluate((node) => {
    const semantic = [...node.querySelectorAll<SVGElement>('.map-country__shape, .map-country__feedback-shape')].map((element) => {
      const style = getComputedStyle(element);
      return { className: element.getAttribute('class') ?? '', fill: style.fill, stroke: style.stroke };
    });
    const helperMarks = [...node.querySelectorAll<SVGElement>('.map-country__locator, .map-country__marker, .map-country__callout-target')].map((element) => {
      const style = getComputedStyle(element);
      return { className: element.getAttribute('class') ?? '', fill: style.fill, stroke: style.stroke };
    });
    const calloutLine = node.querySelector<SVGElement>('.map-country__callout-line');
    const lineStyle = calloutLine ? getComputedStyle(calloutLine) : null;
    return {
      semantic,
      helperMarks,
      calloutLine: lineStyle ? { stroke: lineStyle.stroke, width: lineStyle.strokeWidth } : null,
    };
  });
}

async function inspectResolvedTarget(page: Page) {
  const group = page.locator('.map-svg .map-country--current-correct').first();
  await expect(group).toBeAttached({ timeout: 2_000 });
  await expect(page.locator('.answer-feedback--correct')).toContainText(/\S/, { timeout: 2_000 });
  return group.evaluate((node) => {
    const semantic = [...node.querySelectorAll<SVGElement>('.map-country__shape, .map-country__feedback-shape')].map((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, stroke: style.stroke, animationName: style.animationName };
    });
    const helperMarks = [...node.querySelectorAll<SVGElement>('.map-country__locator, .map-country__marker, .map-country__callout-target')].map((element) => {
      const style = getComputedStyle(element);
      return { fill: style.fill, stroke: style.stroke };
    });
    const svg = node.closest('.map-svg');
    const countries = svg?.querySelector('.map-active-countries') ?? null;
    const boundaries = svg?.querySelector('.map-boundaries') ?? null;
    const boundary = svg?.querySelector<SVGElement>('.map-coastline, .map-shared-boundary') ?? null;
    return {
      semantic,
      helperMarks,
      mainLayering: Boolean(countries && boundaries && (countries.compareDocumentPosition(boundaries) & Node.DOCUMENT_POSITION_FOLLOWING)),
      boundaryStroke: boundary ? getComputedStyle(boundary).stroke : null,
    };
  });
}

for (const fixture of CASES) {
  test(`${fixture.label}: canonical geometry stays compatible with contained semantic feedback`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openPlay(page, fixture);

    const targetId = await currentTargetId(page);
    const selected = page.locator(`.map-svg .map-country[data-action="map-answer"][data-id="${fixture.countryId}"]`).first();
    await expect(selected).toBeVisible();

    const semanticPath = selected.locator('.map-country__shape, .map-country__feedback-shape').first();
    await expect(semanticPath).toBeAttached();
    if (fixture.requiresFallback) {
      await expect(selected.locator('.map-country__shape')).toHaveCount(0);
      await expect(selected.locator('.map-country__feedback-shape')).toHaveCount(1);
    }
    if (fixture.multipart) {
      const path = await semanticPath.getAttribute('d');
      expect((path?.match(/[Mm]/g) ?? []).length, `${fixture.countryId} retains multipart canonical path data`).toBeGreaterThan(1);
    }

    const structure = await inspectCountryStructure(selected);
    expect(structure.semantic.length).toBeGreaterThan(0);
    for (const mark of structure.semantic) expectNoVisibleStroke(mark.stroke, `${fixture.countryId} ${mark.className} has no semantic exterior stroke`);
    if (fixture.helper === 'locator') expect(structure.helperMarks.some((mark) => mark.className.includes('map-country__locator'))).toBe(true);
    if (fixture.helper === 'callout') {
      expect(structure.helperMarks.some((mark) => mark.className.includes('map-country__callout-target'))).toBe(true);
      expect(structure.calloutLine).not.toBeNull();
    }

    await freezeFeedbackTimers(page);
    await answerMainMapCountry(page, targetId);
    const outcome = await inspectResolvedTarget(page);
    expect(outcome.semantic.length).toBeGreaterThan(0);
    for (const mark of outcome.semantic) expectNoVisibleStroke(mark.stroke, 'resolved semantic fill has no exterior stroke');
    for (const mark of outcome.helperMarks) {
      expect(outcome.semantic.some((semantic) => semantic.fill === mark.fill), 'helper symbology remains neutral instead of copying outcome fill').toBe(false);
    }
    expect(outcome.mainLayering, 'topology-derived boundaries paint after semantic fills').toBe(true);
    expect(outcome.boundaryStroke).not.toBeNull();
    expect(outcome.boundaryStroke).not.toBe('none');
  });
}

test('reduced motion and forced colours keep unresolved feedback contained and explicit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const fixture = CASES[1];
  await openPlay(page, fixture);
  const targetId = await currentTargetId(page);
  const wrongId = await page.locator('.map-svg .map-country[data-action="map-answer"][data-id]').evaluateAll((groups, target) => (
    groups.map((group) => group.getAttribute('data-id')).find((id) => id && id !== target) ?? null
  ), targetId);
  expect(wrongId).toBeTruthy();
  await answerMainMapCountry(page, wrongId!);
  const group = page.locator('.map-svg .map-country--wrong-pulse').first();
  await expect(group).toBeAttached();
  await expect(page.locator('.answer-feedback--neutral')).toContainText('tries left');
  const inspection = await group.evaluate((node) => [...node.querySelectorAll<SVGElement>('.map-country__shape, .map-country__feedback-shape')].map((element) => {
    const style = getComputedStyle(element);
    return { stroke: style.stroke, animationName: style.animationName };
  }));
  expect(inspection.length).toBeGreaterThan(0);
  for (const mark of inspection) {
    expectNoVisibleStroke(mark.stroke);
    expect(mark.animationName).toBe('none');
  }
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
});
