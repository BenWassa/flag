import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { loadOutlineAsset } from '../../src/data/outlines.js';
import { createInitialProgress } from '../../src/domain/progress.js';
import { buildQuiz } from '../../src/domain/quiz.js';
import { buildOutlineQuiz } from '../../src/domain/outline.js';
import type { Question, StudyScope } from '../../src/domain/models.js';

// Keep question selection deterministic while still exercising the production
// quiz builder. These are browser-fixture IDs, not application identifiers.
const FLAGS_SESSION_ID = 'browser-fixture-flags-caucasus';
const OUTLINES_SESSION_ID = 'browser-fixture-outlines-caucasus';
const CAUCASUS: StudyScope = { kind: 'region', id: 'caucasus', label: 'Caucasus' };

async function fixSessionId(page: Page, id: string) {
  await page.addInitScript(({ sessionId }) => {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: () => sessionId,
    });
  }, { sessionId: id });
}

function expectedFlagsQuestions(sessionId: string): Question[] {
  return buildQuiz({
    countries: COUNTRIES,
    progress: createInitialProgress(COUNTRIES),
    scope: CAUCASUS,
    mode: 'test',
    size: Number.MAX_SAFE_INTEGER,
    sessionId,
  });
}

async function expectedOutlineQuestions(sessionId: string): Promise<Question[]> {
  const asset = await loadOutlineAsset('caucasus');
  if (!asset) throw new Error('Caucasus outline fixture could not be loaded');
  return buildOutlineQuiz({
    countries: COUNTRIES,
    progress: createInitialProgress(COUNTRIES),
    scope: CAUCASUS,
    mode: 'test',
    size: Number.MAX_SAFE_INTEGER,
    sessionId,
    asset,
  });
}

async function openFlagsPlay(page: Page, sessionId = FLAGS_SESSION_ID) {
  await fixSessionId(page, sessionId);
  await page.goto('/#/flags/asia/caucasus');
  await page.getByRole('button', { name: 'Play Caucasus' }).click();
  await expect(page).toHaveURL(/#\/flags\/asia\/caucasus\/test$/);
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
}

async function openOutlinesPlay(page: Page, sessionId = OUTLINES_SESSION_ID) {
  await fixSessionId(page, sessionId);
  await page.goto('/#/outlines/asia/caucasus');
  await page.getByRole('button', { name: 'Play Caucasus' }).click();
  await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus\/test$/);
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
  await expect(page.locator('.outline-svg')).toBeVisible();
}

async function answerAll(page: Page, questions: Question[], wrongFirst = false) {
  for (const [index, question] of questions.entries()) {
    const answerIndex = wrongFirst && index === 0
      ? (question.correctIndex + 1) % question.optionCountryIds.length
      : question.correctIndex;
    await page.locator('.answer-button').nth(answerIndex).click();
    if (index < questions.length - 1) {
      await expect(page.locator('.quiz-count')).toHaveText(`${index + 2}/${questions.length}`);
    }
  }
  await expect(page.getByRole('heading', { name: 'Caucasus' })).toBeVisible();
  await expect(page.getByText(/(Flags|Outlines) · Round complete · Play/)).toBeVisible();
}

