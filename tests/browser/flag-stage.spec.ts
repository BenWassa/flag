import { expect, test, type Browser, type Page } from '@playwright/test';

// Issue #90: national flags have different intrinsic aspect ratios. The Flags
// question stage must keep the same geometry across all of them, so the answer
// buttons stay under the same part of the screen from question to question.
//
// Flags load from FlagCDN over the network, so these tests serve their own
// stand-in flags at chosen aspect ratios rather than depending on which country
// the round happens to pick.

const RATIOS = [
  { label: 'wide 2:1', width: 600, height: 300 },
  { label: 'standard 3:2', width: 600, height: 400 },
  { label: 'near-square 1:1', width: 600, height: 600 },
];

const VIEWPORTS = [
  { label: 'small portrait', width: 320, height: 568 },
  { label: 'tall portrait', width: 390, height: 844 },
];

function flagSvg(width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<rect width="${width}" height="${height}" fill="#2563eb"/></svg>`;
}

// Every country resolves to a different FlagCDN URL, but a stand-in flag is
// served for all of them — with caching off, so changing the ratio between
// measurements is not defeated by a cached response.
async function serveFlagsAt(page: Page, width: number, height: number) {
  await page.route('https://flagcdn.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'cache-control': 'no-store' },
      body: flagSvg(width, height),
    });
  });
}

async function startFlagsRound(page: Page) {
  await page.goto('/#/flags/africa');
  await page.getByRole('button', { name: 'Play West Africa' }).click();
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
}

// The stage is sized by CSS, but the image inside it settles a frame later —
// measure only once the browser has resolved the intrinsic ratio.
async function settleFlag(page: Page) {
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('.flag-stage .flag-image');
    return Boolean(image && image.complete && image.naturalWidth > 0);
  });
}

async function stageGeometry(page: Page) {
  const stage = await page.locator('.flag-stage').boundingBox();
  const answers = await page.locator('.answer-panel').boundingBox();
  const image = await page.locator('.flag-stage .flag-image').boundingBox();
  if (!stage || !answers || !image) throw new Error('Flags question stage did not render');
  return { stage, answers, image };
}

async function measureRatio(browser: Browser, viewport: { width: number; height: number }, ratio: typeof RATIOS[number]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  try {
    const page = await context.newPage();
    await serveFlagsAt(page, ratio.width, ratio.height);
    await startFlagsRound(page);
    await settleFlag(page);
    const { stage, answers, image } = await stageGeometry(page);

    // The flag itself is still shown whole, at its own ratio, never stretched
    // or cropped to fill the stage.
    expect(image.width / image.height).toBeCloseTo(ratio.width / ratio.height, 1);
    expect(image.height).toBeLessThanOrEqual(stage.height + 1);

    return { label: ratio.label, answersTop: answers.y, stageHeight: stage.height };
  } finally {
    await context.close();
  }
}

for (const viewport of VIEWPORTS) {
  test(`keeps the answer panel fixed across flag aspect ratios on ${viewport.label}`, async ({ browser }) => {
    const measured = [];
    for (const ratio of RATIOS) measured.push(await measureRatio(browser, viewport, ratio));

    const [first, ...rest] = measured;
    for (const other of rest) {
      expect(
        Math.abs(other.answersTop - first.answersTop),
        `${other.label} moved the answers against ${first.label}`,
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(other.stageHeight - first.stageHeight),
        `${other.label} resized the stage against ${first.label}`,
      ).toBeLessThanOrEqual(1);
    }
  });
}

test('keeps the stage geometry when the flag image fails to load', async ({ browser, page }) => {
  const loaded = await measureRatio(browser, { width: 390, height: 844 }, RATIOS[1]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://flagcdn.com/**', (route) => route.abort());
  await startFlagsRound(page);
  await expect(page.locator('.flag-frame--failed')).toBeVisible();
  const failedStage = await page.locator('.flag-stage').boundingBox();
  const failedAnswers = await page.locator('.answer-panel').boundingBox();
  if (!failedStage || !failedAnswers) throw new Error('Failed flag state did not render');

  expect(Math.abs(failedStage.height - loaded.stageHeight)).toBeLessThanOrEqual(1);
  expect(Math.abs(failedAnswers.y - loaded.answersTop)).toBeLessThanOrEqual(1);
});
