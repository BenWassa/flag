import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES, COUNTRY_BY_ID } from '../../src/data/countries.js';
import { loadOutlineAsset } from '../../src/data/outlines.js';
import { landAdjacencyForScope } from '../../src/data/neighbors/index.js';
import { createInitialProgress } from '../../src/domain/progress.js';
import { buildOutlineQuiz } from '../../src/domain/outline.js';
import { NO_LAND_NEIGHBORS_LABEL } from '../../src/domain/neighbor-game.js';
import { ACHIEVEMENT_STORAGE_KEY } from '../../src/infrastructure/achievement-storage.js';
import type { Question, StudyScope } from '../../src/domain/models.js';

const VIEWPORTS = [
  { label: 'narrow phone portrait', width: 320, height: 568 },
  { label: 'modern phone portrait', width: 390, height: 844 },
  { label: 'tablet portrait', width: 768, height: 1024 },
  { label: 'short landscape', width: 844, height: 390 },
  { label: 'desktop', width: 1280, height: 800 },
] as const;

const LOCATION_SCOPES = [
  { id: 'north-america', label: 'North America', action: 'Learn North America', count: 23 },
  { id: 'northern-america', label: 'Northern America', action: 'Play Northern America', count: 2 },
  { id: 'central-america', label: 'Central America', action: 'Play Central America', count: 8 },
  { id: 'caribbean', label: 'Caribbean', action: 'Play Caribbean', count: 13 },
] as const;

const HIT_ASSIST_IDS = new Set(['BHS', 'BLZ', 'DOM', 'HTI', 'JAM', 'SLV', 'TTO']);
const CARIBBEAN_INSETS: Readonly<Record<string, { id: string; label: string; members: readonly string[] }>> = {
  KNA: { id: 'northern-lesser-antilles', label: 'Northern Lesser Antilles', members: ['KNA', 'ATG'] },
  ATG: { id: 'northern-lesser-antilles', label: 'Northern Lesser Antilles', members: ['KNA', 'ATG'] },
  DMA: { id: 'windward-islands-north', label: 'Windward Islands', members: ['DMA', 'LCA'] },
  LCA: { id: 'windward-islands-north', label: 'Windward Islands', members: ['DMA', 'LCA'] },
  VCT: { id: 'windward-islands-south', label: 'Southern Windward Islands', members: ['VCT', 'GRD', 'BRB'] },
  GRD: { id: 'windward-islands-south', label: 'Southern Windward Islands', members: ['VCT', 'GRD', 'BRB'] },
  BRB: { id: 'windward-islands-south', label: 'Southern Windward Islands', members: ['VCT', 'GRD', 'BRB'] },
};
const MULTIPART_OUTLINE_IDS = new Set(['BHS', 'ATG', 'KNA', 'VCT', 'TTO']);
const ZERO_NEIGHBOR_IDS = new Set(['ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'GRD', 'JAM', 'KNA', 'LCA', 'VCT', 'TTO']);

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

function countryName(id: string): string {
  return COUNTRY_BY_ID.get(id)?.name ?? id;
}

async function fixSessionId(page: Page, sessionId: string) {
  await page.addInitScript(({ id }) => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: () => id,
    });
  }, { id: sessionId });
}

async function waitForMap(page: Page) {
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  await page.waitForFunction(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    return Boolean(viewport && svg && svg.getAttribute('viewBox') !== viewport.dataset.mapViewbox);
  });
}

/**
 * Issue #166: a scope is focused by its own route, and Play/Learn then act on
 * that scope. Selecting an area no longer starts a round, so the two steps are
 * separate here as well.
 */
async function openLocationScope(page: Page, scopeId: string, action: string) {
  const path = scopeId === 'north-america' ? '/#/locations/north-america' : `/#/locations/north-america/${scopeId}`;
  await page.goto(path);
  const start = page.getByRole('button', { name: action });
  await expect(start).toBeVisible();
  await start.click();
  await waitForMap(page);
}

async function currentLocationId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

