import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function readyMap(page: Page, route: string, playLabel: string) {
  await page.goto(route);
  await page.getByRole('button', { name: playLabel }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
}

async function zoomTargetToClamp(page: Page, id: string) {
  const group = page.locator(`.map-country[data-id="${id}"]`);
  const initial = await group.boundingBox();
  if (!initial) throw new Error(`No rendered box for ${id}`);
  for (let index = 0; index < 14; index += 1) {
    const box = await group.boundingBox();
    if (!box) break;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -1200);
  }
  const final = await group.boundingBox();
  if (!final) throw new Error(`No max-zoom box for ${id}`);
  return {
    initial: { width: initial.width, height: initial.height },
    max: { width: final.width, height: final.height },
    maxZoom: await page.locator('[data-map-viewport]').getAttribute('data-map-max-zoom'),
  };
}

const cases = [
  ['ARM', '/#/locations/asia/caucasus', 'Play Caucasus'],
  ['AZE', '/#/locations/asia/caucasus', 'Play Caucasus'],
  ['GEO', '/#/locations/asia/caucasus', 'Play Caucasus'],
  ['LBN', '/#/locations/asia/middle-east', 'Play Middle East'],
  ['PSE', '/#/locations/asia/middle-east', 'Play Middle East'],
  ['BHR', '/#/locations/asia/middle-east', 'Play Middle East'],
  ['SGP', '/#/locations/asia/southeast-asia', 'Play Southeast Asia'],
  ['BRN', '/#/locations/asia/southeast-asia', 'Play Southeast Asia'],
  ['MDV', '/#/locations/asia/south-asia', 'Play South Asia'],
] as const;

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`measure Asia projected max zoom at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const result: Record<string, unknown> = {};
    for (const [id, route, label] of cases) {
      await readyMap(page, route, label);
      result[id] = await zoomTargetToClamp(page, id);
    }
    console.log(`ISSUE137_ZOOM_BASELINE ${viewport.width}x${viewport.height} ${JSON.stringify(result)}`);
    expect(Object.values(result).every((entry) => (entry as { maxZoom: string | null }).maxZoom === '5.5')).toBe(true);
  });
}

test('reproduce answered-country selectability defect', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/asia');
  await page.getByRole('button', { name: 'Learn Asia' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  const firstGroup = page.locator(`.map-country[data-id="${first}"]`);
  await firstGroup.focus();
  await firstGroup.press('Enter');
  await expect(page.locator('#map-prompt-heading')).not.toHaveText(firstName, { timeout: 5_000 });
  const actionAfterAdvance = await page.locator(`.map-country[data-id="${first}"]`).getAttribute('data-action');
  console.log(`ISSUE137_RESOLVED_BASELINE ${JSON.stringify({ first, actionAfterAdvance })}`);
  expect(actionAfterAdvance).toBeNull();
});

test('measure projected assistance before and after feedback rerender', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/asia');
  await page.getByRole('button', { name: 'Learn Asia' }).click();
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  const measure = async () => {
    const out: Record<string, unknown> = {};
    for (const id of ['BHR', 'MDV', 'SGP']) {
      const hit = page.locator(`.map-assist-hits [data-id="${id}"] [data-map-hit]`);
      if (await hit.count()) {
        const box = await hit.boundingBox();
        out[id] = box ? { width: box.width, height: box.height } : null;
      }
    }
    out.BRN = { assists: await page.locator('.map-assist-hits [data-id="BRN"] [data-map-hit]').count() };
    return out;
  };
  const before = await measure();
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  const group = page.locator(`.map-country[data-id="${first}"]`);
  await group.focus();
  await group.press('Enter');
  await expect(page.locator('#map-prompt-heading')).not.toHaveText(firstName, { timeout: 5_000 });
  const after = await measure();
  console.log(`ISSUE137_ASSIST_BASELINE ${JSON.stringify({ first, before, after })}`);
  expect((before.BRN as { assists: number }).assists).toBe(0);
});
