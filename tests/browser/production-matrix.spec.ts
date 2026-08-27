import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'phone portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 740, height: 360 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(overflow.documentWidth, `document overflows ${overflow.viewport}px viewport`).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(overflow.bodyWidth, `body overflows ${overflow.viewport}px viewport`).toBeLessThanOrEqual(overflow.viewport + 1);
}

test('keeps Home and domain launchers usable without horizontal overflow', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Flags' }).click();
    await expect(page.getByRole('heading', { name: 'Flags' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Africa' }).click();
    await expect(page.getByRole('heading', { name: /Africa flags launcher/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('preserves typed hash navigation, browser Back/Forward, and cold-refresh fallback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Flags' }).click();
  await page.getByRole('button', { name: 'Africa' }).click();
  await page.getByRole('button', { name: 'Learn Africa' }).click();
  await expect(page).toHaveURL(/#\/flags\/africa\/learn$/);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/flags\/africa$/);
  await expect(page.getByRole('heading', { name: /Africa flags launcher/ })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#\/flags\/africa\/learn$/);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();

  // A directly typed stable Learn route remains usable on a new document.
  await page.goto('/#/flags/asia/caucasus/learn');
  await expect(page.getByRole('heading', { name: 'Caucasus', exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/#\/flags\/asia\/caucasus\/learn$/);
  await expect(page.getByRole('heading', { name: 'Caucasus', exact: true })).toBeVisible();

  // Active rounds are ephemeral; a cold refresh deliberately returns to the
  // stable scope rather than pretending that the in-memory round survived.
  await page.goto('/#/flags/asia/caucasus/test');
  await expect(page).toHaveURL(/#\/flags\/asia\/caucasus$/);
  await expect(page.getByRole('heading', { name: /Caucasus flags launcher/ })).toBeVisible();
});

test('keeps North America live while unsupported continent shells stay honest', async ({ page }) => {
  await page.goto('/#/locations');
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();

  const northAmerica = page.getByRole('button', { name: 'North America' });
  await expect(northAmerica).toBeVisible();
  await northAmerica.click();
  await expect(page).toHaveURL(/#\/locations\/north-america$/);
  await expect(page.getByRole('heading', { name: /North America locations launcher/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Northern America' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Central America' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Caribbean' })).toBeVisible();

  await page.goto('/#/locations');
  const oceania = page.locator('.continent-row--shell').filter({ hasText: 'Oceania' });
  await expect(oceania).toBeVisible();
  await expect(oceania.getByText('Coming soon')).toBeVisible();
  await expect(oceania.getByRole('button')).toHaveCount(0);

  // Direct links to genuinely unsupported curriculum normalise back to the honest index.
  await page.goto('/#/locations/oceania');
  await expect(page).toHaveURL(/#\/locations$/);
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
});

test('reports a failed lazy map load and recovers on retry', async ({ page }) => {
  let africaChunkRequests = 0;
  await page.route(/\/assets\/africa-[^/]+\.js$/, async (route) => {
    africaChunkRequests += 1;
    // The launcher prewarms the continent once. Fail that request and the
    // first launch, then allow the explicit retry through.
    if (africaChunkRequests === 1) await route.abort();
    else await route.continue();
  });

  await page.goto('/#/locations/africa');
  await expect(page.getByRole('heading', { name: /Africa locations launcher/ })).toBeVisible();
  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Africa map could not be loaded' })).toBeVisible();

  // Chromium keeps a failed dynamic-import URL rejected for the lifetime of a
  // document. A reload is the user-visible recovery path; the loader itself
  // also drops its rejected promise so the next document can retry cleanly.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Africa locations launcher/ })).toBeVisible();
  await page.getByRole('button', { name: 'Play All Africa' }).click();
  await expect(page).toHaveURL(/#\/locations\/africa\/test$/);
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true');
  expect(africaChunkRequests).toBeGreaterThanOrEqual(1);
});

test('keeps focus, live feedback, and reduced-motion behaviour accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/flags/asia/caucasus/learn');
  await expect(page.getByRole('heading', { name: 'Caucasus' })).toBeVisible();
  await expect(page.locator('[data-autofocus]').first()).toBeFocused();

  const firstFlag = page.locator('.flag-card').first();
  await expect(firstFlag).toHaveAttribute('aria-expanded', 'false');
  await firstFlag.focus();
  await expect(firstFlag).toBeFocused();
  await firstFlag.press('Enter');
  await expect(firstFlag).toHaveAttribute('aria-expanded', 'true');
  await expect(firstFlag.locator('[data-flag-name]')).not.toHaveText('');

  await page.getByRole('button', { name: 'Reveal all' }).click();
  await expect(page.locator('.visually-hidden[role="status"]')).toHaveText('All country names revealed.');

  await page.goto('/#/flags');
  await expect(page.getByRole('button', { name: 'Play world' })).toBeVisible();
  const motion = await page.getByRole('button', { name: 'Play world' }).evaluate((element) => {
    const styles = getComputedStyle(element);
    return { transitionDuration: styles.transitionDuration, animationDuration: styles.animationDuration };
  });
  expect(parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.01);
  expect(parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.01);
});
