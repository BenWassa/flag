import { expect, test } from '@playwright/test';

const EARNED_WORLD = {
  version: 1,
  regionDomainMasteries: [],
  completeRegions: [],
  completeContinents: [],
  worldCrown: true,
};

const VIEWPORTS = [
  { label: 'phone portrait', width: 390, height: 844 },
  { label: 'short landscape', width: 844, height: 390 },
];

test('an unearned World Crown adds no routine Crown decoration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-world-crown-earned]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'World Crown' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Modes' })).toBeVisible();
});

for (const viewport of VIEWPORTS) {
  test(`earned World Crown is visible and usable on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript((state) => {
      localStorage.setItem('flag-atlas:earned-achievements:v1', JSON.stringify(state));
    }, EARNED_WORLD);
    await page.goto('/');

    const crown = page.locator('[data-world-crown-earned]');
    await expect(crown).toBeVisible();
    await expect(page.getByRole('heading', { name: 'World Crown' })).toBeVisible();
    await expect(page.getByText('Earned · all six continents complete')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modes' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flags/i })).toBeVisible();

    const layout = await page.evaluate(() => {
      const crown = document.querySelector('[data-world-crown-earned]')!.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        crownLeft: crown.left,
        crownRight: crown.right,
        viewportWidth: window.innerWidth,
      };
    });
    expect(layout.horizontalOverflow).toBe(false);
    expect(layout.crownLeft).toBeGreaterThanOrEqual(0);
    expect(layout.crownRight).toBeLessThanOrEqual(layout.viewportWidth);
  });
}
