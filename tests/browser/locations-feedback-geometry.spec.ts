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

type OutcomeStateClass = 'map-country--current-correct' | 'map-country--current-wrong';

const CASES: readonly FeedbackCase[] = [
  {
    label: 'dense West Africa narrow country',
    continent: 'africa',
    region: 'west-africa',
    scopeLabel: 'West Africa',
    countryId: 'TGO',
    viewport: { width: 390, height: 844 },
    helper: 'callout',
  },
  {
    label: 'West Africa locator-only island',
    continent: 'africa',
    region: 'west-africa',
    scopeLabel: 'West Africa',
    countryId: 'CPV',
    viewport: { width: 390, height: 844 },
    requiresFallback: true,
    helper: 'locator',
  },
  {
    label: 'Middle East dense borders in short landscape',
    continent: 'asia',
    region: 'middle-east',
    scopeLabel: 'Middle East',
    countryId: 'LBN',
    viewport: { width: 844, height: 390 },
  },
  {
    label: 'Caucasus dense borders',
    continent: 'asia',
    region: 'caucasus',
    scopeLabel: 'Caucasus',
    countryId: 'ARM',
    viewport: { width: 390, height: 844 },
  },
  {
    label: 'Caribbean multipart island in short landscape',
    continent: 'north-america',
    region: 'caribbean',
    scopeLabel: 'Caribbean',
    countryId: 'KNA',
    viewport: { width: 844, height: 390 },
    multipart: true,
  },
  {
    label: 'Pacific multipart island geography',
    continent: 'oceania',
    region: 'micronesia',
    scopeLabel: 'Micronesia',
    countryId: 'KIR',
    viewport: { width: 390, height: 844 },
    multipart: true,
  },
  {
    label: 'ordinary large country',
    continent: 'oceania',
    region: 'australia-new-zealand',
    scopeLabel: 'Australia & New Zealand',
    countryId: 'AUS',
    viewport: { width: 844, height: 390 },
  },
];

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

function expectNoVisibleStroke(stroke: string, label?: string) {
  // Chromium may expose SVG's initial `stroke: none` as either the literal
  // `none` or an empty computed value depending on how the property is supplied.
  // Both mean that no exterior stroke is painted; any actual stroke colour still
  // fails this contract.
  expect(stroke === '' || stroke === 'none', label).toBe(true);
}

