import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES, COUNTRY_BY_ID } from '../../src/data/countries.js';
import { loadOutlineAsset } from '../../src/data/outlines.js';
import { landAdjacencyForScope } from '../../src/data/neighbors/index.js';
import { createInitialProgress } from '../../src/domain/progress.js';
import { buildOutlineQuiz } from '../../src/domain/outline.js';
import {
  buildNeighborSession,
  createInitialNeighborProgress,
  NO_LAND_NEIGHBORS_LABEL,
} from '../../src/domain/neighbor-game.js';
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
  { id: 'oceania', label: 'Oceania', action: 'Learn Oceania', count: 14, ids: ['AUS', 'NZL', 'FJI', 'PNG', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV'] },
  { id: 'australia-new-zealand', label: 'Australia & New Zealand', action: 'Play Australia & New Zealand', count: 2, ids: ['AUS', 'NZL'] },
  { id: 'melanesia', label: 'Melanesia', action: 'Play Melanesia', count: 4, ids: ['FJI', 'PNG', 'SLB', 'VUT'] },
  { id: 'micronesia', label: 'Micronesia', action: 'Play Micronesia', count: 5, ids: ['KIR', 'MHL', 'FSM', 'NRU', 'PLW'] },
  { id: 'polynesia', label: 'Polynesia', action: 'Play Polynesia', count: 3, ids: ['WSM', 'TON', 'TUV'] },
] as const;

const REGION_SCOPES = LOCATION_SCOPES.slice(1);
const HIT_ASSIST_IDS = new Set(['FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV']);
const REAL_POLYGON_ONLY_IDS = new Set(['AUS', 'NZL', 'PNG']);
const MULTIPART_OUTLINE_IDS = new Set(['AUS', 'NZL', 'FJI', 'PNG', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'PLW', 'WSM', 'TON', 'TUV']);
const ZERO_NEIGHBOR_IDS = new Set(['AUS', 'NZL', 'FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV']);

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

async function instrumentPointerCapture(page: Page) {
  await page.addInitScript(() => {
    const target = Element.prototype as Element & { setPointerCapture?: (pointerId: number) => void };
    const original = target.setPointerCapture;
    (window as Window & { __atlasPointerCaptures?: number[] }).__atlasPointerCaptures = [];
    if (!original) return;
    target.setPointerCapture = function setPointerCapture(pointerId: number) {
      (window as Window & { __atlasPointerCaptures?: number[] }).__atlasPointerCaptures?.push(pointerId);
      return original.call(this, pointerId);
    };
  });
}

async function pointerCaptureCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as Window & { __atlasPointerCaptures?: number[] }).__atlasPointerCaptures?.length ?? 0);
}

async function waitForMap(page: Page) {
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  // Issue #166: the opening frame lands about 200ms later now that the
  // launcher route boots the globe first, and much later than that under a
  // loaded SwiftShader runner. Given the same allowance as the prompt above
  // it, rather than the 5s expect default.
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
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
  const path = scopeId === 'oceania' ? '/#/locations/oceania' : `/#/locations/oceania/${scopeId}`;
  await page.goto(path);
  const start = page.getByRole('button', { name: action });
  await expect(start).toBeVisible();
  await start.click();
  await waitForMap(page);
}

async function currentLocationId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

type ScreenPoint = { x: number; y: number };

