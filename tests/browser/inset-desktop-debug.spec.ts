import { expect, test } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const INSET_IDS = new Set(['KNA', 'ATG', 'DMA', 'LCA', 'VCT', 'GRD', 'BRB']);

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

test('debug desktop inset hit routing', async ({ page }) => {
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
    const before = await page.locator('.map-round-count').textContent();
    const diagnostics = await page.evaluate(({ id: targetId, point: p }) => {
      const hit = document.querySelector<SVGCircleElement>(`.map-inset__hit[data-id="${targetId}"]`)!;
      const style = getComputedStyle(hit);
      const describe = (element: Element) => ({
        tag: element.tagName,
        className: element.getAttribute('class'),
        action: element.getAttribute('data-action'),
        id: element.getAttribute('data-id'),
        pointerEvents: getComputedStyle(element).pointerEvents,
        zIndex: getComputedStyle(element).zIndex,
      });
      (window as unknown as { __insetEvents: string[] }).__insetEvents = [];
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        hit.addEventListener(type, () => (window as unknown as { __insetEvents: string[] }).__insetEvents.push(`hit:${type}`));
        document.addEventListener(type, (event) => {
          const target = event.target as Element | null;
          (window as unknown as { __insetEvents: string[] }).__insetEvents.push(`document:${type}:${target?.getAttribute('class') ?? target?.tagName ?? '?'}`);
        }, { once: true });
      }
      return {
        targetId,
        point: p,
        hitStyle: { pointerEvents: style.pointerEvents, fill: style.fill, visibility: style.visibility, opacity: style.opacity },
        top: document.elementFromPoint(p.x, p.y) ? describe(document.elementFromPoint(p.x, p.y)!) : null,
        stack: document.elementsFromPoint(p.x, p.y).slice(0, 8).map(describe),
      };
    }, { id, point });
    console.log(`INSET_DIAGNOSTICS ${JSON.stringify(diagnostics)}`);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(250);
    const after = await page.locator('.map-round-count').textContent();
    const events = await page.evaluate(() => (window as unknown as { __insetEvents: string[] }).__insetEvents);
    console.log(`INSET_EVENTS ${JSON.stringify({ id, before, after, events })}`);
    return;
  }
  throw new Error('No inset target reached');
});
