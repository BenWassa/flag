// Issue #227 — standing exact-production guard for the shared Locations
// framing/touch contract. Representative scopes only: regional lanes own their
// own full-scope calibration; this spec stops a future generator or framing
// change silently returning to "fit everything, shrink the useful map".

import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import {
  DISCOVERABLE_PX,
  PRACTICAL_DIAMETER_PX,
  auditFrame,
  openLocationsScope,
  readFitData,
  type FrameAudit,
} from './helpers/locations-audit.js';

test.setTimeout(240_000);

const PHONE_PORTRAIT_SMALL = { width: 320, height: 568 };
const PHONE_PORTRAIT = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const DESKTOP = { width: 1280, height: 800 };
const VIEWPORTS = [PHONE_PORTRAIT_SMALL, PHONE_PORTRAIT, PHONE_LANDSCAPE, DESKTOP] as const;

const SOUTHERN_EUROPE = '/#/locations/europe/southern-europe';
const EUROPE_PROVENANCE = JSON.parse(
  readFileSync(new URL('../../docs/architecture/europe-cartography-provenance.json', import.meta.url), 'utf8'),
) as { initialFit: { excludedComponents: Record<string, { bounds: [number, number, number, number] }> } };

function intersects(box: FrameAudit['viewBox'], [x0, y0, x1, y1]: [number, number, number, number]): boolean {
  return x1 > box.x && x0 < box.x + box.width && y1 > box.y && y0 < box.y + box.height;
}

async function currentTargetId(page: Page): Promise<{ id: string; name: string }> {
  const name = await page.locator('#map-prompt-heading').innerText();
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return { id: country.id, name };
}

async function advanceByKeyboard(page: Page): Promise<void> {
  const { id, name } = await currentTargetId(page);
  const answer = page.locator(`[data-action="map-answer"][data-id="${id}"][tabindex]`).first();
  await answer.focus();
  await answer.press('Enter');
  await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(name);
}

function assertEveryTargetActionable(frame: FrameAudit, label: string): void {
  for (const item of frame.countries) {
    expect(item.actionablePoint, `${label}: ${item.id} owns an actionable point at the opening frame`).not.toBeNull();
  }
}

function assertAssistedTargetsPractical(frame: FrameAudit, label: string, ids: readonly string[]): void {
  for (const id of ids) {
    const item = frame.countries.find((entry) => entry.id === id);
    expect(item, `${label}: ${id} is audited`).toBeTruthy();
    expect(item!.class, `${label}: ${id} needs more than its canonical polygon`).not.toBe('A');
    expect(item!.hitDiametersPx.length, `${label}: ${id} has a practical hit surface`).toBeGreaterThan(0);
    for (const diameter of item!.hitDiametersPx) {
      expect(diameter, `${label}: ${id} keeps the shared ~44px practical target`).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);
    }
  }
}

for (const viewport of VIEWPORTS) {
  test(`Southern Europe opens on its primary geography at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const label = `Southern Europe ${viewport.width}x${viewport.height}`;
    await openLocationsScope(page, SOUTHERN_EUROPE, 'Learn Southern Europe', viewport);
    const fit = await readFitData(page);
    const frame = await auditFrame(page);

    // Remote Spanish and Portuguese islands stay in the country but not in the frame.
    for (const country of ['ESP', 'PRT'] as const) {
      const remote = EUROPE_PROVENANCE.initialFit.excludedComponents[country];
      expect(remote, `${country} has recorded fit-excluded components`).toBeTruthy();
      expect(intersects(frame.viewBox, remote.bounds), `${label}: ${country} remote components begin off-screen`).toBe(false);
    }
    expect(frame.viewBox.width, `${label}: opens materially closer than the fit-everything 632 units`).toBeLessThan(
      viewport.width > viewport.height ? 640 : 480,
    );
    expect(fit.focus, 'the scope ships a generated opening focus').not.toBeNull();
    expect(fit.focus!.width).toBeLessThan(450);
    expect(
      Math.abs(frame.viewBox.width / frame.stage.width / frame.unitsPerCssPx - 1),
      'effective units per CSS px matches the viewBox over the stage',
    ).toBeLessThan(0.01);

    assertEveryTargetActionable(frame, label);
    assertAssistedTargetsPractical(frame, label, ['AND', 'SMR', 'VAT', 'MLT']);
    // Real land paints above assistance (#117), so a 44px disc can be wide yet
    // buried. Andorra's target sits in the Mediterranean precisely so that most
    // of its practical disc stays exposed.
    expect(
      Math.max(...frame.countries.find((entry) => entry.id === 'AND')!.exposedHitFractions),
      `${label}: Andorra's practical target is mostly exposed, not buried under Spain/France`,
    ).toBeGreaterThanOrEqual(0.6);
    for (const large of ['ESP', 'PRT', 'ITA', 'GRC']) {
      const item = frame.countries.find((entry) => entry.id === large)!;
      expect(item.class, `${label}: ${large} stays an ordinary canonical polygon`).toBe('A');
      expect(item.polygonExtentPx, `${label}: ${large} is large enough to select without rescue zooming`).toBeGreaterThan(40);
    }
  });
}

