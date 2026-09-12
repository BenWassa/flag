import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openAfricaLearn(page: Page) {
  await page.goto('/#/locations/africa');
  await page.getByRole('button', { name: 'Learn Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function hitDiameter(page: Page, id: string): Promise<number> {
  const hit = page.locator(`:is(.map-assist-hits [data-id="${id}"], .map-country[data-id="${id}"]) [data-map-hit]`);
  await expect(hit).toBeVisible();
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

async function actionablePoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const hit = page.locator(`:is(.map-assist-hits [data-id="${id}"], .map-country[data-id="${id}"]) [data-map-hit]`);
  const box = await hit.boundingBox();
  if (!box) throw new Error(`No locator hit for ${id}`);
  for (let rows = 5; rows <= 13; rows += 2) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < rows; x += 1) {
        const point = {
          x: box.x + ((x + 0.5) / rows) * box.width,
          y: box.y + ((y + 0.5) / rows) * box.height,
        };
        const owner = await page.evaluate(({ x: px, y: py }) =>
          document.elementFromPoint(px, py)?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null,
        point);
        if (owner === id) return point;
      }
    }
  }
  throw new Error(`${id} has no exposed target point`);
}

test('São Tomé and Príncipe keeps a practical, working target after a question advance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAfricaLearn(page);
  expect(await hitDiameter(page, 'STP')).toBeGreaterThanOrEqual(43.5);

  const firstName = await page.locator('#map-prompt-heading').innerText();
  const firstId = idForName(firstName);
  const first = page.locator(`[data-action="map-answer"][data-id="${firstId}"][tabindex]`);
  await first.focus();
  await first.press('Enter');
  await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(firstName);

  expect(await hitDiameter(page, 'STP')).toBeGreaterThanOrEqual(43.5);
  const point = await actionablePoint(page, 'STP');
  const nextId = idForName(await page.locator('#map-prompt-heading').innerText());
  await page.mouse.click(point.x, point.y);
  if (nextId === 'STP') {
    await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
  } else {
    await expect(page.locator('.map-country[data-id="STP"]')).toHaveClass(/map-country--wrong-pulse/);
  }
});
