import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const ASSIST_IDS = ['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP'] as const;
const MARKER_IDS = ['BHR', 'BRN', 'MDV', 'SGP'] as const;

// The broad serial Chromium run can leave SwiftShader/browser-context startup
// materially slower than the 30s default. Apply the budget before fixtures are
// created so context provisioning is covered without retries.
test.setTimeout(120_000);

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openScope(page: Page, route: string, label: string) {
  await page.goto(route);
  await page.getByRole('button', { name: label }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentId(page: Page): Promise<string> {
  return idForName(await page.locator('#map-prompt-heading').innerText());
}

async function answerKeyboard(page: Page, id: string) {
  const country = page.locator(`.map-country[data-id="${id}"]`);
  await expect(country).toHaveAttribute('data-action', 'map-answer');
  await country.focus();
  await country.press('Enter');
}

async function waitForAdvance(page: Page, previousName: string) {
  await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(previousName);
}

async function actionablePoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const hit = page.locator(`.map-assist-hits [data-id="${id}"] .map-country__assisted-hit`);
  await expect(hit).toBeVisible();
  const box = await hit.boundingBox();
  if (!box) throw new Error(`No assist box for ${id}`);
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
  throw new Error(`${id} has no exposed assisted hit point after real-geography precedence`);
}

async function assertAssistContracts(page: Page, expectedIds: readonly string[]) {
  const renderedIds = await page.locator('.map-assist-hits [data-id]').evaluateAll((groups) =>
    groups.map((group) => group.getAttribute('data-id')).filter(Boolean).sort(),
  );
  expect(renderedIds).toEqual([...expectedIds].sort());
  for (const id of expectedIds) {
    const hit = page.locator(`.map-assist-hits [data-id="${id}"] .map-country__assisted-hit`);
    await expect(hit).toHaveCount(1);
    const diameter = await hit.evaluate((circle) => {
      const item = circle as SVGCircleElement;
      const matrix = item.getScreenCTM();
      if (!matrix) return null;
      const radius = item.r.baseVal.value;
      return { x: radius * 2 * Math.hypot(matrix.a, matrix.b), y: radius * 2 * Math.hypot(matrix.c, matrix.d) };
    });
    expect(diameter, `${id} assist has a screen transform`).not.toBeNull();
    expect(Math.min(diameter!.x, diameter!.y), `${id} assist keeps the shared 44px contract`).toBeGreaterThanOrEqual(43.5);
    await actionablePoint(page, id);
  }
}

for (const viewport of [
  { name: '320 portrait', width: 320, height: 568 },
  { name: '390 portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
]) {
  test(`Asia max zoom is useful for small targets at ${viewport.name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openScope(page, '/#/locations/asia', 'Play Asia');
    const map = page.locator('[data-map-viewport]');
    await expect(map).toHaveAttribute('data-map-max-zoom', '8');
    const auditedIds = ['ARM', 'AZE', 'GEO', 'LBN', 'PSE', 'BHR', 'SGP', 'BRN', 'MDV'];
    const opening: Record<string, number> = {};
    for (const id of auditedIds) {
      const shape = page.locator(`.map-country[data-id="${id}"] .map-country__shape`);
      const initial = await shape.boundingBox();
      expect(initial, `${id} has canonical projected geometry`).not.toBeNull();
      opening[id] = Math.min(initial!.width, initial!.height);
    }
    const arm = page.locator('.map-country[data-id="ARM"] .map-country__shape');
    const initialArm = await arm.boundingBox();
    for (let index = 0; index < 12; index += 1) {
      await page.mouse.move(initialArm!.x + initialArm!.width / 2, initialArm!.y + initialArm!.height / 2);
      await page.mouse.wheel(0, -900);
    }
    const finalArm = await arm.boundingBox();
    expect(finalArm).not.toBeNull();
    const finalArmMin = Math.min(finalArm!.width, finalArm!.height);
    expect(finalArmMin, 'Armenia grows materially at the configured maximum zoom').toBeGreaterThan(opening.ARM * 1.35);
    console.log(`ISSUE137_ZOOM ${viewport.width}x${viewport.height} ${JSON.stringify({ opening, armAtMax: finalArmMin })}`);
  });
}

test('Asia removes the Levant popup and keeps truthful persistent assistance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/middle-east', 'Learn Middle East');
  await expect(page.locator('[data-map-inset]')).toHaveCount(0);
  for (const id of ['LBN', 'ISR', 'PSE']) await expect(page.locator(`.map-country[data-id="${id}"] .map-country__shape`)).toHaveCount(1);
  for (const id of MARKER_IDS.filter((id) => ['BHR'].includes(id))) await expect(page.locator(`.map-country[data-id="${id}"] .map-country__marker`)).toHaveCount(1);
  await assertAssistContracts(page, ['BHR', 'ISR', 'KWT', 'LBN', 'PSE', 'QAT']);
});

test('feedback rerender preserves shared hit sizes and previously answered countries remain guesses', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia', 'Learn Asia');
  await assertAssistContracts(page, ASSIST_IDS);
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  await answerKeyboard(page, first);
  await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
  await waitForAdvance(page, firstName);
  await assertAssistContracts(page, ASSIST_IDS);
  await expect(page.locator(`.map-country[data-id="${first}"]`)).toHaveAttribute('data-action', 'map-answer');
  await page.locator(`.map-country[data-id="${first}"]`).focus();
  await page.locator(`.map-country[data-id="${first}"]`).press('Enter');
  await expect(page.locator(`.map-country[data-id="${first}"]`)).toHaveClass(/map-country--wrong-pulse/);
});

test('an assisted country resolved earlier remains a normal wrong guess in a region round', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/southeast-asia', 'Learn Southeast Asia');
  for (let index = 0; index < 11; index += 1) {
    const name = await page.locator('#map-prompt-heading').innerText();
    const id = idForName(name);
    if (id === 'BRN' || id === 'SGP') {
      const point = await actionablePoint(page, id);
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
      await waitForAdvance(page, name);
      const wrongPoint = await actionablePoint(page, id);
      await page.mouse.click(wrongPoint.x, wrongPoint.y);
      await expect(page.locator(`.map-country[data-id="${id}"]`)).toHaveClass(/map-country--wrong-pulse/);
      return;
    }
    await answerKeyboard(page, id);
    await waitForAdvance(page, name);
  }
  throw new Error('No assisted Southeast Asia country encountered');
});

test('Play re-enables the previous country after advance as an ordinary retryable miss', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/caucasus', 'Play Caucasus');
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  await answerKeyboard(page, first);
  await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
  await waitForAdvance(page, firstName);
  const activeName = await page.locator('#map-prompt-heading').innerText();
  const previous = page.locator(`.map-country[data-id="${first}"]`);
  await expect(previous).toHaveAttribute('data-action', 'map-answer');
  await previous.focus();
  await previous.press('Enter');
  // #202: a first miss in Play no longer resolves the target. It stays neutral,
  // leaves the prompt active and exposes the remaining retrieval attempts.
  await expect(page.locator('.answer-feedback--neutral')).toContainText('2 tries left');
  await expect(page.locator('.answer-feedback--wrong')).toHaveCount(0);
  await expect(page.locator('#map-prompt-heading')).toHaveText(activeName);
  await expect(page.locator('.map-country--revealed')).toHaveCount(0);
  await expect(previous).toHaveClass(/map-country--wrong-pulse/);
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Asia projected map remains contained at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openScope(page, '/#/locations/asia/south-asia', 'Play South Asia');
    await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-max-zoom', '8');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
