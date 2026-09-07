import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES, COUNTRY_BY_ID } from '../../src/data/countries.js';
import { getMapScopeConfig } from '../../src/data/map-scopes.js';
import {
  generatedNeighborCountryIds,
  getNeighborScopeConfig,
  landAdjacencyForScope,
} from '../../src/data/neighbors/index.js';
import {
  buildNeighborSession,
  createInitialNeighborProgress,
  NO_LAND_NEIGHBORS_LABEL,
} from '../../src/domain/neighbor-game.js';
import type { StudyMode } from '../../src/domain/models.js';

test.setTimeout(90_000);

const LOCATION_SESSION_ID = 'browser-fixture-locations-southern';
const LOCATION_WRONG_SESSION_ID = 'browser-fixture-locations-wrong';
const LOCATION_PERSIST_SESSION_ID = 'browser-fixture-locations-persist';
const NEIGHBOR_SESSION_ID = 'fixture-neighbors-southern';
const NEIGHBOR_WRONG_SESSION_ID = 'fixture-neighbors-wrong';
const NEIGHBOR_PERSIST_SESSION_ID = 'persist-1';
const ZERO_NEIGHBOR_SESSION_ID = 'zero-7';

async function fixSessionId(page: Page, sessionId: string) {
  await page.addInitScript(({ id }) => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: () => id,
    });
  }, { id: sessionId });
}

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`No country fixture for ${name}`);
  return country.id;
}

function countryName(id: string): string {
  return COUNTRY_BY_ID.get(id)?.name ?? id;
}

async function openLocationsPlay(page: Page, sessionId = LOCATION_SESSION_ID, scopeId = 'southern-africa') {
  await fixSessionId(page, sessionId);
  await page.goto(`/#/locations/africa/${scopeId}`);
  await page.getByRole('button', { name: `Play ${getMapScopeConfig(scopeId)?.scope.label}` }).click();
  await expect(page).toHaveURL(new RegExp(`#/locations/africa/${scopeId}/test$`));
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentLocationId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

async function answerLocation(page: Page, countryId: string) {
  // Use the canonical focusable country/inset answer surface. Helper geometry
  // can share the same data-id for practical touch, but it is not the stable
  // browser-test identity after the viewport has been panned or zoomed.
  const answer = page.locator(
    `.map-country[data-action="map-answer"][data-id="${countryId}"][tabindex], .map-inset__hit[data-action="map-answer"][data-id="${countryId}"][tabindex]`,
  ).first();
  await expect(answer).toBeVisible();
  await answer.focus();
  await answer.press('Enter');
  await expect(page.locator('.answer-feedback')).toBeVisible();
}

async function completeLocationsRound(page: Page, wrongFirst = false) {
  const total = Number((await page.locator('.map-round-count').innerText()).split('/')[1]);
  for (let index = 0; index < total; index += 1) {
    const targetId = await currentLocationId(page);
    if (wrongFirst && index === 0) {
      const wrong = await page.locator('.map-country[data-action="map-answer"][data-id][tabindex], .map-inset__hit[data-action="map-answer"][data-id][tabindex]').evaluateAll((elements, target) => {
        const item = elements.find((element) => element.getAttribute('data-id') !== target);
        return item?.getAttribute('data-id') ?? null;
      }, targetId);
      expect(wrong).not.toBeNull();
      await answerLocation(page, wrong as string);
      await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
      await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
      await expect(page.locator('#map-prompt-heading')).toHaveText(countryName(targetId));
      await expect(page.locator('.map-country--revealed')).toHaveCount(0);
      await answerLocation(page, targetId);
      await expect(page.locator('.answer-feedback--neutral')).toContainText('After 1 miss');
      await expect(page.locator('.map-country--one-miss')).toBeAttached();
      await expect(page.locator('.map-country--current-correct')).toHaveCount(0);
    } else {
      await answerLocation(page, targetId);
      await expect(page.locator('.answer-feedback--correct')).toContainText('First try');
    }
    if (index < total - 1) {
      // #202 keeps the prompt intentionally stable after unresolved misses.
      // Once the target is actually resolved, round progress is the durable
      // advance contract; do not infer resolution from a short name change.
      await expect(page.locator('.map-round-count')).toHaveText(`${index + 2} / ${total}`, { timeout: 10_000 });
    }
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 10_000 });
}

