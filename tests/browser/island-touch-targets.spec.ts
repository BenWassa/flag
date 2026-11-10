import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const AFRICA_LEGACY_ASSISTS = ['CPV', 'STP', 'COM', 'MUS', 'SYC', 'GMB', 'TGO'] as const;
const EUROPE_LEGACY_ASSISTS = ['MLT', 'AND', 'LIE', 'LUX', 'MCO', 'SMR', 'VAT'] as const;
const ASIA_ASSISTS = ['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP'] as const;
const OCEANIA_ASSISTS = ['FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV'] as const;
const CARIBBEAN_INSET_IDS = new Set(['KNA', 'ATG', 'DMA', 'LCA', 'VCT', 'GRD', 'BRB']);
const PRACTICAL_DIAMETER_PX = 43.5;

test.setTimeout(180_000);

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openLocations(page: Page, route: string, launchLabel: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(route);
  await page.getByRole('button', { name: launchLabel }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentTarget(page: Page): Promise<{ id: string; name: string }> {
  const name = await page.locator('#map-prompt-heading').innerText();
  return { id: idForName(name), name };
}

async function answerCurrentByKeyboard(page: Page): Promise<void> {
  const { id, name } = await currentTarget(page);
  const answer = page.locator(`[data-action="map-answer"][data-id="${id}"][tabindex]`).first();
  await expect(answer).toBeVisible();
  await answer.focus();
  await answer.press('Enter');
  await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(name);
}

async function advanceCaribbeanByPointer(page: Page): Promise<void> {
  const { id } = await currentTarget(page);
  const roundCount = page.locator('.map-round-count');
  const beforeCount = await roundCount.textContent();
  expect(beforeCount, 'active Caribbean round exposes its current question count').not.toBeNull();

  // This suite owns the pointer/touch contract. Advance through canonical map
  // geography with the same scoring path the inset eventually exercises rather
  // than introducing an unrelated keyboard dependency into the inset regression.
  await tapPoint(page, await actionableCountryPoint(page, id));
  await expect(roundCount, `${id} pointer answer advances the Caribbean round`).not.toHaveText(beforeCount!, { timeout: 15_000 });
}

function persistentHit(page: Page, id: string) {
  return page.locator(`.map-assist-hits [data-action="map-answer"][data-id="${id}"] [data-map-hit]`);
}

async function screenDiameters(page: Page, ids: readonly string[]): Promise<Record<string, number>> {
  return page.evaluate((expectedIds) => {
    const diameters: Record<string, number> = {};
    for (const id of expectedIds) {
      const item = document.querySelector<SVGCircleElement>(
        `.map-assist-hits [data-action="map-answer"][data-id="${id}"] [data-map-hit]`,
      );
      const matrix = item?.getScreenCTM();
      if (!item || !matrix) {
        diameters[id] = 0;
        continue;
      }
      const radius = item.r.baseVal.value;
      diameters[id] = Math.min(
        radius * 2 * Math.hypot(matrix.a, matrix.b),
        radius * 2 * Math.hypot(matrix.c, matrix.d),
      );
    }
    return diameters;
  }, [...ids]);
}

async function hitCenter(page: Page, id: string): Promise<{ x: number; y: number }> {
  const hit = persistentHit(page, id);
  await expect(hit).toHaveCount(1);
  const point = await hit.evaluate((circle) => {
    const item = circle as SVGCircleElement;
    const matrix = item.getScreenCTM();
    if (!matrix) return null;
    const screen = new DOMPoint(item.cx.baseVal.value, item.cy.baseVal.value).matrixTransform(matrix);
    return { x: screen.x, y: screen.y };
  });
  expect(point, `${id} assist has a screen-space centre`).not.toBeNull();
  return point!;
}

async function findActionableHitPoint(page: Page, id: string): Promise<{ x: number; y: number } | null> {
  const hit = persistentHit(page, id);
  await expect(hit).toHaveCount(1);
  return hit.evaluate((circle, expectedId) => {
    const item = circle as SVGCircleElement;
    const matrix = item.getScreenCTM();
    if (!matrix) return null;
    const { cx, cy, r } = item;
    const fractions = [0.82, 0.7, 0.55, 0.35, 0];
    for (const fraction of fractions) {
      const samples = fraction === 0 ? 1 : 24;
      for (let index = 0; index < samples; index += 1) {
        const angle = (Math.PI * 2 * index) / samples;
        const local = new DOMPoint(
          cx.baseVal.value + r.baseVal.value * fraction * Math.cos(angle),
          cy.baseVal.value + r.baseVal.value * fraction * Math.sin(angle),
        );
        const screen = local.matrixTransform(matrix);
        const owner = document.elementFromPoint(screen.x, screen.y)
          ?.closest('[data-action="map-answer"]')
          ?.getAttribute('data-id');
        if (owner === expectedId) return { x: screen.x, y: screen.y };
      }
    }
    return null;
  }, id);
}

async function actionableEdgePoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const point = await findActionableHitPoint(page, id);
  expect(point, `${id} exposes part of its practical hit envelope`).not.toBeNull();
  return point!;
}

async function actionableCountryPoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const shape = page.locator(`.map-country[data-action="map-answer"][data-id="${id}"] .map-country__shape`).first();
  if (await shape.count()) {
    const point = await shape.evaluate((path, expectedId) => {
      const item = path as SVGGraphicsElement;
      const matrix = item.getScreenCTM();
      if (!matrix) return null;
      const box = item.getBBox();
      const steps = 15;
      for (let row = 0; row < steps; row += 1) {
        for (let column = 0; column < steps; column += 1) {
          const local = new DOMPoint(
            box.x + box.width * ((column + 0.5) / steps),
            box.y + box.height * ((row + 0.5) / steps),
          );
          const screen = local.matrixTransform(matrix);
          const owner = document.elementFromPoint(screen.x, screen.y)
            ?.closest('[data-action="map-answer"]')
            ?.getAttribute('data-id');
          if (owner === expectedId) return { x: screen.x, y: screen.y };
        }
      }
      return null;
    }, id);
    if (point) return point;
  }

  const assistPoint = await findActionableHitPoint(page, id);
  expect(assistPoint, `${id} remains physically selectable through real land or assistance`).not.toBeNull();
  return assistPoint!;
}

