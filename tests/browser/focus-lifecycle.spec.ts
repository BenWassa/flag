import { expect, test, type Locator, type Page } from '@playwright/test';

async function settleFocusFrame(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function expectBrowserOwnedFocus(page: Page) {
  await settleFocusFrame(page);
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName ?? null)).toBe('BODY');
}

async function expectFocused(locator: Locator) {
  await expect.poll(() => locator.evaluate((element) => element === document.activeElement)).toBe(true);
}

test('cold Home boot and Home reload leave focus under browser control', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Atlas', exact: true })).toBeVisible();
  await expectBrowserOwnedFocus(page);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Atlas', exact: true })).toBeVisible();
  await expectBrowserOwnedFocus(page);
});

test('cold deep link does not manufacture heading focus', async ({ page }) => {
  await page.goto('/#/flags/africa');
  const africa = page.getByRole('heading', { name: 'Africa', exact: true }).first();
  await expect(africa).toBeVisible();
  await expectBrowserOwnedFocus(page);
  await expect(africa).not.toBeFocused();
});

test('pointer navigation deliberately focuses the destination heading', async ({ page }) => {
  await page.goto('/');
  await expectBrowserOwnedFocus(page);
  await page.getByRole('button', { name: /^Flags,/ }).click();
  const heading = page.getByRole('heading', { name: 'Flags', exact: true }).first();
  await expect(heading).toBeVisible();
  await expectFocused(heading);
});

test('keyboard navigation deliberately focuses the destination heading', async ({ page }) => {
  await page.goto('/');
  await expectBrowserOwnedFocus(page);
  const neighbours = page.getByRole('button', { name: /^Neighbours,/ });
  await neighbours.focus();
  await neighbours.press('Enter');
  const heading = page.getByRole('heading', { name: 'Neighbours', exact: true }).first();
  await expect(heading).toBeVisible();
  await expectFocused(heading);
});

test('same-route Neighbours feedback restores the entry field', async ({ page }) => {
  await page.goto('/#/neighbors/africa/north-africa');
  await page.getByRole('button', { name: 'Play North Africa' }).click();
  const input = page.locator('#neighbor-country-input');
  await expect(input).toBeVisible({ timeout: 30_000 });
  await input.fill('Canada');
  const canada = page.getByRole('button', { name: /^Canada/ });
  await expect(canada).toBeVisible();
  await canada.click();
  await expect(page.getByText('Canada is not in this neighbour set.')).toBeVisible();
  await expectFocused(input);
});

test('same-route quiz advance restores an actionable answer control', async ({ page }) => {
  await page.goto('/#/flags/africa');
  await page.getByRole('button', { name: 'Play Africa' }).click();
  const firstAnswer = page.getByRole('button', { name: /^1\./ });
  await expect(firstAnswer).toBeVisible();
  await firstAnswer.click();
  await expect.poll(async () => page.locator('.quiz-count').innerText(), { timeout: 3_000 }).toContain('2');
  const nextFirstAnswer = page.getByRole('button', { name: /^1\./ });
  await expect(nextFirstAnswer).toBeEnabled();
  await expectFocused(nextFirstAnswer);
});

test('real Tab focus on an actionable control retains the visible focus ring', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit follows the platform default that does not Tab to buttons without Full Keyboard Access.');
  await page.goto('/');
  await expectBrowserOwnedFocus(page);
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return null;
    const style = getComputedStyle(element);
    return {
      tagName: element.tagName,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
  expect(focus).toEqual({
    tagName: 'BUTTON',
    outlineStyle: 'solid',
    outlineWidth: '3px',
    outlineColor: 'rgb(23, 73, 184)',
  });
});
