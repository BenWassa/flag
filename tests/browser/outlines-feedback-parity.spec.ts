import { expect, test } from '@playwright/test';

async function openOutlinesPlay(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/outlines/africa/west-africa');
  await page.getByRole('button', { name: /Play West Africa/i }).click();
  await expect(page.locator('.outline-stage')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('.round-score')).toBeVisible();
}

test('Outlines Play keeps feedback readable and live score visible', async ({ page }) => {
  test.setTimeout(90_000);
  await openOutlinesPlay(page);
  const before = await page.locator('.quiz-count').innerText();
  await page.locator('.answer-button').first().click();
  const feedback = page.locator('.answer-feedback');
  await expect(feedback).toBeVisible();
  const wrong = await feedback.evaluate((node) => node.classList.contains('answer-feedback--wrong'));
  await page.waitForTimeout(wrong ? 1000 : 400);
  await expect(page.locator('.quiz-count')).toHaveText(before);
  await expect(feedback).toBeVisible();
  await expect(page.locator('.quiz-count')).not.toHaveText(before, { timeout: wrong ? 1400 : 900 });
});

test('Outlines Play feedback remains functional with reduced motion', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOutlinesPlay(page);
  await page.locator('.answer-button').first().click();
  await expect(page.locator('.answer-feedback')).toBeVisible();
  await expect(page.locator('.round-score')).toBeVisible();
});
