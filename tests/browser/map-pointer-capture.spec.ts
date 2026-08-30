import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const HIT_ASSIST_IDS = new Set(['BHS', 'BLZ', 'DOM', 'HTI', 'JAM', 'SLV', 'TTO']);

function countryIdForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openCaribbean(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/north-america/caribbean');
  await page.getByRole('button', { name: 'Play Caribbean' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  await page.waitForFunction(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    return Boolean(viewport && svg && svg.getAttribute('viewBox') !== viewport.dataset.mapViewbox);
  });
}

async function currentId(page: Page): Promise<string> {
  return countryIdForName(await page.locator('#map-prompt-heading').innerText());
}

async function waitForAdvance(page: Page, previousName: string) {
  await expect(page.locator('#map-prompt-heading')).not.toHaveText(previousName, { timeout: 4_000 });
}

async function polygonInteriorPoint(page: Page, countryId: string): Promise<{ x: number; y: number }> {
  const point = await page.evaluate((id) => {
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    const path = document.querySelector<SVGPathElement>(`.map-country[data-id="${id}"] .map-country__shape`);
    if (!svg || !path) return null;
    const bounds = path.getBBox();
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    for (let rows = 2; rows <= 12; rows += 1) {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < rows; x += 1) {
          const local = new DOMPoint(
            bounds.x + ((x + 0.5) / rows) * bounds.width,
            bounds.y + ((y + 0.5) / rows) * bounds.height,
          );
          if (!path.isPointInFill(local)) continue;
          const screen = local.matrixTransform(matrix);
          const owner = document.elementFromPoint(screen.x, screen.y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id');
          if (owner === id) return { x: screen.x, y: screen.y };
        }
      }
    }
    return null;
  }, countryId);
  expect(point, `${countryId} has a clickable canonical polygon point`).not.toBeNull();
  return point!;
}

test('captures only established drags and never converts a pan into an answer', async ({ page }) => {
  await openCaribbean(page);
  const viewport = page.locator('[data-map-viewport]');
  const svg = viewport.locator('.map-svg');
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const beforePrompt = await page.locator('#map-prompt-heading').innerText();
  const beforeViewBox = await svg.getAttribute('viewBox');

  await page.evaluate(() => {
    (window as Window & { __atlasPointerId?: number }).__atlasPointerId = undefined;
    document.addEventListener('pointerdown', (event) => {
      (window as Window & { __atlasPointerId?: number }).__atlasPointerId = event.pointerId;
    }, { once: true, capture: true });
  });

  const x = box!.x + box!.width * 0.48;
  const y = box!.y + box!.height * 0.48;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const pointerId = await page.evaluate(() => (window as Window & { __atlasPointerId?: number }).__atlasPointerId);
  expect(pointerId).toBeDefined();
  expect(await viewport.evaluate((element, id) => element.hasPointerCapture(id), pointerId!)).toBe(false);

  await page.mouse.move(x + 3, y);
  expect(await viewport.evaluate((element, id) => element.hasPointerCapture(id), pointerId!)).toBe(false);

  await page.mouse.move(x + 14, y + 8);
  expect(await viewport.evaluate((element, id) => element.hasPointerCapture(id), pointerId!)).toBe(true);
  await page.mouse.up();

  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(beforeViewBox);
  await expect(page.locator('#map-prompt-heading')).toHaveText(beforePrompt);
});

test('sub-threshold movement preserves assisted-tap scoring', async ({ page }) => {
  await openCaribbean(page);
  for (let index = 0; index < 13; index += 1) {
    const id = await currentId(page);
    const name = await page.locator('#map-prompt-heading').innerText();
    if (HIT_ASSIST_IDS.has(id)) {
      const hit = page.locator(`.map-current-target-hit[data-id="${id}"]`);
      await expect(hit).toBeVisible();
      const box = await hit.boundingBox();
      expect(box).not.toBeNull();
      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 3, y);
      await page.mouse.up();
      await waitForAdvance(page, name);
      return;
    }
    const keyboardStop = page.locator(`[data-action="map-answer"][data-id="${id}"][tabindex="0"]`);
    await keyboardStop.focus();
    await keyboardStop.press('Enter');
    await waitForAdvance(page, name);
  }
  throw new Error('No assisted Caribbean target encountered');
});

test('a physical click on a real country polygon still scores normally', async ({ page }) => {
  await openCaribbean(page);
  for (let index = 0; index < 13; index += 1) {
    const id = await currentId(page);
    const name = await page.locator('#map-prompt-heading').innerText();
    if (!HIT_ASSIST_IDS.has(id)) {
      const point = await polygonInteriorPoint(page, id);
      await page.mouse.click(point.x, point.y);
      await waitForAdvance(page, name);
      return;
    }
    const hit = page.locator(`.map-current-target-hit[data-id="${id}"]`);
    const box = await hit.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await waitForAdvance(page, name);
  }
  throw new Error('No non-assisted Caribbean target encountered');
});