async function clickCircleCentre(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} has a rendered box`).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

async function answerCurrentLocationCorrectly(page: Page, targetId: string) {
  const inset = page.locator(`.map-inset__hit[data-id="${targetId}"]`);
  if (await inset.count()) {
    await clickCircleCentre(page, `.map-inset__hit[data-id="${targetId}"]`);
    return;
  }
  const assist = page.locator(`.map-current-target-hit[data-id="${targetId}"]`);
  if (await assist.count()) {
    await clickCircleCentre(page, `.map-current-target-hit[data-id="${targetId}"]`);
    return;
  }
  const group = page.locator(`.map-country[data-action="map-answer"][data-id="${targetId}"]`);
  await expect(group).toBeVisible();
  await group.focus();
  await group.press('Enter');
}

async function assertInset(page: Page, targetId: string) {
  const expected = CARIBBEAN_INSETS[targetId];
  if (!expected) {
    await expect(page.locator('[data-map-inset]')).toHaveCount(0);
    return;
  }
  const panel = page.locator(`[data-map-inset="${expected.id}"]`);
  await expect(panel).toBeVisible();
  const measurements = await panel.evaluate((element) => {
    const panelRect = element.getBoundingClientRect();
    const stageRect = document.querySelector('.map-stage')!.getBoundingClientRect();
    const hits = [...element.querySelectorAll<SVGCircleElement>('.map-inset__hit')].map((hit) => {
      const rect = hit.getBoundingClientRect();
      return {
        id: hit.getAttribute('data-id'),
        label: hit.getAttribute('aria-label'),
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    });
    return {
      insideStage: panelRect.left >= stageRect.left - 1
        && panelRect.right <= stageRect.right + 1
        && panelRect.top >= stageRect.top - 1
        && panelRect.bottom <= stageRect.bottom + 1,
      hits,
      label: element.querySelector('.map-inset__label')?.textContent ?? '',
      sourceOutline: Boolean(document.querySelector('.map-inset-source')),
    };
  });
  expect(measurements.insideStage).toBe(true);
  expect(measurements.label).toBe(expected.label);
  expect(measurements.sourceOutline).toBe(true);
  const hitIds = measurements.hits.map((hit) => hit.id);
  expect(hitIds).toContain(targetId);
  for (const hitId of hitIds) expect(expected.members).toContain(hitId as string);
  for (const hit of measurements.hits) {
    expect(hit.width).toBeGreaterThanOrEqual(43.5);
    expect(hit.height).toBeGreaterThanOrEqual(43.5);
    expect(hit.label).not.toMatch(/Antigua|Barbuda|Barbados|Dominica|Grenada|Kitts|Lucia|Vincent/);
  }
  for (let left = 0; left < measurements.hits.length; left += 1) {
    for (let right = left + 1; right < measurements.hits.length; right += 1) {
      const a = measurements.hits[left];
      const b = measurements.hits[right];
      const overlaps = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      expect(overlaps, `${a.id} and ${b.id} inset touch surfaces do not overlap`).toBe(false);
    }
  }
}

async function assertCurrentHitAssist(page: Page, targetId: string) {
  const hit = page.locator('.map-current-target-hit');
  if (!HIT_ASSIST_IDS.has(targetId)) {
    await expect(hit).toHaveCount(0);
    return;
  }
  await expect(hit).toHaveCount(1);
  await expect(hit).toHaveAttribute('data-id', targetId);
  const box = await hit.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(43.5);
  const owner = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null;
  }, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 });
  expect(owner).toBe(targetId);
}

async function assertHispaniolaPrecedence(page: Page, targetId: string) {
  const otherId = targetId === 'HTI' ? 'DOM' : 'HTI';
  return page.evaluate(([target, other]) => {
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    const circle = document.querySelector<SVGCircleElement>(`.map-current-target-hit[data-id="${target}"]`);
    const polygon = document.querySelector<SVGPathElement>(`.map-country[data-id="${other}"] .map-country__shape`);
    if (!svg || !circle || !polygon) return { tested: false, inside: 0, answers: [] as string[] };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { tested: false, inside: 0, answers: [] as string[] };
    const answers: string[] = [];
    let inside = 0;
    for (let ring = 1; ring <= 8; ring += 1) {
      for (let step = 0; step < 32; step += 1) {
        const angle = (step / 32) * Math.PI * 2;
        const x = circle.cx.baseVal.value + Math.cos(angle) * circle.r.baseVal.value * ring / 8;
        const y = circle.cy.baseVal.value + Math.sin(angle) * circle.r.baseVal.value * ring / 8;
        const point = new DOMPoint(x, y);
        if (!polygon.isPointInFill(point)) continue;
        inside += 1;
        const screen = point.matrixTransform(matrix);
        const owner = document.elementFromPoint(screen.x, screen.y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id');
        if (owner) answers.push(owner);
      }
    }
    return { tested: true, inside, answers: [...new Set(answers)] };
  }, [targetId, otherId] as const);
}

for (const viewport of VIEWPORTS) {
  test(`frames every North America Locations scope on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const scope of LOCATION_SCOPES) {
      await openLocationScope(page, scope.id, scope.action);
      await expect(page.locator('.map-active-countries > .map-country')).toHaveCount(scope.count);
      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('.map-stage')!.getBoundingClientRect();
        const viewportElement = document.querySelector('[data-map-viewport]')!.getBoundingClientRect();
        const countries = [...document.querySelectorAll<SVGGElement>('.map-active-countries > .map-country')];
        const offStage: string[] = [];
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        for (const country of countries) {
          const rect = country.getBoundingClientRect();
          const visibleLeft = Math.max(stage.left, rect.left);
          const visibleTop = Math.max(stage.top, rect.top);
          const visibleRight = Math.min(stage.right, rect.right);
          const visibleBottom = Math.min(stage.bottom, rect.bottom);
          if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
            offStage.push(country.getAttribute('data-id') ?? '?');
            continue;
          }
          left = Math.min(left, visibleLeft);
          top = Math.min(top, visibleTop);
          right = Math.max(right, visibleRight);
          bottom = Math.max(bottom, visibleBottom);
        }
        return {
          offStage,
          fillsStage: Math.abs(viewportElement.width - stage.width) <= 2 && Math.abs(viewportElement.height - stage.height) <= 2,
          usedWidth: (right - left) / stage.width,
          usedHeight: (bottom - top) / stage.height,
          documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      console.log(`FRAME ${viewport.label} ${scope.id} ${JSON.stringify(metrics)}`);
      expect(metrics.offStage).toEqual([]);
      expect(metrics.fillsStage).toBe(true);
      expect(Math.max(metrics.usedWidth, metrics.usedHeight)).toBeGreaterThan(0.4);
      expect(metrics.documentOverflow).toBeLessThanOrEqual(1);
    }
  });

  test(`keeps the full Caribbean answer system usable on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await fixSessionId(page, `north-america-caribbean-${viewport.width}x${viewport.height}`);
    await openLocationScope(page, 'caribbean', 'Play Caribbean');
    const seen = new Set<string>();
    let precedenceTested = false;
    for (let index = 0; index < 13; index += 1) {
      const targetId = await currentLocationId(page);
      seen.add(targetId);
      await assertCurrentHitAssist(page, targetId);
      await assertInset(page, targetId);
      if (!precedenceTested && (targetId === 'HTI' || targetId === 'DOM')) {
        const result = await assertHispaniolaPrecedence(page, targetId);
        if (result.tested && result.inside > 0) {
          expect(result.answers).toEqual([targetId === 'HTI' ? 'DOM' : 'HTI']);
          precedenceTested = true;
        }
      }
      await answerCurrentLocationCorrectly(page, targetId);
      if (index < 12) {
        await expect(page.locator('#map-prompt-heading')).not.toHaveText(countryName(targetId), { timeout: 4_000 });
      } else {
        await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
      }
    }
    expect(seen.size).toBe(13);
    expect(precedenceTested).toBe(true);
    await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
  });
}

test('keeps Central America dense targets usable and preserves correct/wrong feedback', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await fixSessionId(page, 'north-america-central-density');
  await openLocationScope(page, 'central-america', 'Play Central America');
  const seen = new Set<string>();
  let sawWrong = false;
  for (let index = 0; index < 8; index += 1) {
    const targetId = await currentLocationId(page);
    seen.add(targetId);
    await assertCurrentHitAssist(page, targetId);
    if (!sawWrong) {
      const wrongId = await page.locator('.map-country[data-action="map-answer"]').evaluateAll((items, target) => {
        return items.find((item) => item.getAttribute('data-id') !== target)?.getAttribute('data-id') ?? null;
      }, targetId);
      expect(wrongId).not.toBeNull();
      const wrong = page.locator(`.map-country[data-action="map-answer"][data-id="${wrongId}"]`);
      await wrong.focus();
      await wrong.press('Enter');
      await expect(page.locator('.answer-feedback--wrong')).toBeVisible();
      // Play resolves the target on the first scored tap; a wrong answer is not retryable.
      // The normal dwell/advance is asserted by the prompt transition below.
      sawWrong = true;
    } else {
      await answerCurrentLocationCorrectly(page, targetId);
    }
    if (index < 7) await expect(page.locator('#map-prompt-heading')).not.toHaveText(countryName(targetId), { timeout: 4_000 });
  }
  expect(seen.size).toBe(8);
  expect(seen.has('BLZ')).toBe(true);
  expect(seen.has('SLV')).toBe(true);
  expect(seen.has('PAN')).toBe(true);
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
});

test('supports North America wheel zoom and pointer pan without losing the map', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLocationScope(page, 'north-america', 'Learn North America');
  const viewport = page.locator('[data-map-viewport]');
  const svg = viewport.locator('.map-svg');
  const initial = await svg.getAttribute('viewBox');
  await viewport.hover();
  await page.mouse.wheel(0, -300);
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(initial);
  const zoomed = await svg.getAttribute('viewBox');
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.35, box!.y + box!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.55, box!.y + box!.height * 0.55);
  await page.mouse.up();
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(zoomed);
  await expect(page.locator('#map-prompt-heading')).toBeVisible();
});

async function expectedCaribbeanOutlineQuestions(sessionId: string): Promise<Question[]> {
  const scope: StudyScope = { kind: 'region', id: 'caribbean', label: 'Caribbean' };
  const asset = await loadOutlineAsset('caribbean');
  if (!asset) throw new Error('Caribbean outline asset could not be loaded');
  return buildOutlineQuiz({
    countries: COUNTRIES,
    progress: createInitialProgress(COUNTRIES),
    scope,
    mode: 'test',
    size: Number.MAX_SAFE_INTEGER,
    sessionId,
    asset,
  });
}

for (const viewport of [VIEWPORTS[0], VIEWPORTS[3]]) {
  test(`keeps multipart Caribbean Outlines whole on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(120_000);
    const sessionId = `north-america-outlines-${viewport.width}x${viewport.height}`;
    const questions = await expectedCaribbeanOutlineQuestions(sessionId);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await fixSessionId(page, sessionId);
    await page.goto('/#/outlines/north-america/caribbean');
    await page.getByRole('button', { name: 'Play Caribbean' }).click();
    await expect(page.locator('.outline-svg')).toBeVisible();
    const checked = new Set<string>();
    for (const [index, question] of questions.entries()) {
      if (MULTIPART_OUTLINE_IDS.has(question.countryId)) {
        const metrics = await page.locator('.outline-svg').evaluate((svg) => {
          const svgRect = svg.getBoundingClientRect();
          const paths = [...svg.querySelectorAll<SVGPathElement>('path')];
          const moves = paths.reduce((sum, path) => sum + (path.getAttribute('d')?.match(/M/g)?.length ?? 0), 0);
          const rects = paths.map((path) => path.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
          const left = Math.min(...rects.map((rect) => rect.left));
          const top = Math.min(...rects.map((rect) => rect.top));
          const right = Math.max(...rects.map((rect) => rect.right));
          const bottom = Math.max(...rects.map((rect) => rect.bottom));
          return {
            moves,
            inside: left >= svgRect.left - 1 && right <= svgRect.right + 1 && top >= svgRect.top - 1 && bottom <= svgRect.bottom + 1,
            usage: Math.max((right - left) / svgRect.width, (bottom - top) / svgRect.height),
          };
        });
        expect(metrics.moves, `${question.countryId} retains multiple outline components`).toBeGreaterThanOrEqual(2);
        expect(metrics.inside).toBe(true);
        expect(metrics.usage).toBeGreaterThan(0.55);
        checked.add(question.countryId);
      }
      await page.locator('.answer-button').nth(question.correctIndex).click();
      if (index < questions.length - 1) await expect(page.locator('.quiz-count')).toHaveText(`${index + 2}/${questions.length}`);
    }
    expect([...checked].sort()).toEqual([...MULTIPART_OUTLINE_IDS].sort());
    await expect(page.getByText(/Outlines · Round complete · Play/)).toBeVisible();
  });
}

