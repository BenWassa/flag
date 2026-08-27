import { expect, test, type Page } from '@playwright/test';

const HIT_ASSIST_IDS = new Set(['BHS', 'BLZ', 'DOM', 'HTI', 'JAM', 'SLV', 'TTO']);

async function openCaribbean(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    Math.random = () => 0;
  });
  await page.goto('/flag/#/locations/north-america/caribbean/test');
  await expect(page.locator('[data-map-viewport]')).toBeVisible();
}

async function currentId(page: Page): Promise<string> {
  const text = await page.locator('#map-prompt-heading').innerText();
  const match = text.match(/Find (.+)$/);
  if (!match) throw new Error(`Unexpected map prompt: ${text}`);
  const name = match[1];
  return page.locator(`.map-country[data-action="map-answer"]`).evaluateAll((nodes, targetName) => {
    const canonical = new Map([
      ['Antigua and Barbuda', 'ATG'], ['The Bahamas', 'BHS'], ['Barbados', 'BRB'], ['Cuba', 'CUB'],
      ['Dominica', 'DMA'], ['Dominican Republic', 'DOM'], ['Grenada', 'GRD'], ['Haiti', 'HTI'],
      ['Jamaica', 'JAM'], ['Saint Kitts and Nevis', 'KNA'], ['Saint Lucia', 'LCA'],
      ['Saint Vincent and the Grenadines', 'VCT'], ['Trinidad and Tobago', 'TTO'],
    ]);
    const id = canonical.get(targetName as string);
    if (!id) throw new Error(`Unknown Caribbean target ${targetName}`);
    return id;
  }, name);
}

async function waitForAdvance(page: Page, previousPrompt: string): Promise<void> {
  await expect(page.locator('#map-prompt-heading')).not.toHaveText(previousPrompt);
}

async function polygonInteriorPoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const path = page.locator(`.map-active-countries .map-country[data-id="${id}"] .map-country__shape`);
  const handle = await path.elementHandle();
  if (!handle) throw new Error(`Missing real polygon for ${id}`);
  return handle.evaluate((element) => {
    const svgPath = element as SVGPathElement;
    const svg = svgPath.ownerSVGElement;
    if (!svg) throw new Error('Missing owner SVG');
    const box = svgPath.getBBox();
    const ctm = svgPath.getScreenCTM();
    if (!ctm) throw new Error('Missing screen transform');
    const point = svg.createSVGPoint();
    point.x = box.x + box.width / 2;
    point.y = box.y + box.height / 2;
    const screen = point.matrixTransform(ctm);
    return { x: screen.x, y: screen.y };
  });
}

test('captures only established drags and never converts a pan into an answer', async ({ page }) => {
  await openCaribbean(page);
  await page.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    if (!viewport) throw new Error('Missing map viewport');
    const original = viewport.setPointerCapture.bind(viewport);
    (window as Window & { __atlasPointerId?: number }).__atlasPointerId = undefined;
    viewport.setPointerCapture = (pointerId: number) => {
      (window as Window & { __atlasPointerId?: number }).__atlasPointerId = pointerId;
      original(pointerId);
    };
  });

  const viewport = page.locator('[data-map-viewport]');
  const svg = page.locator('.map-svg');
  const beforeViewBox = await svg.getAttribute('viewBox');
  const beforePrompt = await page.locator('#map-prompt-heading').innerText();
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.72;
  const y = box!.y + box!.height * 0.34;

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
    await hit.click({ position: { x: 1, y: 1 }, force: true });
    await waitForAdvance(page, name);
  }
  throw new Error('No real-polygon Caribbean target encountered');
});