test('the opening frame is deterministic and independent of the question, mode and advance', async ({ page }) => {
  await openLocationsScope(page, SOUTHERN_EUROPE, 'Learn Southern Europe', PHONE_PORTRAIT);
  const first = await auditFrame(page);
  const firstFit = await readFitData(page);

  await advanceByKeyboard(page);
  const advanced = await auditFrame(page);
  expect(advanced.viewBox, 'a question advance never moves the frame').toEqual(first.viewBox);
  const assisted = ['AND', 'SMR', 'VAT', 'MLT'];
  assertAssistedTargetsPractical(advanced, 'after question advance', assisted);
  for (const id of assisted) {
    expect(advanced.countries.find((item) => item.id === id)!.class).toBe(first.countries.find((item) => item.id === id)!.class);
  }

  await page.reload();
  await page.getByRole('button', { name: 'Play Southern Europe' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
  const play = await auditFrame(page);
  expect(await readFitData(page), 'Play ships the same generated frame as Learn').toEqual(firstFit);
  expect(play.viewBox, 'Learn and Play open on the same geography').toEqual(first.viewBox);
  expect(play.countries.map((item) => `${item.id}:${item.class}`)).toEqual(first.countries.map((item) => `${item.id}:${item.class}`));
});

test('assisted targets keep their practical size after a supported zoom', async ({ page }) => {
  test.skip(test.info().project.name.includes('mobile'), 'Desktop wheel path owns deterministic zoom acceptance; mobile covers real taps.');
  await openLocationsScope(page, SOUTHERN_EUROPE, 'Learn Southern Europe', PHONE_PORTRAIT);
  const before = await auditFrame(page);
  const stage = await page.locator('[data-map-viewport]').boundingBox();
  await page.mouse.move(stage!.x + stage!.width / 2, stage!.y + stage!.height / 2);
  for (let index = 0; index < 4; index += 1) await page.mouse.wheel(0, -600);
  await expect.poll(async () => (await auditFrame(page)).viewBox.width).toBeLessThan(before.viewBox.width);
  const after = await auditFrame(page);
  for (const id of ['AND', 'SMR', 'VAT', 'MLT']) {
    for (const diameter of after.countries.find((item) => item.id === id)!.hitDiametersPx) {
      expect(diameter, `${id} stays ~44px after zoom`).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);
    }
  }
});

test('a pan across Southern Europe never submits an answer', async ({ page }) => {
  test.skip(test.info().project.name.includes('mobile'), 'Pointer-drag acceptance is owned by the desktop mouse path.');
  await openLocationsScope(page, SOUTHERN_EUROPE, 'Play Southern Europe', PHONE_PORTRAIT);
  const viewport = page.locator('[data-map-viewport]');
  const box = (await viewport.boundingBox())!;
  const beforeName = await page.locator('#map-prompt-heading').innerText();
  const beforeViewBox = await page.locator('.map-svg').getAttribute('viewBox');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5 + 40, box.y + box.height * 0.5 + 10, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => page.locator('.map-svg').getAttribute('viewBox'), { timeout: 15_000 }).not.toBe(beforeViewBox);
  await expect(page.locator('#map-prompt-heading'), 'a drag across the map submits no answer').toHaveText(beforeName);
});

// An inset panel is only mounted while the current question is one of its
// members, so membership cannot be read from the DOM without letting the
// question decide the classification. The representative case names it.
const CARIBBEAN_INSET_IDS = ['KNA', 'ATG', 'DMA', 'LCA', 'VCT', 'GRD', 'BRB'] as const;

const REPRESENTATIVE_CLASSES: readonly {
  name: string; route: string; label: string; assisted: readonly string[]; insets?: readonly string[];
}[] = [
  { name: 'dense small countries (Middle East)', route: '/#/locations/asia/middle-east', label: 'Learn Middle East', assisted: ['BHR', 'KWT', 'QAT', 'LBN', 'ISR'] },
  { name: 'tiny islands (Micronesia)', route: '/#/locations/oceania/micronesia', label: 'Learn Micronesia', assisted: ['NRU', 'PLW', 'MHL', 'FSM', 'KIR'] },
  { name: 'true-scale insets (Caribbean)', route: '/#/locations/north-america/caribbean', label: 'Learn Caribbean', assisted: [], insets: CARIBBEAN_INSET_IDS },
  { name: 'contiguous mainland (Southern Africa)', route: '/#/locations/africa/southern-africa', label: 'Learn Southern Africa', assisted: [] },
  { name: 'contiguous mainland (Andean)', route: '/#/locations/south-america/andean', label: 'Learn Andean', assisted: [] },
];

for (const representative of REPRESENTATIVE_CLASSES) {
  for (const viewport of [PHONE_PORTRAIT_SMALL, PHONE_PORTRAIT, PHONE_LANDSCAPE]) {
    test(`${representative.name} stays selectable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const label = `${representative.name} ${viewport.width}x${viewport.height}`;
      await openLocationsScope(page, representative.route, representative.label, viewport);
      const frame = await auditFrame(page, { insetIds: representative.insets });
      expect(frame.countries.length).toBeGreaterThan(0);
      for (const id of representative.insets ?? []) {
        const item = frame.countries.find((entry) => entry.id === id)!;
        expect(item.class, `${label}: ${id} is a true-scale inset member`).toBe('D');
        expect(item.polygonExtentPx, `${label}: ${id}'s polygon is too small to select unaided`).toBeLessThan(DISCOVERABLE_PX);
      }
      assertEveryTargetActionable(frame, label);
      assertAssistedTargetsPractical(frame, label, representative.assisted);
      for (const item of frame.countries) {
        if (item.class === 'A') {
          expect(item.polygonExtentPx, `${label}: ${item.id} is visible without assistance`).toBeGreaterThanOrEqual(3);
        }
      }
    });
  }
}

test('contiguous scopes are not given assistance they do not need', async ({ page }) => {
  await openLocationsScope(page, '/#/locations/africa/southern-africa', 'Learn Southern Africa', PHONE_PORTRAIT);
  const frame = await auditFrame(page);
  expect(frame.countries.map((item) => item.class).every((cls) => cls === 'A')).toBe(true);
});