async function submitNeighbor(page: Page, countryId: string) {
  const name = countryName(countryId);
  const input = page.locator('#neighbor-country-input');
  await input.fill(name);
  const suggestion = page.locator('.neighbor-suggestion').filter({ hasText: name }).first();
  await expect(suggestion).toBeVisible();
  await suggestion.click();
  await expect(page.getByText(`Correct: ${name}.`, { exact: true })).toBeVisible();
}

async function completeNeighborScope(page: Page, scopeId: 'central-america' | 'caribbean', label: string) {
  const adjacency = landAdjacencyForScope(scopeId);
  if (!adjacency) throw new Error(`Missing adjacency for ${scopeId}`);
  await page.goto(`/#/neighbors/north-america/${scopeId}`);
  await page.getByRole('button', { name: `Play ${label}` }).click();
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
  const expectedCount = scopeId === 'central-america' ? 8 : 13;
  const seen = new Set<string>();
  let sawPanCol = false;
  let sawHispaniola = false;
  let zeroCount = 0;
  for (let index = 0; index < expectedCount; index += 1) {
    const host = page.locator('[data-neighbor-map-host]');
    const targetId = await host.getAttribute('data-target-id');
    expect(targetId).toBeTruthy();
    seen.add(targetId!);
    const neighbours = adjacency[targetId!] ?? [];
    if (neighbours.length === 0) {
      await expect(host).toHaveAttribute('data-neighbor-map-status', 'error');
      await expect(host.locator('.neighbor-map-unavailable')).toHaveText('Map unavailable. Continue with the country entry field.');
    } else {
      await expect(host).toHaveAttribute('data-neighbor-map-status', 'ready');
    }
    if (targetId === 'PAN') {
      expect(neighbours).toContain('COL');
      sawPanCol = true;
    }
    if (targetId === 'HTI' || targetId === 'DOM') {
      expect(neighbours).toEqual([targetId === 'HTI' ? 'DOM' : 'HTI']);
      sawHispaniola = true;
    }
    if (neighbours.length === 0) {
      zeroCount += 1;
      await page.getByRole('button', { name: NO_LAND_NEIGHBORS_LABEL, exact: true }).click();
      await expect(page.getByText(`Correct: ${NO_LAND_NEIGHBORS_LABEL}.`, { exact: true })).toBeVisible();
    } else {
      for (const neighbourId of neighbours) await submitNeighbor(page, neighbourId);
    }
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
  return { seen, sawPanCol, sawHispaniola, zeroCount };
}

test('keeps topology-derived North America Neighbours truthful end to end', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await fixSessionId(page, 'north-america-neighbours');
  const central = await completeNeighborScope(page, 'central-america', 'Central America');
  expect(central.seen.size).toBe(8);
  expect(central.sawPanCol).toBe(true);
  expect(central.zeroCount).toBe(0);

  await page.reload();
  const caribbean = await completeNeighborScope(page, 'caribbean', 'Caribbean');
  expect(caribbean.seen.size).toBe(13);
  expect(caribbean.sawHispaniola).toBe(true);
  expect(caribbean.zeroCount).toBe(ZERO_NEIGHBOR_IDS.size);
  expect([...caribbean.seen].filter((id) => ZERO_NEIGHBOR_IDS.has(id)).length).toBe(ZERO_NEIGHBOR_IDS.size);
});

test('presents complete-region Mastery for Northern America across all four domains', async ({ page }) => {
  const mastered = {
    version: 1,
    regionDomainMasteries: [
      'northern-america:flags',
      'northern-america:locations',
      'northern-america:outlines',
      'northern-america:neighbors',
    ],
    completeRegions: ['northern-america'],
    completeContinents: [],
    worldCrown: false,
  };
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: ACHIEVEMENT_STORAGE_KEY,
    state: mastered,
  });
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    await page.goto(`/#/${domain}/north-america`);
    // The spatial surface marks an earned scope on its chip, and says both
    // earned states in words rather than in colour alone.
    const chip = page.locator('.spatial-chip--complete').filter({ hasText: 'Northern America' });
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAccessibleName(/Mastered/);
    await expect(chip).toHaveAccessibleName(/complete/);
    // Selecting it exposes Play for that scope, without starting a round.
    await chip.click();
    await expect(page.getByRole('button', { name: 'Play Northern America' })).toBeVisible();
  }
});
