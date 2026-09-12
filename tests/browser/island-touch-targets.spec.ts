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

function persistentHit(page: Page, id: string) {
  return page.locator(`.map-assist-hits [data-action="map-answer"][data-id="${id}"] [data-map-hit]`);
}

async function screenDiameter(page: Page, id: string): Promise<number> {
  const hit = persistentHit(page, id);
  await expect(hit).toHaveCount(1);
  return hit.evaluate((circle) => {
    const item = circle as SVGCircleElement;
    const matrix = item.getScreenCTM();
    if (!matrix) return 0;
    const radius = item.r.baseVal.value;
    return Math.min(
      radius * 2 * Math.hypot(matrix.a, matrix.b),
      radius * 2 * Math.hypot(matrix.c, matrix.d),
    );
  });
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
  for (const id of ids) {
    await expect.poll(() => screenDiameter(page, id), {
      timeout: 5_000,
      message: `${id} keeps the shared 44px practical target`,
    }).toBeGreaterThanOrEqual(PRACTICAL_DIAMETER_PX);
  }
}

async function assertPersistentHitContracts(page: Page, ids: readonly string[]) {
  await assertPersistentHitSizes(page, ids);
  for (const id of ids) await actionableEdgePoint(page, id);
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
  await assertPersistentHitContracts(page, ASIA_ASSISTS);

  // Force the Play feedback rerender with an assisted wrong guess. This is the
  // same replacement lifecycle that exposed #221. The persistent feedback is
  // authoritative here; the graphite wrong-map pulse is intentionally brief.
  const target = await currentTarget(page);
  const wrongId = ASIA_ASSISTS.find((id) => id !== target.id)!;
  await tapPoint(page, await actionableEdgePoint(page, wrongId));
  await expect(page.locator('#map-prompt-heading')).toHaveText(target.name);
  await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
  await assertPersistentHitContracts(page, ASIA_ASSISTS);

  await answerCurrentByKeyboard(page);
  await assertPersistentHitContracts(page, ASIA_ASSISTS);
});

test('Asia practical hit size remains screen-stable after map zoom', async ({ page }) => {
  test.skip(test.info().project.name.includes('mobile'), 'Desktop wheel path owns deterministic zoom-scale acceptance; mobile project exercises real touch taps.');
  await openLocations(page, '/#/locations/asia', 'Learn Asia', { width: 390, height: 844 });
  await assertPersistentHitContracts(page, ASIA_ASSISTS);

  const viewport = await page.locator('[data-map-viewport]').boundingBox();
  expect(viewport).not.toBeNull();
  await page.mouse.move(viewport!.x + viewport!.width / 2, viewport!.y + viewport!.height / 2);
  for (let index = 0; index < 6; index += 1) await page.mouse.wheel(0, -700);

  // The invisible assist disc must stay 44px at every zoom. Once real country
  // land becomes large enough it may cover that disc by design (#117), so the
  // interaction invariant is that the country remains selectable through its
  // real polygon or any still-exposed assist area, not that water assistance
  // must always win a pixel after zooming in.
  await assertPersistentHitSizes(page, ASIA_ASSISTS);
  for (const id of ASIA_ASSISTS) await actionableCountryPoint(page, id);
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
      await tapPoint(page, { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 });
      await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(target.name);
      return;
    }
    await answerCurrentByKeyboard(page);
  }
  throw new Error('No Caribbean inset member was reached in the complete region round');
});
