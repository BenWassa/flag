import { expect, test, type Locator, type Page } from '@playwright/test';

const STAGE = '.spatial-stage[data-ready="true"] canvas';
test.setTimeout(120_000);

async function openSpatial(page: Page, path: string) {
  await page.goto(`/#${path}`);
  await page.waitForSelector(STAGE, { timeout: 40_000 });
}

async function expectMinHeight(locator: Locator, minimum: number) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minimum);
}

test('token scale is applied to Spatial controls in portrait and short landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSpatial(page, '/flags/africa');

  const vars = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      compact: style.getPropertyValue('--control-height-compact').trim(),
      standard: style.getPropertyValue('--control-height-standard').trim(),
      press: style.getPropertyValue('--motion-press').trim(),
      ui: style.getPropertyValue('--motion-ui').trim(),
      feedback: style.getPropertyValue('--motion-feedback-emphasis').trim(),
    };
  });
  expect(vars).toEqual({ compact: '44px', standard: '52px', press: '100ms', ui: '160ms', feedback: '520ms' });

  // #198 removed persistent scope chips. Projected geography now owns normal
  // scope selection and retains the compact 44px practical target contract.
  await expectMinHeight(page.locator('.spatial-scope[data-scope-id="west-africa"]'), 44);
  await expectMinHeight(page.getByRole('button', { name: 'Play Africa' }), 52);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await page.setViewportSize({ width: 844, height: 390 });
  await openSpatial(page, '/flags/africa');
  await expectMinHeight(page.locator('.spatial-scope[data-scope-id="west-africa"]'), 44);
  await expectMinHeight(page.getByRole('button', { name: 'Play Africa' }), 52);
  await expect(page.locator('.spatial-command')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('representative domain and Profile controls use the shared geometry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await openSpatial(page, '/flags/africa/southern-africa');
  await page.getByRole('button', { name: 'Play Southern Africa' }).click();
  await expectMinHeight(page.locator('.answer-button').first(), 52);

  await openSpatial(page, '/outlines/africa/southern-africa');
  await page.getByRole('button', { name: 'Play Southern Africa' }).click();
  await expectMinHeight(page.locator('.answer-button').first(), 52);

  await openSpatial(page, '/locations/africa/southern-africa');
  await page.getByRole('button', { name: 'Play Southern Africa' }).click();
  await expectMinHeight(page.locator('.map-quiz-topbar .icon-button').first(), 44);

  await openSpatial(page, '/neighbors/africa/southern-africa');
  await page.getByRole('button', { name: 'Play Southern Africa' }).click();
  await expectMinHeight(page.locator('.neighbor-input-row input'), 52);
  await expectMinHeight(page.locator('.neighbor-input-row .button'), 52);

  await page.goto('/#/profile');
  await expectMinHeight(page.locator('.profile-card .button').first(), 52);
});

test('reduced motion preserves direct Spatial presentation and Locations feedback semantics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await openSpatial(page, '/flags/africa');
  const transitionMs = await page.locator('.spatial-stage__surface > canvas').evaluate((node) => {
    const duration = getComputedStyle(node).transitionDuration.trim();
    if (duration.endsWith('ms')) return Number.parseFloat(duration);
    if (duration.endsWith('s')) return Number.parseFloat(duration) * 1000;
    return Number.POSITIVE_INFINITY;
  });
  expect(transitionMs).toBeLessThanOrEqual(0.01);

  await page.goto('/#/locations/africa/west-africa');
  await page.getByRole('button', { name: 'Learn West Africa' }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  const targetName = await page.locator('#map-prompt-heading').innerText();
  const targetId = await page.locator('.map-country[data-action="map-answer"]').evaluateAll((nodes, name) => {
    const target = nodes.find((node) => node.getAttribute('aria-label') === name);
    return target?.getAttribute('data-id') ?? null;
  }, targetName);
  const wrong = page.locator(`.map-country[data-action="map-answer"]:not([data-id="${targetId}"])`).first();
  await wrong.focus();
  await wrong.press('Enter');
  await expect(wrong).toHaveClass(/map-country--wrong-pulse/);
  await expect(wrong.locator('.map-country__shape, .map-country__locator, .map-country__marker, .map-country__callout-target').first()).toHaveCSS('animation-name', 'none');
});
