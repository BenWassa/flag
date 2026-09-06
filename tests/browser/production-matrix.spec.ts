import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'phone portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 740, height: 360 },
] as const;

const scope = (page: Page, id: string) => page.locator(`.spatial-scope[data-scope-id="${id}"]`);

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

    await scope(page, 'africa').click();
    await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.spatial-chip')).toHaveCount(0);
  }
});

test('preserves typed hash navigation, browser Back/Forward, and cold-refresh fallback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Flags' }).click();
  await scope(page, 'africa').click();
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

  const northAmerica = scope(page, 'north-america');
  await expect(northAmerica).toBeAttached();
  await northAmerica.click();
  await expect(page).toHaveURL(/#\/locations\/north-america$/);
  await expect(page.getByRole('heading', { name: 'North America', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play North America' })).toBeVisible();
  for (const area of ['northern-america', 'central-america', 'caribbean']) {
    await expect(scope(page, area)).toBeAttached();
  }
  await scope(page, 'caribbean').click();
  await expect(page).toHaveURL(/#\/locations\/north-america\/caribbean$/);
  await expect(page.getByRole('button', { name: 'Play Caribbean' })).toBeVisible();

  // The production curriculum has all six continents; normal navigation is
  // geography-led and therefore presents six projected continent controls.
  await page.goto('/#/locations');
  await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30_000 });
  await expect(page.locator('.spatial-scopes .spatial-scope')).toHaveCount(6);
  await expect(page.locator('.spatial-chip')).toHaveCount(0);
  await expect(page.locator('.continent-row--shell')).toHaveCount(0);
  await expect(page.getByText('Coming soon')).toHaveCount(0);

  const oceania = scope(page, 'oceania');
  await expect(oceania).toBeAttached();
  await oceania.click();
  await expect(page).toHaveURL(/#\/locations\/oceania$/);
  await expect(page.getByRole('heading', { name: 'Oceania', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Oceania' })).toBeVisible();
  for (const area of ['australia-new-zealand', 'melanesia', 'micronesia', 'polynesia']) {
    await expect(scope(page, area)).toBeAttached();
  }
  await scope(page, 'polynesia').click();
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
    if (africaChunkRequests === 1) await route.abort();
    else await route.continue();
  });

  await page.goto('/#/locations/africa');
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Africa map could not be loaded' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Africa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Africa' }).click();
  await expect(page).toHaveURL(/#\/locations\/africa\/test$/);
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
  expect(africaChunkRequests).toBeGreaterThanOrEqual(1);
});

test('keeps focus, live feedback, and reduced-motion behaviour accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/flags/asia/caucasus/learn');
  const heading = page.getByRole('heading', { name: 'Caucasus' });
  await expect(heading).toBeVisible();
  // Current focus lifecycle: a cold deep link does not manufacture heading
  // focus. Keyboard focus moves only after the learner begins interacting.
  await expect(heading).not.toBeFocused();

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
