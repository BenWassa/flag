import { expect, test, type Page } from '@playwright/test';

const ROUTE = '/#/neighbors/africa/west-africa';

async function openNeighbours(page: Page) {
  await page.goto(ROUTE);
  await page.getByRole('button', { name: 'Play West Africa', exact: true }).click();
  await expect(page).toHaveURL(/#\/neighbors\/africa\/west-africa\/test$/);
  await expect(page.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeVisible({ timeout: 40_000 });
}

async function showKenyaSuggestion(page: Page) {
  const input = page.getByLabel('Country');
  await input.fill('Ken');
  const suggestion = page.getByRole('group', { name: 'Country suggestions' }).getByRole('button', { name: 'Kenya', exact: true });
  await expect(suggestion).toBeVisible();
  return { input, suggestion };
}

test.describe('Neighbours suggestion accessibility (#149)', () => {
  test('exact-production Chromium exposes an honest labelled-input/button-group accessibility tree and native keyboard path', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openNeighbours(page);
    const { input, suggestion } = await showKenyaSuggestion(page);

    await expect(input).not.toHaveAttribute('aria-autocomplete', /.+/);
    await expect(input).not.toHaveAttribute('aria-controls', /.+/);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.getByRole('option')).toHaveCount(0);

    const tree = await page.locator('.neighbor-entry').ariaSnapshot();
    expect(tree).toContain('searchbox "Country"');
    expect(tree).toContain('button "Submit"');
    expect(tree).toContain('group "Country suggestions"');
    expect(tree).toContain('button "Kenya"');
    expect(tree).not.toContain('combobox');
    expect(tree).not.toContain('listbox');
    expect(tree).not.toContain('option');

    await input.focus();
    await expect(page.locator('#app')).toHaveAttribute('data-neighbor-entry-active', 'true');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(suggestion).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Kenya is not in this neighbour set.', { exact: true })).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('phone portrait and short landscape keep the entry and suggestions usable without horizontal overflow', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await openNeighbours(page);
      const { input, suggestion } = await showKenyaSuggestion(page);
      await input.focus();
      await expect(input).toBeInViewport();
      await expect(suggestion).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.goto('about:blank');
    }
  });
});
