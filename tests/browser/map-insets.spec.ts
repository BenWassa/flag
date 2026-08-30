import { test, expect } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const VIEWPORTS = [
  { label: 'mobile portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 740, height: 360 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`keeps the Eastern Mediterranean inset usable in ${viewport.label}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#/locations/asia/middle-east');
    await page.getByRole('button', { name: 'Play Middle East' }).click();
    await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 30_000 });
    // The inset panel is measured against the stage, so the opening frame has to
    // have landed first. Issue #166 boots the globe ahead of the map, which
    // widened the window in which this measured a stage still settling.
    await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });

    let prompt = '';
    for (let index = 0; index < 20; index += 1) {
      if (await page.locator('[data-map-inset]').count()) {
        prompt = await page.locator('#map-prompt-heading').innerText();
        break;
      }
      const current = await page.locator('#map-prompt-heading').innerText();
      const currentId = COUNTRIES.find((country) => country.name === current)?.id;
      expect(currentId).toBeTruthy();
      await page.locator(`.map-country[data-action="map-answer"][data-id="${currentId}"]`).press('Enter');
      await expect(page.locator('#map-prompt-heading')).not.toHaveText(current, { timeout: 3000 });
    }

    expect(prompt).not.toBe('');
    const measurements = await page.locator('[data-map-inset]').evaluate((panel) => {
      const panelRect = panel.getBoundingClientRect();
      const stageRect = document.querySelector('.map-stage')!.getBoundingClientRect();
      const hits = [...panel.querySelectorAll('.map-inset__hit')].map((hit) => {
        const rect = hit.getBoundingClientRect();
        return {
          id: hit.getAttribute('data-id'),
          label: hit.getAttribute('aria-label'),
          width: rect.width,
          height: rect.height,
          tabIndex: hit.getAttribute('tabindex'),
        };
      });
      return {
        insideStage: panelRect.left >= stageRect.left - 1
          && panelRect.right <= stageRect.right + 1
          && panelRect.top >= stageRect.top - 1
          && panelRect.bottom <= stageRect.bottom + 1,
        hits,
        label: panel.querySelector('.map-inset__label')?.textContent,
        sourceOutline: Boolean(document.querySelector('.map-inset-source')),
      };
    });

    expect(measurements.insideStage).toBe(true);
    expect(measurements.label).toBe('Eastern Mediterranean');
    expect(measurements.sourceOutline).toBe(true);
    expect(measurements.hits).toHaveLength(3);
    expect(new Set(measurements.hits.map((hit) => hit.label)).size).toBe(3);
    for (const hit of measurements.hits) {
      expect(hit.width).toBeGreaterThanOrEqual(43.9);
      expect(hit.height).toBeGreaterThanOrEqual(43.9);
      expect(hit.tabIndex).toBe('0');
      expect(hit.label).toMatch(/^Selectable inset area \d of 3 in Eastern Mediterranean closer view$/);
    }

    const targetId = COUNTRIES.find((country) => country.name === prompt)?.id;
    expect(targetId).toBeTruthy();
    const target = page.locator(`.map-inset__hit[data-id="${targetId}"]`);
    await target.focus();
    await expect(target).toBeFocused();
    await target.press('Enter');
    await expect(page.locator('.answer-feedback')).toBeVisible();
  });
}
