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

    // Africa is also named on the globe (#197); this matrix covers the command
    // surface, so it names that control rather than either at random.
    await page.locator('.spatial-chip', { hasText: 'Africa' }).click();
    await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('preserves typed hash navigation, browser Back/Forward, and cold-refresh fallback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Flags' }).click();
  await page.locator('.spatial-chip', { hasText: 'Africa' }).click();
  await page.getByRole('button', { name: 'Learn Africa' }).click();
  await expect(page).toHaveURL(/#\/flags\/africa\/learn$/);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/flags\/africa$/);
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Caucasus', exact: true })).toBeVisible();
});

test('keeps North America and Oceania live after complete continent coverage', async ({ page }) => {
  await page.goto('/#/locations');
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();

  const northAmerica = page.locator('.spatial-chip', { hasText: 'North America' });
  await expect(northAmerica).toBeVisible();
  await northAmerica.click();
  await expect(page).toHaveURL(/#\/locations\/north-america$/);
  await expect(page.getByRole('heading', { name: 'North America', exact: true })).toBeVisible();
  // Issue #166: the continent surface offers its own Play and every area as a
  // quiet selection control; the area's own Play appears once it is focused.
  await expect(page.getByRole('button', { name: 'Play North America' })).toBeVisible();
  for (const area of ['Northern America', 'Central America', 'Caribbean']) {
    await expect(page.locator('.spatial-chip', { hasText: area })).toBeVisible();
  }
  await page.locator('.spatial-chip', { hasText: 'Caribbean' }).click();
  await expect(page).toHaveURL(/#\/locations\/north-america\/caribbean$/);
  await expect(page.getByRole('button', { name: 'Play Caribbean' })).toBeVisible();

  // The stacked #22 + #27 curriculum deliberately completes every production
  // continent. Unavailable-shell behaviour is covered with a genuinely
  // unsupported synthetic scope in verify-action-feedback rather than making
  // a real production continent unavailable for this browser fixture.
  await page.goto('/#/locations');
  await expect(page.locator('.spatial-command[data-surface="continents"] .spatial-chip')).toHaveCount(6);
  await expect(page.locator('.continent-row--shell')).toHaveCount(0);
  await expect(page.getByText('Coming soon')).toHaveCount(0);

  const oceania = page.locator('.spatial-chip', { hasText: 'Oceania' });
  await expect(oceania).toBeVisible();
  await oceania.click();
  await expect(page).toHaveURL(/#\/locations\/oceania$/);
  await expect(page.getByRole('heading', { name: 'Oceania', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Oceania' })).toBeVisible();
  for (const area of ['Australia & New Zealand', 'Melanesia', 'Micronesia', 'Polynesia']) {
    await expect(page.locator('.spatial-chip', { hasText: area })).toBeVisible();
  }
  await page.locator('.spatial-chip', { hasText: 'Polynesia' }).click();
  await expect(page).toHaveURL(/#\/locations\/oceania\/polynesia$/);
  await expect(page.getByRole('button', { name: 'Play Polynesia' })).toBeVisible();

  // A directly typed durable Oceania scope now resolves to the real launcher.
  await page.goto('/#/locations/oceania');
  await expect(page).toHaveURL(/#\/locations\/oceania$/);
  await expect(page.getByRole('heading', { name: 'Oceania', exact: true })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Africa map could not be loaded' })).toBeVisible();

  // Chromium keeps a failed dynamic-import URL rejected for the lifetime of a
  // document. A reload is the user-visible recovery path; the loader itself
  // also drops its rejected promise so the next document can retry cleanly.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page).toHaveURL(/#\/locations\/africa\/test$/);
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  // Issue #166: the opening frame lands about 200ms later now that the
  // launcher route boots the globe first, and much later than that under a
  // loaded SwiftShader runner. Given the same allowance as the prompt above
  // it, rather than the 5s expect default.
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
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
