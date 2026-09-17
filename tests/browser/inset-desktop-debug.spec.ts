import { expect, test } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

test('debug exact LCA desktop inset path', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/north-america/caribbean');
  await page.getByRole('button', { name: 'Play Caribbean' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });

  for (let index = 0; index < 13; index += 1) {
    const name = await page.locator('#map-prompt-heading').innerText();
    const id = idForName(name);
    if (id !== 'LCA') {
      const answer = page.locator(`[data-action="map-answer"][data-id="${id}"][tabindex]`).first();
      await expect(answer).toBeVisible();
      await answer.focus();
      await answer.press('Enter');
      await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(name);
      continue;
    }

    const hit = page.locator('.map-inset__hit[data-action="map-answer"][data-id="LCA"]');
    await expect(hit).toBeVisible();
    const box = await hit.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(43.5);
    const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    const topOwner = await page.evaluate((p) => document.elementFromPoint(p.x, p.y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null, point);
    expect(topOwner).toBe('LCA');
    const before = await page.locator('.map-round-count').textContent();
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('.map-round-count')).not.toHaveText(before!, { timeout: 15_000 });
    return;
  }
  throw new Error('LCA was not reached in the Caribbean round');
});
