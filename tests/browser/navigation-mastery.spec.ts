import { expect, test, type Page } from '@playwright/test';

const achievementKey = 'flag-atlas:earned-achievements:v1';

const mastered = {
  version: 1,
  regionDomainMasteries: ['west-africa:flags'],
  completeRegions: [],
  completeContinents: [],
  worldCrown: false,
};

const complete = {
  ...mastered,
  regionDomainMasteries: [
    'west-africa:flags',
    'west-africa:locations',
    'west-africa:outlines',
    'west-africa:neighbors',
  ],
  completeRegions: ['west-africa'],
};

async function seedAchievements(page: Page, value: typeof mastered) {
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), {
    key: achievementKey,
    state: value,
  });
}

async function disableWebGl(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (typeof type === 'string' && type.includes('webgl')) return null;
      return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test('Spatial controls expose Mastery in colour, shape and accessible text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAchievements(page, mastered);
  await page.goto('/#/flags/africa');
  await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30_000 });

  const westAfrica = page.locator('.spatial-chip', { hasText: 'West Africa' });
  await expect(westAfrica).toHaveClass(/spatial-chip--mastered/);
  await expect(westAfrica).toHaveAccessibleName(/West Africa.*cleared.*Mastered/i);
  await expect(westAfrica.locator('.spatial-chip__mark')).toHaveText('●');

  await westAfrica.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/West Africa.*Mastered/i);
  await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
});

test('complete-region semantics survive the short-landscape renderer fallback', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seedAchievements(page, complete);
  await disableWebGl(page);
  await page.goto('/#/flags/africa');

  await expect(page.locator('.spatial-shell')).toHaveCount(0);
  const westAfrica = page.locator('.region-row--complete .region-row__open', { hasText: 'West Africa' });
  await expect(westAfrica).toBeVisible();
  await expect(westAfrica.getByText('Complete', { exact: true })).toBeVisible();
  await expect(westAfrica).toHaveAccessibleName(/Play West Africa.*Complete.*flags.*cleared/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('unearned fallback rows remain quiet while retaining useful names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAchievements(page, { ...mastered, regionDomainMasteries: [] });
  await disableWebGl(page);
  await page.goto('/#/flags/africa');

  const westAfrica = page.locator('.region-row__open', { hasText: 'West Africa' });
  await expect(westAfrica).toHaveAccessibleName(/Play West Africa.*flags.*cleared/i);
  await expect(westAfrica).not.toHaveAccessibleName(/Mastered|Complete/i);
  await expect(westAfrica.locator('.region-row__state')).toHaveCount(0);
  await expect(westAfrica.locator('..')).not.toHaveClass(/region-row--mastered|region-row--complete/);
});