async function assertPersistentHitSizes(page: Page, ids: readonly string[]) {
  let snapshot: Record<string, number> = {};
  await expect.poll(async () => {
    snapshot = await screenDiameters(page, ids);
    return Math.min(...ids.map((id) => snapshot[id] ?? 0));
  }, {
    timeout: 5_000,
    message: `${ids.join(', ')} keep the shared 44px practical target in one stable frame`,
  }).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);

  for (const id of ids) {
    expect(snapshot[id], `${id} keeps the shared 44px practical target`).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);
  }
}

async function assertPersistentHitContracts(page: Page, ids: readonly string[]) {
  await assertPersistentHitSizes(page, ids);
  // #117 deliberately paints canonical real land above assistance. A 44px
  // assist can therefore be geometrically correct without owning an exposed
  // pixel itself. The interaction contract is the country remaining selectable
  // through either its real polygon or its assistance under that precedence.
  for (const id of ids) await actionableCountryPoint(page, id);
}

async function assertAsiaPersistentHitContracts(page: Page) {
  await assertPersistentHitContracts(page, ASIA_ASSISTS);
}

async function tapPoint(page: Page, point: { x: number; y: number }) {
  if (test.info().project.name.includes('mobile')) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

async function tapCountryAndAssert(page: Page, id: string) {
  const before = await currentTarget(page);
  const point = await actionableEdgePoint(page, id);
  await tapPoint(page, point);
  if (before.id === id) {
    await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(before.name);
  } else {
    await expect(page.locator('#map-prompt-heading')).toHaveText(before.name);
    await expect(page.locator(`.map-country[data-id="${id}"]`)).toHaveClass(/map-country--wrong-pulse/);
  }
}

test('Africa locator and callout islands keep practical working targets across a Learn advance', async ({ page }) => {
  await openLocations(page, '/#/locations/africa', 'Learn Africa', { width: 320, height: 568 });
  await assertPersistentHitContracts(page, AFRICA_LEGACY_ASSISTS);

  await answerCurrentByKeyboard(page);
  await assertPersistentHitContracts(page, AFRICA_LEGACY_ASSISTS);

  // São Tomé is the reported failure and a legacy locator, so exercise the
  // enlarged envelope itself rather than merely clicking its tiny visible mark.
  await tapCountryAndAssert(page, 'STP');
});

test('Europe keeps 44px generated assist geometry while Malta remains directly tappable in short landscape', async ({ page }) => {
  await openLocations(page, '/#/locations/europe', 'Learn Europe', { width: 844, height: 390 });
  await assertPersistentHitSizes(page, EUROPE_LEGACY_ASSISTS);
  await actionableEdgePoint(page, 'MLT');

  // Landlocked microstate callouts deliberately sit underneath real surrounding
  // country polygons (#117), so they are not required to own exposed pixels
  // where real geography wins. Malta is the island locator contract at issue.
  await answerCurrentByKeyboard(page);
  await assertPersistentHitSizes(page, EUROPE_LEGACY_ASSISTS);
  await tapCountryAndAssert(page, 'MLT');
});

test('Asia hit-assist countries survive Play feedback and question replacement at 44px', async ({ page }) => {
  await openLocations(page, '/#/locations/asia', 'Play Asia', { width: 390, height: 844 });
  await assertAsiaPersistentHitContracts(page);

  // Force the Play feedback rerender with an assisted wrong guess. Choose an
  // assist that actually owns uncontested pointer space in this exact frame;
  // contested assists are allowed to yield to real land under #117.
  const target = await currentTarget(page);
  let wrongId: string | null = null;
  let wrongPoint: { x: number; y: number } | null = null;
  for (const id of ASIA_ASSISTS) {
    if (id === target.id) continue;
    const point = await findActionableHitPoint(page, id);
    if (point) {
      wrongId = id;
      wrongPoint = point;
      break;
    }
  }
  expect(wrongId, 'Asia exposes an uncontested assisted wrong guess').not.toBeNull();
  expect(wrongPoint, 'Asia exposes an actionable assisted wrong-guess point').not.toBeNull();
  await tapPoint(page, wrongPoint!);
  await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
  await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
  await assertAsiaPersistentHitContracts(page);

  await answerCurrentByKeyboard(page);
  await assertAsiaPersistentHitContracts(page);
});

test('Asia practical hit size remains screen-stable after map zoom', async ({ page }) => {
  test.skip(test.info().project.name.includes('mobile'), 'Desktop wheel path owns deterministic zoom-scale acceptance; mobile project exercises real touch taps.');
  await openLocations(page, '/#/locations/asia', 'Learn Asia', { width: 390, height: 844 });
  await assertAsiaPersistentHitContracts(page);

  // Anchor the zoom on Bahrain, the #221 regression country. Requiring every
  // Asia assist to remain exposed after a strong arbitrary centre zoom would
  // incorrectly treat countries that have left the viewport as interaction
  // failures. The size invariant still applies to every generated assist.
  const bahrain = await hitCenter(page, 'BHR');
  await page.mouse.move(bahrain.x, bahrain.y);
  for (let index = 0; index < 6; index += 1) await page.mouse.wheel(0, -700);

  // The invisible assist disc must stay 44px at every zoom. Once real country
  // land becomes large enough it may cover that disc by design (#117), so BHR
  // may be selectable through its real polygon instead of exposed water assist.
  await assertPersistentHitSizes(page, ASIA_ASSISTS);
  await actionableCountryPoint(page, 'BHR');
});

test('Oceania tiny-island assistance remains practical before and after a Learn advance', async ({ page }) => {
  await openLocations(page, '/#/locations/oceania', 'Learn Oceania', { width: 390, height: 844 });
  await assertPersistentHitContracts(page, OCEANIA_ASSISTS);

  await answerCurrentByKeyboard(page);
  await assertPersistentHitContracts(page, OCEANIA_ASSISTS);
  await tapCountryAndAssert(page, 'NRU');
});

test('Caribbean true-scale inset exposes a practical touch target and scores through the same answer path', async ({ page }) => {
  test.setTimeout(240_000);
  await openLocations(page, '/#/locations/north-america/caribbean', 'Play Caribbean', { width: 390, height: 844 });

  for (let index = 0; index < 13; index += 1) {
    const target = await currentTarget(page);
    if (CARIBBEAN_INSET_IDS.has(target.id)) {
      const hit = page.locator(`.map-inset__hit[data-action="map-answer"][data-id="${target.id}"]`);
      await expect(hit).toBeVisible();
      const box = await hit.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.min(box!.width, box!.height), `${target.id} inset keeps a practical target`).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);
      const roundCount = page.locator('.map-round-count');
      const beforeCount = await roundCount.textContent();
      expect(beforeCount, 'Caribbean inset question exposes its round count').not.toBeNull();
      await tapPoint(page, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 });
      await expect(roundCount, `${target.id} inset tap is accepted by the shared scoring path`).not.toHaveText(beforeCount!, { timeout: 15_000 });
      return;
    }
    await advanceCaribbeanByPointer(page);
  }
  throw new Error('No Caribbean inset member was reached in the complete region round');
});