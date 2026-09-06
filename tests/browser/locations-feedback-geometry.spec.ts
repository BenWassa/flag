import { expect, test, type Page } from '@playwright/test';
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

type OutcomeState = 'map-country--current-correct' | 'map-country--wrong-pulse';

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
  await page.evaluate(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if ((timeout ?? 0) >= 500) return 2_147_000_000;
      return nativeSetTimeout(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  });
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

async function inspectOutcomeGeometry(page: Page, stateClass: OutcomeState) {
  const group = page.locator(`.map-svg .${stateClass}`).first();
  await expect(group).toBeAttached({ timeout: 2_000 });
  await expect(page.locator('.answer-feedback')).toContainText(/\S/, { timeout: 2_000 });
  return group.evaluate((node) => {
    const semantic = [...node.querySelectorAll<SVGElement>('.map-country__shape, .map-country__feedback-shape')].map((element) => {
      const style = getComputedStyle(element);
      return { className: element.getAttribute('class') ?? '', fill: style.fill, stroke: style.stroke, animationName: style.animationName };
    });
    const helperMarks = [...node.querySelectorAll<SVGElement>('.map-country__locator, .map-country__marker, .map-country__callout-target')].map((element) => {
      const style = getComputedStyle(element);
      return { className: element.getAttribute('class') ?? '', fill: style.fill, stroke: style.stroke };
    });
    const calloutLine = node.querySelector<SVGElement>('.map-country__callout-line');
    const lineStyle = calloutLine ? getComputedStyle(calloutLine) : null;
    const svg = node.closest('.map-svg');
    const countries = svg?.querySelector('.map-active-countries') ?? null;
    const boundaries = svg?.querySelector('.map-boundaries') ?? null;
    const boundary = svg?.querySelector<SVGElement>('.map-coastline, .map-shared-boundary') ?? null;
    const feedback = document.querySelector<HTMLElement>('.answer-feedback');
    return {
      semantic,
      helperMarks,
      calloutLine: lineStyle ? { stroke: lineStyle.stroke, width: lineStyle.strokeWidth } : null,
      mainLayering: Boolean(countries && boundaries && (countries.compareDocumentPosition(boundaries) & Node.DOCUMENT_POSITION_FOLLOWING)),
      boundaryStroke: boundary ? getComputedStyle(boundary).stroke : null,
      feedbackClass: feedback?.className ?? '',
      feedbackText: feedback?.textContent ?? '',
    };
  });
}

for (const fixture of CASES) {
  test(`${fixture.label}: semantic colour stays inside canonical geometry`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openPlay(page, fixture);
    await freezeFeedbackTimers(page);

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

    await answerMainMapCountry(page, fixture.countryId);
    const stateClass: OutcomeState = targetId === fixture.countryId ? 'map-country--current-correct' : 'map-country--wrong-pulse';
    const inspection = await inspectOutcomeGeometry(page, stateClass);

    expect(inspection.semantic.length).toBeGreaterThan(0);
    for (const mark of inspection.semantic) expectNoVisibleStroke(mark.stroke, `${fixture.countryId} ${mark.className} has no semantic exterior stroke`);
    for (const mark of inspection.helperMarks) {
      expect(inspection.semantic.some((semantic) => semantic.fill === mark.fill), `${fixture.countryId} ${mark.className} remains neutral instead of copying outcome fill`).toBe(false);
    }

    if (fixture.helper === 'locator') expect(inspection.helperMarks.some((mark) => mark.className.includes('map-country__locator'))).toBe(true);
    if (fixture.helper === 'callout') {
      expect(inspection.helperMarks.some((mark) => mark.className.includes('map-country__callout-target'))).toBe(true);
      expect(inspection.calloutLine).not.toBeNull();
    }

    expect(inspection.mainLayering, 'topology-derived boundaries paint after semantic fills').toBe(true);
    expect(inspection.boundaryStroke).not.toBeNull();
    expect(inspection.boundaryStroke).not.toBe('none');
    expect(inspection.feedbackText.trim().length).toBeGreaterThan(0);
    if (stateClass === 'map-country--current-correct') {
      expect(inspection.feedbackClass).toContain('answer-feedback--correct');
    } else {
      expect(inspection.feedbackClass).toContain('answer-feedback--neutral');
      expect(inspection.feedbackClass).not.toContain('answer-feedback--wrong');
      expect(inspection.feedbackText).toContain('tries left');
    }
  });
}

test('reduced motion and forced colours keep unresolved feedback contained and explicit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const fixture = CASES[1];
  await openPlay(page, fixture);
  await freezeFeedbackTimers(page);
  const targetId = await currentTargetId(page);
  const wrongId = await page.locator('.map-svg .map-country[data-action="map-answer"][data-id]').evaluateAll((groups, target) => (
    groups.map((group) => group.getAttribute('data-id')).find((id) => id && id !== target) ?? null
  ), targetId);
  expect(wrongId).toBeTruthy();
  await answerMainMapCountry(page, wrongId!);
  const inspection = await inspectOutcomeGeometry(page, 'map-country--wrong-pulse');

  expect(inspection.semantic.length).toBeGreaterThan(0);
  for (const mark of inspection.semantic) {
    expectNoVisibleStroke(mark.stroke);
    expect(mark.animationName).toBe('none');
  }
  expect(inspection.feedbackClass).toContain('answer-feedback--neutral');
  expect(inspection.feedbackClass).not.toContain('answer-feedback--wrong');
  expect(inspection.feedbackText).toContain('tries left');
});