async function expectedNeighborSession(sessionId: string, mode: StudyMode, scopeId: string) {
  const config = getNeighborScopeConfig(scopeId);
  const adjacency = landAdjacencyForScope(scopeId);
  if (!config || !adjacency) throw new Error(`Missing neighbour fixture for ${scopeId}`);
  return buildNeighborSession(
    adjacency,
    createInitialNeighborProgress(generatedNeighborCountryIds()),
    config.scope,
    config.countryIds,
    mode,
    sessionId,
    10,
  );
}

async function openNeighbors(page: Page, sessionId: string, mode: StudyMode, scopeId: string) {
  await fixSessionId(page, sessionId);
  await page.goto(`/#/neighbors/africa/${scopeId}`);
  const verb = mode === 'learn' ? 'Learn' : 'Play';
  const label = getNeighborScopeConfig(scopeId)?.scope.label;
  await page.getByRole('button', { name: `${verb} ${label}` }).click();
  await expect(page).toHaveURL(new RegExp(`#/neighbors/africa/${scopeId}/${mode}$`));
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
}

async function submitNeighborBySuggestion(page: Page, id: string) {
  const name = countryName(id);
  const input = page.locator('#neighbor-country-input');
  await input.fill(name);
  const suggestion = page.locator('.neighbor-suggestion').filter({ hasText: name }).first();
  await expect(suggestion).toBeVisible();
  await suggestion.click();
}