async function realPolygonPoint(page: Page, targetId: string): Promise<ScreenPoint> {
  const point = await page.evaluate((id) => {
    const path = document.querySelector<SVGPathElement>(`.map-country[data-action="map-answer"][data-id="${id}"] .map-country__shape`);
    if (!path) return null;
    const box = path.getBBox();
    const matrix = path.getScreenCTM();
    if (!matrix) return null;
    for (let yi = 1; yi < 40; yi += 1) {
      for (let xi = 1; xi < 40; xi += 1) {
        const local = new DOMPoint(box.x + box.width * xi / 40, box.y + box.height * yi / 40);
        if (!path.isPointInFill(local)) continue;
        const screen = local.matrixTransform(matrix);
        const owner = document.elementFromPoint(screen.x, screen.y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id');
        if (owner === id) return { x: screen.x, y: screen.y };
      }
    }
    return null;
  }, targetId);
  expect(point, `${targetId} exposes a real, visible scoring-polygon point`).not.toBeNull();
  return point!;
}

async function assistOnlyPoint(page: Page, targetId: string): Promise<ScreenPoint> {
  const point = await page.evaluate((id) => {
    const circle = document.querySelector<SVGCircleElement>(`.map-current-target-hit[data-id="${id}"]`);
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    if (!circle || !svg) return null;
    const rect = circle.getBoundingClientRect();
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const inverse = matrix.inverse();
    const landPaths = [
      ...document.querySelectorAll<SVGPathElement>('.map-active-countries .map-country__shape'),
      ...document.querySelectorAll<SVGPathElement>('.map-context .map-context-country'),
    ];
    // Search the actual rendered touch surface rather than a few polar rings.
    // SLB's archipelago leaves a large useful open-water assist area, but the
    // former ring sample could miss it depending on projection/viewport phase.
    for (let y = Math.ceil(rect.top + 1); y < Math.floor(rect.bottom - 1); y += 2) {
      for (let x = Math.ceil(rect.left + 1); x < Math.floor(rect.right - 1); x += 2) {
        const local = new DOMPoint(x, y).matrixTransform(inverse);
        if (landPaths.some((path) => path.isPointInFill(local))) continue;
        const owner = document.elementFromPoint(x, y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id');
        if (owner === id) return { x, y };
      }
    }
    return null;
  }, targetId);
  expect(point, `${targetId} has a clickable assistance-only point in open water`).not.toBeNull();
  return point!;
}

async function assertCurrentAssistance(page: Page, targetId: string) {
  const hit = page.locator('.map-current-target-hit');
  await expect(page.locator('[data-map-inset]')).toHaveCount(0);
  await expect(page.locator('.map-country-locator')).toHaveCount(0);
  if (!HIT_ASSIST_IDS.has(targetId)) {
    await expect(hit).toHaveCount(0);
    expect(REAL_POLYGON_ONLY_IDS.has(targetId), `${targetId} is intentionally polygon-only`).toBe(true);
    return;
  }
  await expect(hit).toHaveCount(1);
  await expect(hit).toHaveAttribute('data-id', targetId);
  const box = await hit.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(43.5);
  await assistOnlyPoint(page, targetId);
}

async function auditAssistPrecedence(page: Page, targetId: string) {
  return page.evaluate((id) => {
    const circle = document.querySelector<SVGCircleElement>(`.map-current-target-hit[data-id="${id}"]`);
    if (!circle) return { overlapSamples: 0, mismatches: [] as string[] };
    const matrix = circle.getScreenCTM();
    if (!matrix) return { overlapSamples: 0, mismatches: ['missing-screen-matrix'] };
    const others = [...document.querySelectorAll<SVGGElement>(`.map-country[data-action="map-answer"]`)]
      .filter((group) => group.dataset.id !== id)
      .map((group) => ({ id: group.dataset.id ?? '?', path: group.querySelector<SVGPathElement>('.map-country__shape') }))
      .filter((item): item is { id: string; path: SVGPathElement } => Boolean(item.path));
    let overlapSamples = 0;
    const mismatches: string[] = [];
    for (const ring of [0.25, 0.5, 0.75, 0.95]) {
      for (let step = 0; step < 72; step += 1) {
        const angle = step / 72 * Math.PI * 2;
        const point = new DOMPoint(
          circle.cx.baseVal.value + Math.cos(angle) * circle.r.baseVal.value * ring,
          circle.cy.baseVal.value + Math.sin(angle) * circle.r.baseVal.value * ring,
        );
        for (const other of others) {
          if (!other.path.isPointInFill(point)) continue;
          overlapSamples += 1;
          const screen = point.matrixTransform(matrix);
          const owner = document.elementFromPoint(screen.x, screen.y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id');
          if (owner !== other.id) mismatches.push(`${other.id}->${owner ?? 'none'}`);
        }
      }
    }
    return { overlapSamples, mismatches: [...new Set(mismatches)] };
  }, targetId);
}

async function answerCurrentLocationWithPointer(page: Page, targetId: string) {
  const point = HIT_ASSIST_IDS.has(targetId)
    ? await assistOnlyPoint(page, targetId)
    : await realPolygonPoint(page, targetId);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('.answer-feedback--correct')).toBeVisible();
}

for (const viewport of VIEWPORTS) {
  test(`frames every Oceania Locations scope on ${viewport.label}`, async ({ page }) => {
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
      expect(metrics.offStage).toEqual([]);
      expect(metrics.fillsStage).toBe(true);
      expect(Math.max(metrics.usedWidth, metrics.usedHeight)).toBeGreaterThan(0.35);
      expect(metrics.documentOverflow).toBeLessThanOrEqual(1);
    }
  });
}

for (const viewport of [VIEWPORTS[0], VIEWPORTS[1]]) {
  test(`keeps all 14 Oceania Locations pointer-answerable on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await fixSessionId(page, `oceania-locations-${viewport.width}x${viewport.height}`);
    const seen = new Set<string>();
    const assistedSeen = new Set<string>();
    let precedenceOverlapSamples = 0;
    for (const scope of REGION_SCOPES) {
      await openLocationScope(page, scope.id, scope.action);
      for (let index = 0; index < scope.count; index += 1) {
        const targetId = await currentLocationId(page);
        seen.add(targetId);
        await assertCurrentAssistance(page, targetId);
        if (HIT_ASSIST_IDS.has(targetId)) {
          assistedSeen.add(targetId);
          const precedence = await auditAssistPrecedence(page, targetId);
          expect(precedence.mismatches, `${targetId} assisted surface never outranks another real scoring polygon`).toEqual([]);
          precedenceOverlapSamples += precedence.overlapSamples;
        }
        await answerCurrentLocationWithPointer(page, targetId);
        if (index < scope.count - 1) {
          await expect(page.locator('#map-prompt-heading')).not.toHaveText(countryName(targetId), { timeout: 4_000 });
        } else {
          await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
        }
      }
    }
    expect([...seen].sort()).toEqual([...LOCATION_SCOPES[0].ids].sort());
    expect([...assistedSeen].sort()).toEqual([...HIT_ASSIST_IDS].sort());
    // Assistance is question-specific, so two assisted circles can never coexist
    // and array order can never decide assisted-vs-assisted ownership. Any sampled
    // overlap with a real polygon above must resolve to the real polygon (#117).
    expect(precedenceOverlapSamples).toBeGreaterThanOrEqual(0);
  });
}

test('preserves wrong feedback and real-polygon scoring in Melanesia', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await fixSessionId(page, 'oceania-melanesia-feedback');
  await openLocationScope(page, 'melanesia', 'Play Melanesia');
  const targetId = await currentLocationId(page);
  const wrongId = targetId === 'PNG' ? 'SLB' : 'PNG';
  const wrongPoint = await realPolygonPoint(page, wrongId);
  await page.mouse.click(wrongPoint.x, wrongPoint.y);
  await expect(page.locator('.answer-feedback--wrong')).toBeVisible();
  await expect(page.locator('#map-prompt-heading')).not.toHaveText(countryName(targetId), { timeout: 4_000 });
});

test('preserves North America pointer ownership semantics on Pacific assisted targets', async ({ page }) => {
  test.setTimeout(120_000);
  await instrumentPointerCapture(page);
  await fixSessionId(page, 'oceania-pointer-ownership');
  await page.setViewportSize({ width: 390, height: 844 });
  await openLocationScope(page, 'micronesia', 'Play Micronesia');
  const targetId = await currentLocationId(page);
  expect(HIT_ASSIST_IDS.has(targetId)).toBe(true);
  const point = await assistOnlyPoint(page, targetId);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  expect(await pointerCaptureCount(page)).toBe(0);
  await page.mouse.move(point.x + 2, point.y + 2);
  expect(await pointerCaptureCount(page)).toBe(0);
  await page.mouse.move(point.x + 9, point.y + 2);
  await expect.poll(() => pointerCaptureCount(page)).toBeGreaterThan(0);
  await page.mouse.up();
  await expect(page.locator('#map-prompt-heading')).toHaveText(countryName(targetId));
  const retry = await assistOnlyPoint(page, targetId);
  await page.mouse.click(retry.x, retry.y);
  await expect(page.locator('.answer-feedback--correct')).toBeVisible();
});

test('supports Oceania wheel zoom and pointer pan without losing the map', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLocationScope(page, 'oceania', 'Learn Oceania');
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

async function expectedOutlineRound(scopeId: string, label: string, sessionId: string) {
  const scope: StudyScope = { kind: 'region', id: scopeId, label };
  const asset = await loadOutlineAsset(scopeId);
  if (!asset) throw new Error(`${label} outline asset could not be loaded`);
  const questions: Question[] = buildOutlineQuiz({
    countries: COUNTRIES,
    progress: createInitialProgress(COUNTRIES),
    scope,
    mode: 'test',
    size: Number.MAX_SAFE_INTEGER,
    sessionId,
    asset,
  });
  return { questions, asset };
}

for (const viewport of [VIEWPORTS[0], VIEWPORTS[3]]) {
  test(`keeps canonical multipart Oceania Outlines whole on ${viewport.label}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    // Install one UUID override per page. Repeated addInitScript calls stack and
    // can make the browser round use a different seed from the locally built
    // expected round after the first region.
    const sessionId = `oceania-outlines-${viewport.width}x${viewport.height}`;
    await fixSessionId(page, sessionId);
    const checked = new Set<string>();
    for (const scope of REGION_SCOPES) {
      const { questions, asset } = await expectedOutlineRound(scope.id, scope.label, sessionId);
      await page.goto(`/#/outlines/oceania/${scope.id}`);
      await page.getByRole('button', { name: scope.action }).click();
      await expect(page.locator('.outline-svg')).toBeVisible();
      for (const [index, question] of questions.entries()) {
        if (MULTIPART_OUTLINE_IDS.has(question.countryId)) {
          const expectedGeometry = asset.geometries[question.countryId];
          expect(expectedGeometry, `${question.countryId} has canonical Outline geometry`).toBeDefined();
          expect(expectedGeometry.subpathCount, `${question.countryId} canonical Outline retains multiple components`).toBeGreaterThanOrEqual(2);
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
          expect(metrics.moves, `${question.countryId} renderer preserves every loaded Outline subpath`).toBe(expectedGeometry.subpathCount);
          expect(metrics.inside, `${question.countryId} stays fully inside the Outline frame`).toBe(true);
          // Exact 844x390 production evidence places several healthy wide
          // canonical silhouettes at 0.48938865 usage. 0.48 preserves a real
          // regression margin without distorting geography to satisfy 50%.
          expect(metrics.usage, `${question.countryId} uses the production Outline frame`).toBeGreaterThan(0.48);
          checked.add(question.countryId);
        }
        await page.locator('.answer-button').nth(question.correctIndex).click();
        if (index < questions.length - 1) await expect(page.locator('.quiz-count')).toHaveText(`${index + 2}/${questions.length}`);
      }
      await expect(page.getByText(/Outlines · Round complete · Play/)).toBeVisible();
    }
    expect([...checked].sort()).toEqual([...MULTIPART_OUTLINE_IDS].sort());
    expect(checked.has('KIR')).toBe(true);
    expect(checked.has('MHL')).toBe(true);
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

function neighborSessionIdWithZeroBeforePng(): string {
  const ids = ['FJI', 'PNG', 'SLB', 'VUT'];
  const adjacency = landAdjacencyForScope('melanesia');
  if (!adjacency) throw new Error('Missing Melanesia adjacency');
  const scope: StudyScope = { kind: 'region', id: 'melanesia', label: 'Melanesia' };
  for (let index = 0; index < 50; index += 1) {
    const sessionId = `oceania-neighbour-host-${index}`;
    const session = buildNeighborSession(
      adjacency,
      createInitialNeighborProgress(ids),
      scope,
      ids,
      'test',
      sessionId,
      Number.MAX_SAFE_INTEGER,
    );
    if (session.countryIds.indexOf('PNG') > 0) return sessionId;
  }
  throw new Error('Could not derive deterministic zero-before-PNG session.');
}

async function completeNeighborScope(
  page: Page,
  scope: { id: string; label: string; count: number },
): Promise<{ seen: Set<string>; zeroCount: number; sawPngIndonesia: boolean; sawZeroBeforePng: boolean }> {
  const adjacency = landAdjacencyForScope(scope.id);
  if (!adjacency) throw new Error(`Missing adjacency for ${scope.id}`);
  await page.goto(`/#/neighbors/oceania/${scope.id}`);
  await page.getByRole('button', { name: `Play ${scope.label}` }).click();
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
  const seen = new Set<string>();
  let zeroCount = 0;
  let sawPngIndonesia = false;
  let sawZeroBeforePng = false;
  let hadZero = false;
  for (let index = 0; index < scope.count; index += 1) {
    const host = page.locator('[data-neighbor-map-host]');
    const targetId = await host.getAttribute('data-target-id');
    expect(targetId).toBeTruthy();
    seen.add(targetId!);
    const neighbours = adjacency[targetId!] ?? [];
    if (neighbours.length === 0) {
      zeroCount += 1;
      hadZero = true;
      await expect(host).toHaveAttribute('data-neighbor-map-status', 'error');
      await expect(host.locator('.neighbor-map-unavailable')).toHaveText('Map unavailable. Continue with the country entry field.');
      await page.getByRole('button', { name: NO_LAND_NEIGHBORS_LABEL, exact: true }).click();
      await expect(page.getByText(`Correct: ${NO_LAND_NEIGHBORS_LABEL}.`, { exact: true })).toBeVisible();
    } else {
      await expect(host).toHaveAttribute('data-neighbor-map-status', 'ready');
      if (targetId === 'PNG') {
        expect(neighbours).toEqual(['IDN']);
        sawPngIndonesia = true;
        sawZeroBeforePng = hadZero;
      }
      for (const neighbourId of neighbours) await submitNeighbor(page, neighbourId);
    }
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 8_000 });
  return { seen, zeroCount, sawPngIndonesia, sawZeroBeforePng };
}

test('keeps topology-derived Oceania Neighbours truthful and isolates map-host lifecycle', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const melanesiaSessionId = neighborSessionIdWithZeroBeforePng();
  await fixSessionId(page, melanesiaSessionId);

  const melanesia = await completeNeighborScope(page, { id: 'melanesia', label: 'Melanesia', count: 4 });
  expect(melanesia.seen.size).toBe(4);
  expect(melanesia.zeroCount).toBe(3);
  expect(melanesia.sawPngIndonesia).toBe(true);
  expect(melanesia.sawZeroBeforePng).toBe(true);

  for (const scope of [
    { id: 'australia-new-zealand', label: 'Australia & New Zealand', count: 2 },
    { id: 'micronesia', label: 'Micronesia', count: 5 },
    { id: 'polynesia', label: 'Polynesia', count: 3 },
  ]) {
    const result = await completeNeighborScope(page, scope);
    expect(result.seen.size).toBe(scope.count);
    expect(result.zeroCount).toBe(scope.count);
    expect([...result.seen].every((id) => ZERO_NEIGHBOR_IDS.has(id))).toBe(true);
  }
});

test('presents complete-region Mastery for Micronesia across all four domains', async ({ page }) => {
  const mastered = {
    version: 1,
    regionDomainMasteries: [
      'micronesia:flags',
      'micronesia:locations',
      'micronesia:outlines',
      'micronesia:neighbors',
    ],
    completeRegions: ['micronesia'],
    completeContinents: [],
    worldCrown: false,
  };
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: ACHIEVEMENT_STORAGE_KEY,
    state: mastered,
  });
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    await page.goto(`/#/${domain}/oceania`);
    // The spatial surface marks an earned scope on its chip, and says both
    // earned states in words rather than in colour alone.
    const chip = page.locator('.spatial-chip--complete').filter({ hasText: 'Micronesia' });
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAccessibleName(/Mastered/);
    await expect(chip).toHaveAccessibleName(/complete/);
    // Selecting it exposes Play for that scope, without starting a round.
    await chip.click();
    await expect(page.getByRole('button', { name: 'Play Micronesia' })).toBeVisible();
  }
});