test.describe('Flags Play browser matrix (#96)', () => {
  test('completes a deterministic correct Play round and can repeat then exit', async ({ page }) => {
    const questions = expectedFlagsQuestions(FLAGS_SESSION_ID);
    await openFlagsPlay(page);
    await answerAll(page, questions);

    await expect(page.getByRole('region', { name: /3 of 3 correct, 100 percent/ })).toBeVisible();
    await expect(page.getByText('Perfect round', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();

    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus\/test$/);
    await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
    await page.getByRole('button', { name: 'Exit quiz' }).click();
    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus$/);
    await expect(page.getByRole('heading', { name: /Caucasus flags launcher/ })).toBeVisible();
  });

  test('records a wrong Play answer, reviews the mistake, and exits review', async ({ page }) => {
    const questions = expectedFlagsQuestions(FLAGS_SESSION_ID);
    await openFlagsPlay(page);
    await answerAll(page, questions, true);

    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
    const review = page.getByRole('button', { name: 'Review mistakes' });
    await expect(review).toBeVisible();
    await review.click();
    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus\/review$/);
    await expect(page.getByRole('heading', { name: 'Caucasus' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exit quiz' })).toBeVisible();
    await page.getByRole('button', { name: 'Exit quiz' }).click();
    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus$/);
  });

  test('falls back to the stable launcher after refreshing an active route and reloads saved evidence', async ({ page }) => {
    const questions = expectedFlagsQuestions(FLAGS_SESSION_ID);
    await openFlagsPlay(page);
    await page.locator('.answer-button').nth(questions[0].correctIndex).click();
    await page.reload();

    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus$/);
    await expect(page.getByRole('heading', { name: /Caucasus flags launcher/ })).toBeVisible();
    await expect(page.getByRole('img', { name: '1 of 3 cleared' }).last()).toBeVisible();
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('flag-atlas:progress:v1') ?? '{}'));
    const target = COUNTRIES.find((country) => country.id === questions[0].countryId);
    expect(target).toBeTruthy();
    expect(persisted.records?.[target!.id]?.lifetimeCorrect).toBe(1);
  });
});

test.describe('Outlines Play browser matrix (#97)', () => {
  test('completes a deterministic correct Play round and can repeat then exit', async ({ page }) => {
    const questions = await expectedOutlineQuestions(OUTLINES_SESSION_ID);
    await openOutlinesPlay(page);
    await answerAll(page, questions);

    await expect(page.getByRole('region', { name: /3 of 3 correct, 100 percent/ })).toBeVisible();
    await expect(page.getByText('Perfect round', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus\/test$/);
    await expect(page.locator('.outline-svg')).toBeVisible();
    await page.getByRole('button', { name: 'Exit outline quiz' }).click();
    await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus$/);
  });

  test('records a wrong Play answer, reviews the mistake, and exits review', async ({ page }) => {
    const questions = await expectedOutlineQuestions(OUTLINES_SESSION_ID);
    await openOutlinesPlay(page);
    await answerAll(page, questions, true);

    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
    await page.getByRole('button', { name: 'Review mistakes' }).click();
    await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus\/review$/);
    await expect(page.getByRole('heading', { name: 'Caucasus' })).toBeVisible();
    await page.getByRole('button', { name: 'Exit outline quiz' }).click();
    await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus$/);
  });

  test('keeps the silhouette answer-safe and supports number selection with focus restoration', async ({ page }) => {
    await fixSessionId(page, OUTLINES_SESSION_ID);
    await page.goto('/#/outlines/asia/caucasus');
    await page.getByRole('button', { name: 'Learn Asia' }).click();
    await expect(page).toHaveURL(/#\/outlines\/asia\/learn$/);
    await expect(page.locator('.outline-svg')).toBeVisible();

    const silhouette = page.locator('.outline-svg');
    await expect(silhouette).toHaveAttribute('role', 'img');
    await expect(silhouette).toHaveAttribute('aria-label', 'Country silhouette to identify');
    const silhouetteLabel = await silhouette.getAttribute('aria-label');
    expect(silhouetteLabel).not.toMatch(/Armenia|Azerbaijan|Georgia/);

    const first = page.locator('.answer-button').first();
    await expect(first).toBeFocused();
    await page.keyboard.press('1');
    await expect(page.locator('.answer-feedback, .answer-button--correct, .answer-button--wrong').first()).toBeVisible();
    // The continuation control is the only answer-safe focus target after a
    // Learn response. Advancing to the next question must restore focus to its
    // first answer, which protects keyboard users from landing on the body.
    await page.locator('[data-autofocus]').first().click();
    await expect(page.locator('.quiz-count')).toHaveText('2/10');
    await expect(page.locator('.answer-button').first()).toBeFocused();
  });

  test('falls back to the stable launcher after refreshing an active route', async ({ page }) => {
    await openOutlinesPlay(page);
    await page.reload();
    await expect(page).toHaveURL(/#\/outlines\/asia\/caucasus$/);
    await expect(page.getByRole('heading', { name: /Caucasus outlines launcher/ })).toBeVisible();
  });
});