async function completeNeighborRound(page: Page, session: ReturnType<typeof buildNeighborSession>, wrongFirst = false) {
  const scopeId = session.scope.id ?? '';
  const adjacency = landAdjacencyForScope(scopeId);
  if (!adjacency) throw new Error(`Missing adjacency fixture for ${scopeId}`);
  for (const index of session.countryIds.keys()) {
    const targetId = await page.locator('[data-neighbor-map-host]').getAttribute('data-target-id');
    if (!targetId) throw new Error('Active Neighbours target is missing from map host');
    await expect(page.getByRole('heading', { name: countryName(targetId), exact: true })).toBeVisible();
    await expect(page.locator('[data-neighbor-map-host]')).toHaveAttribute('data-neighbor-map-status', 'ready');
    const neighbors = adjacency[targetId] ?? [];
    if (wrongFirst && index === 0) {
      await page.locator('#neighbor-country-input').fill('Kenya');
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(page.getByText('Kenya is not in this neighbour set.', { exact: true })).toBeVisible();
      await expect(page.locator('#neighbor-country-input')).toBeFocused();
      await page.locator('#neighbor-country-input').fill('Kenya');
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(page.getByText('Already guessed. No attempt used.', { exact: true })).toBeVisible();
      await expect(page.locator('#neighbor-country-input')).toBeFocused();
    }
    for (const neighborId of neighbors) {
      await submitNeighborBySuggestion(page, neighborId);
      await expect(page.getByText(`Correct: ${countryName(neighborId)}.`, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    if (index < session.countryIds.length - 1) await expect(page.locator('#neighbor-country-input')).toBeFocused();
  }
  await expect(page.getByRole('heading', { name: 'Round complete' })).toBeVisible({ timeout: 6_000 });
}

test.describe('Locations browser matrix (#98)', () => {
  test('answers correct and wrong, exercises mouse pan/wheel zoom, and reaches results', async ({ page }) => {
    await openLocationsPlay(page);
    const viewport = page.locator('[data-map-viewport]');
    const before = await viewport.locator('.map-svg').getAttribute('viewBox');
    await viewport.hover();
    await page.mouse.wheel(0, -260);
    await expect.poll(() => viewport.locator('.map-svg').getAttribute('viewBox')).not.toBe(before);
    const zoomed = await viewport.locator('.map-svg').getAttribute('viewBox');
    const box = await viewport.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + 50, box!.y + 80);
    await page.mouse.down();
    await page.mouse.move(box!.x + 120, box!.y + 120);
    await page.mouse.up();
    await expect.poll(() => viewport.locator('.map-svg').getAttribute('viewBox')).not.toBe(zoomed);
    await completeLocationsRound(page, true);
    await expect(page.getByText(/location needs another pass/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review mistakes' })).toBeVisible();
  });

  test('reviews a missed location, repeats, exits, and falls back to the launcher after refresh with persisted evidence', async ({ page }) => {
    await openLocationsPlay(page, LOCATION_WRONG_SESSION_ID);
    await completeLocationsRound(page, true);
    await page.getByRole('button', { name: 'Review mistakes' }).click();
    await expect(page).toHaveURL(/#\/locations\/africa\/southern-africa\/review$/);
    await expect(page.locator('#map-prompt-heading')).toBeVisible();
    await page.getByRole('button', { name: 'Exit map round' }).click();
    await expect(page).toHaveURL(/#\/locations\/africa\/southern-africa$/);

    await page.reload();
    await openLocationsPlay(page, LOCATION_SESSION_ID);
    const targetId = await currentLocationId(page);
    await answerLocation(page, targetId);
    await page.reload();
    await expect(page).toHaveURL(/#\/locations\/africa\/southern-africa$/);
    await expect(page.getByRole('heading', { name: 'Southern Africa', exact: true })).toBeVisible();
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('flag-atlas:location-progress:v1') ?? '{}'));
    expect(persisted.records?.[targetId]?.lifetimeResolved).toBeGreaterThanOrEqual(1);

    await openLocationsPlay(page, LOCATION_PERSIST_SESSION_ID);
    await completeLocationsRound(page);
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page).toHaveURL(/#\/locations\/africa\/southern-africa\/test$/);
    await page.getByRole('button', { name: 'Exit map round' }).click();
    await expect(page).toHaveURL(/#\/locations\/africa\/southern-africa$/);
  });
});

test.describe('Neighbours browser matrix (#99)', () => {
  test('types/selects/submits a complete map-backed round and reaches results', async ({ page }) => {
    await openNeighbors(page, NEIGHBOR_SESSION_ID, 'test', 'southern-africa');
    const session = await expectedNeighborSession(NEIGHBOR_SESSION_ID, 'test', 'southern-africa');
    await completeNeighborRound(page, session);
    await expect(page.getByText(/of \d+ countries correct/)).toBeVisible();
  });

  test('shows wrong and duplicate feedback, reviews mistakes, then exits review', async ({ page }) => {
    await openNeighbors(page, NEIGHBOR_WRONG_SESSION_ID, 'test', 'southern-africa');
    const session = await expectedNeighborSession(NEIGHBOR_WRONG_SESSION_ID, 'test', 'southern-africa');
    await completeNeighborRound(page, session, true);
    await expect(page.getByRole('button', { name: 'Review mistakes' })).toBeVisible();
    await page.getByRole('button', { name: 'Review mistakes' }).click();
    await expect(page).toHaveURL(/#\/neighbors\/africa\/southern-africa\/review$/);
    await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible();
    await page.getByRole('button', { name: 'Exit neighbour round' }).click();
    await expect(page).toHaveURL(/#\/neighbors\/africa\/southern-africa$/);
  });

  test('persists a resolved target and refreshes an active route back to its launcher', async ({ page }) => {
    await openNeighbors(page, NEIGHBOR_PERSIST_SESSION_ID, 'test', 'southern-africa');
    const session = await expectedNeighborSession(NEIGHBOR_PERSIST_SESSION_ID, 'test', 'southern-africa');
    const targetId = await page.locator('[data-neighbor-map-host]').getAttribute('data-target-id');
    if (!targetId) throw new Error('Missing target id');
    const adjacency = landAdjacencyForScope('southern-africa');
    if (!adjacency) throw new Error('Missing adjacency');
    for (const neighborId of adjacency[targetId] ?? []) await submitNeighborBySuggestion(page, neighborId);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('flag-atlas:neighbor-progress:v1') ?? '{}'));
    expect(persisted.records?.[targetId]?.lifetimeResolved).toBeGreaterThanOrEqual(1);
    await page.reload();
    await expect(page).toHaveURL(/#\/neighbors\/africa\/southern-africa$/);
  });

  test('keeps the explicit no-land-neighbours path usable without leaking the empty set', async ({ page }) => {
    await openNeighbors(page, ZERO_NEIGHBOR_SESSION_ID, 'test', 'caribbean');
    const targetId = await page.locator('[data-neighbor-map-host]').getAttribute('data-target-id');
    if (!targetId) throw new Error('Missing target id');
    const adjacency = landAdjacencyForScope('caribbean');
    if (!adjacency) throw new Error('Missing adjacency');
    expect(adjacency[targetId] ?? []).toHaveLength(0);
    await expect(page.getByRole('button', { name: NO_LAND_NEIGHBORS_LABEL, exact: true })).toBeVisible();
    await page.getByRole('button', { name: NO_LAND_NEIGHBORS_LABEL, exact: true }).click();
    await expect(page.getByText('Correct. No land-border neighbours.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
  });
});