import { expect, test } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const INSET_IDS = new Set(['KNA', 'ATG', 'DMA', 'LCA', 'VCT', 'GRD', 'BRB']);

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

test('debug mobile inset hit stack', async ({ page }) => {
  test.skip(!test.info().project.name.includes('mobile'));
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/north-america/caribbean');
  await page.getByRole('button', { name: 'Play Caribbean' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });

  for (let index = 0; index < 13; index += 1) {
    const name = await page.locator('#map-prompt-heading').innerText();
    const id = idForName(name);
    if (!INSET_IDS.has(id)) {
      const answer = page.locator(`[data-action="map-answer"][data-id="${id}"][tabindex]`).first();
      await answer.focus();
      await answer.press('Enter');
      await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(name);
      continue;
    }

    const hit = page.locator(`.map-inset__hit[data-id="${id}"]`);
    await expect(hit).toBeVisible();
    const box = await hit.boundingBox();
    expect(box).not.toBeNull();
    const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    const diagnostic = await page.evaluate(({ x, y }) => ({
      point: { x, y },
      viewport: { width: innerWidth, height: innerHeight },
      stack: document.elementsFromPoint(x, y).slice(0, 12).map((element) => ({
        tag: element.tagName,
        className: element.getAttribute('class'),
        id: element.getAttribute('data-id'),
        action: element.getAttribute('data-action'),
        pointerEvents: getComputedStyle(element).pointerEvents,
        touchAction: getComputedStyle(element).touchAction,
      })),
    }), point);

    await page.evaluate(() => {
      const events: unknown[] = [];
      (window as typeof window & { __insetEvents?: unknown[] }).__insetEvents = events;
      for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click']) {
        document.addEventListener(type, (event) => {
          const target = event.target instanceof Element ? event.target : null;
          events.push({
            type,
            tag: target?.tagName ?? null,
            className: target?.getAttribute('class') ?? null,
            id: target?.closest('[data-id]')?.getAttribute('data-id') ?? null,
            action: target?.closest('[data-action]')?.getAttribute('data-action') ?? null,
            defaultPrevented: event.defaultPrevented,
          });
        }, { capture: true, once: false });
      }
    });

    console.log(`INSET_HIT_STACK ${id} ${JSON.stringify(diagnostic)}`);
    const before = await page.locator('.map-round-count').textContent();
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(800);
    const events = await page.evaluate(() => (window as typeof window & { __insetEvents?: unknown[] }).__insetEvents ?? []);
    const after = await page.locator('.map-round-count').textContent();
    console.log(`INSET_HIT_EVENTS ${id} before=${before} after=${after} ${JSON.stringify(events)}`);
    return;
  }
  throw new Error('No inset target reached');
});