async function openPlay(page: Page, fixture: FeedbackCase) {
  await page.setViewportSize(fixture.viewport);
  await page.goto(`/#/locations/${fixture.continent}/${fixture.region}`);
  await page.getByRole('button', { name: `Play ${fixture.scopeLabel}` }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentTargetId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

async function answerAndInspectOutcomeGeometry(page: Page, countryId: string, stateClass: OutcomeStateClass) {
  const answer = page.locator(`.map-svg .map-country[data-action="map-answer"][data-id="${countryId}"]`).first();
  await expect(answer).toBeVisible();

  // Correct Play feedback intentionally lasts only 620 ms. Install the observer
  // before dispatching the real click so the exact production state is sampled
  // in the DOM mutation that creates it, rather than racing its later advance
  // timer under CI load.
  return answer.evaluate((answerNode, expectedStateClass) => new Promise<{
    semantic: Array<{ className: string; fill: string; stroke: string; animationName: string }>;
    helperMarks: Array<{ className: string; fill: string; stroke: string }>;
    calloutLine: { stroke: string; width: string } | null;
    mainLayering: boolean;
    boundaryStroke: string | null;
    feedbackClass: string;
    feedbackText: string;
  }>((resolve, reject) => {
    let settled = false;
    let observer: MutationObserver;

    const inspect = () => {
      if (settled) return;
      const node = document.querySelector<SVGGElement>(`.map-svg .${expectedStateClass}`);
      const feedback = document.querySelector<HTMLElement>('.answer-feedback');
      if (!node || !feedback?.textContent?.trim()) return;

      const semantic = [...node.querySelectorAll<SVGElement>('.map-country__shape, .map-country__feedback-shape')]
        .map((element) => {
          const style = getComputedStyle(element);
          return {
            className: element.getAttribute('class') ?? '',
            fill: style.fill,
            stroke: style.stroke,
            animationName: style.animationName,
          };
        });
      const helperMarks = [...node.querySelectorAll<SVGElement>('.map-country__locator, .map-country__marker, .map-country__callout-target')]
        .map((element) => {
          const style = getComputedStyle(element);
          return { className: element.getAttribute('class') ?? '', fill: style.fill, stroke: style.stroke };
        });
      const calloutLine = node.querySelector<SVGElement>('.map-country__callout-line');
      const lineStyle = calloutLine ? getComputedStyle(calloutLine) : null;
      const svg = node.closest('.map-svg');
      const countries = svg?.querySelector('.map-active-countries') ?? null;
      const boundaries = svg?.querySelector('.map-boundaries') ?? null;
      const boundary = svg?.querySelector<SVGElement>('.map-coastline, .map-shared-boundary') ?? null;

      settled = true;
      observer.disconnect();
      window.clearTimeout(timeoutId);
      resolve({
        semantic,
        helperMarks,
        calloutLine: lineStyle ? { stroke: lineStyle.stroke, width: lineStyle.strokeWidth } : null,
        mainLayering: Boolean(
          countries
          && boundaries
          && (countries.compareDocumentPosition(boundaries) & Node.DOCUMENT_POSITION_FOLLOWING),
        ),
        boundaryStroke: boundary ? getComputedStyle(boundary).stroke : null,
        feedbackClass: feedback.className,
        feedbackText: feedback.textContent ?? '',
      });
    };

    observer = new MutationObserver(inspect);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      reject(new Error(`Timed out observing ${expectedStateClass} after answering ${countryId}.`));
    }, 2_500);

    answerNode.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    inspect();
  }), stateClass);
}

for (const fixture of CASES) {
  test(`${fixture.label}: semantic colour stays inside canonical geometry`, async ({ page }) => {
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

    const stateClass: OutcomeStateClass = targetId === fixture.countryId
      ? 'map-country--current-correct'
      : 'map-country--current-wrong';
    const inspection = await answerAndInspectOutcomeGeometry(page, fixture.countryId, stateClass);

    expect(inspection.semantic.length).toBeGreaterThan(0);
    for (const mark of inspection.semantic) {
      expectNoVisibleStroke(mark.stroke, `${fixture.countryId} ${mark.className} has no semantic exterior stroke`);
    }
    for (const mark of inspection.helperMarks) {
      expect(
        inspection.semantic.some((semantic) => semantic.fill === mark.fill),
        `${fixture.countryId} ${mark.className} remains neutral instead of copying outcome fill`,
      ).toBe(false);
    }

    if (fixture.helper === 'locator') {
      expect(inspection.helperMarks.some((mark) => mark.className.includes('map-country__locator'))).toBe(true);
    }
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
      expect(inspection.feedbackClass).toContain('answer-feedback--wrong');
    }
  });
}

test('reduced motion and forced colours keep feedback contained and explicit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const fixture = CASES[1];
  await openPlay(page, fixture);
  const targetId = await currentTargetId(page);
  const stateClass: OutcomeStateClass = targetId === fixture.countryId
    ? 'map-country--current-correct'
    : 'map-country--current-wrong';
  const inspection = await answerAndInspectOutcomeGeometry(page, fixture.countryId, stateClass);

  expect(inspection.semantic.length).toBeGreaterThan(0);
  for (const mark of inspection.semantic) {
    expectNoVisibleStroke(mark.stroke);
    expect(mark.animationName).toBe('none');
  }
  expect(inspection.feedbackText.trim().length).toBeGreaterThan(0);
});
