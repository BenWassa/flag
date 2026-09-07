import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * Issue #207 — the live Flags activity owns the viewport.
 *
 * Flags used to be the one live quiz that kept the Spatial globe mounted above
 * it as inert context. The globe was answer-safe there — a flag cannot be read
 * off a map — but it was charging a repeated-recognition game a fixed share of a
 * phone screen for a backdrop that contributes nothing once the scope has been
 * chosen. It now yields through the same contract the map-native domains and
 * Flags Learn already used, so there is one stage-yielding mechanism and no
 * parallel hide-the-canvas path.
 *
 * These assertions are about what the freed space is worth: every answer within
 * reach without scrolling, the flag stage and answer geometry unmoved by flag
 * aspect ratio, and nothing about routing, scoring or the geography either side
 * of the round changed to buy it.
 *
 * Headless Chromium is engineering evidence, not physical-device evidence.
 */

test.setTimeout(120_000);

/** Phone portrait is authoritative; the last two are the sanity tiers. */
const VIEWPORTS = [
  { label: '320x568 small portrait', width: 320, height: 568, fitsWholePage: false },
  { label: '390x844 modern portrait', width: 390, height: 844, fitsWholePage: true },
  { label: '412x915 large portrait', width: 412, height: 915, fitsWholePage: true },
  { label: '844x390 short landscape', width: 844, height: 390, fitsWholePage: true },
  { label: '768x1024 tablet', width: 768, height: 1024, fitsWholePage: true },
];

/**
 * Representative intrinsic geometry, including the shape Nepal actually has:
 * a taller-than-wide pennant whose artwork does not fill its own box. It is
 * served as a genuine non-rectangular path rather than as a coloured rectangle,
 * because the point is that nothing in the layout may special-case it.
 */
const RATIOS = [
  { label: 'wide 2:1', width: 600, height: 300, shape: 'rect' as const },
  { label: 'standard 3:2', width: 600, height: 400, shape: 'rect' as const },
  { label: 'near-square 1:1', width: 600, height: 600, shape: 'rect' as const },
  { label: 'Nepal pennant 0.82:1', width: 492, height: 600, shape: 'pennant' as const },
];

function flagSvg({ width, height, shape }: { width: number; height: number; shape: 'rect' | 'pennant' }): string {
  const art = shape === 'pennant'
    ? `<path d="M0 0 L${width} ${height * 0.42} L${width * 0.42} ${height * 0.42} L${width * 0.86} ${height * 0.78} L0 ${height * 0.78} Z" fill="#dc143c" stroke="#003893" stroke-width="12"/>`
    : `<rect width="${width}" height="${height}" fill="#2563eb"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${art}</svg>`;
}

async function serveFlag(context: BrowserContext, ratio: typeof RATIOS[number]) {
  await context.route('https://flagcdn.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    headers: { 'cache-control': 'no-store' },
    body: flagSvg(ratio),
  }));
}

async function startRound(page: Page, scope = 'west-africa', label = 'West Africa') {
  await page.goto(`/#/flags/africa/${scope}`);
  await page.getByRole('button', { name: `Play ${label}` }).click();
  await expect(page.getByRole('progressbar', { name: 'Round progress' })).toBeVisible();
}

/** The stage is CSS-sized, but the image settles a frame later. */
async function settleFlag(page: Page, expected: number) {
  await page.waitForFunction((ratio) => {
    const image = document.querySelector<HTMLImageElement>('.flag-stage .flag-image');
    const frame = document.querySelector<HTMLElement>('.flag-stage .flag-frame');
    const published = frame ? Number.parseFloat(frame.style.getPropertyValue('--flag-ratio')) : Number.NaN;
    return Boolean(image && image.complete && image.naturalWidth > 0 && Math.abs(published - ratio) < 0.001);
  }, expected);
}

interface Geometry {
  stageMode: string | null;
  stageBoxHeight: number;
  flagStageHeight: number;
  flagStageTop: number;
  answersTop: number;
  lastAnswerBottom: number;
  imageRatio: number;
  imageHeight: number;
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
  shortestAnswer: number;
}

async function readGeometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const stage = document.querySelector('.flag-stage')!.getBoundingClientRect();
    const answers = document.querySelector('.answer-panel')!.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('.answer-button')];
    const image = document.querySelector('.flag-stage .flag-image')?.getBoundingClientRect();
    const spatialStage = document.querySelector('.spatial-stage');
    const root = document.documentElement;
    return {
      stageMode: document.querySelector('.spatial-shell')?.getAttribute('data-mode') ?? null,
      // Zero for a stage that has left the layout, not merely been made invisible.
      stageBoxHeight: spatialStage ? spatialStage.getBoundingClientRect().height : 0,
      flagStageHeight: stage.height,
      flagStageTop: stage.top,
      answersTop: answers.top,
      lastAnswerBottom: buttons[buttons.length - 1].getBoundingClientRect().bottom,
      imageRatio: image ? image.width / image.height : Number.NaN,
      imageHeight: image ? image.height : Number.NaN,
      scrollHeight: root.scrollHeight,
      clientHeight: root.clientHeight,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      shortestAnswer: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
    };
  });
}

async function phone(browser: Browser, viewport: { width: number; height: number }) {
  return browser.newContext({
    viewport,
    // The short-viewport tiers only apply where the pointer is coarse, which is
    // also what hides the physical-keyboard hint. Measuring without this reads a
    // layout no phone ever gets.
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    serviceWorkers: 'block',
  });
}

test.describe('the live Flags activity owns the viewport', () => {
  test('Play yields the stage entirely rather than keeping an inert strip', async ({ page }) => {
    await page.goto('/#/flags/africa/southern-africa');
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await page.getByRole('button', { name: 'Play Southern Africa' }).click();
    await page.waitForFunction(() => document.querySelector('.spatial-shell')?.getAttribute('data-mode') === 'yielded', null, { timeout: 30000 });

    // Out of the layout, not merely hidden — and no second navigation surface,
    // banner or map strip took its place above the question.
    await expect(page.locator('.spatial-stage')).toBeHidden();
    await expect(page.locator('.spatial-command')).toHaveCount(0);
    await expect(page.locator('.spatial-shell__panel')).toHaveCSS('overflow-y', 'visible');
    expect((await readGeometry(page)).stageBoxHeight).toBe(0);

    // The question starts at the top of the screen, not underneath something.
    const header = await page.locator('.quiz-header').boundingBox();
    expect(header!.y).toBeLessThan(48);
  });

  test('Learn keeps the screen it already owned', async ({ page }) => {
    await page.goto('/#/flags/africa');
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await page.getByRole('button', { name: 'Learn Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/learn$/);
    await expect(page.locator('.spatial-shell')).toHaveAttribute('data-mode', 'yielded');
    await expect(page.locator('.flag-gallery').first()).toBeVisible();
  });

  test('the geography returns for results and the round keeps its route', async ({ page }) => {
    await page.goto('/#/flags/africa/southern-africa');
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await page.getByRole('button', { name: 'Play Southern Africa' }).click();
    await expect(page).toHaveURL(/southern-africa\/test$/);

    for (let index = 0; index < 40; index += 1) {
      if (await page.locator('.spatial-shell').getAttribute('data-mode') === 'results') break;
      const option = page.locator('.answer-button:not([disabled])').first();
      if (await option.count() === 0) { await page.waitForTimeout(400); continue; }
      await option.click();
      await page.waitForTimeout(1200);
    }
    await expect(page.locator('.spatial-shell')).toHaveAttribute('data-mode', 'results');
    await expect(page.locator('.spatial-stage')).toBeVisible();

    // Exit lands back on the durable scope the round was started from.
    await page.getByRole('button', { name: /Back to Flags|Exit/ }).first().click();
    await expect(page).toHaveURL(/#\/flags\/africa\/southern-africa$/);
    await expect(page.locator('.spatial-shell')).toHaveAttribute('data-mode', 'focus');
  });

  test('exiting mid-round returns to the durable scope with the geography back', async ({ page }) => {
    // Reached the way a learner reaches it, so history holds the continent
    // behind the area rather than the blank page a deep link leaves behind.
    await page.goto('/#/flags/africa');
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await page.evaluate(() => { window.location.hash = '#/flags/africa/west-africa'; });
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await page.getByRole('button', { name: 'Play West Africa' }).click();
    await expect(page).toHaveURL(/west-africa\/test$/);

    await page.getByRole('button', { name: 'Exit quiz' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect(page.locator('.spatial-shell')).toHaveAttribute('data-mode', 'focus');
    await expect(page.locator('.spatial-stage')).toBeVisible();

    // Back and forward still walk the durable route, not the ephemeral round.
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await page.goForward();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
  });

  test('a refreshed live round still falls back to its stable scope', async ({ page }) => {
    await page.goto('/#/flags/africa/west-africa');
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await page.getByRole('button', { name: 'Play West Africa' }).click();
    await expect(page).toHaveURL(/west-africa\/test$/);
    await page.reload();
    await page.waitForSelector('.spatial-stage[data-ready="true"] canvas', { timeout: 30000 });
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect(page.locator('.spatial-shell')).toHaveAttribute('data-mode', 'focus');
  });

  test('renderer failure leaves the same full-screen Flags round', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/#/flags/africa');
    await page.getByRole('button', { name: 'Play West Africa' }).first().click();
    // No shell at all on this path, so the activity owns the viewport for the
    // same reason it does with the renderer: nothing is above it.
    await expect(page.locator('.spatial-shell')).toHaveCount(0);
    await expect(page.locator('.flag-stage')).toBeVisible();
    await expect(page.locator('.answer-button')).toHaveCount(4);
  });
});

test.describe('the freed viewport is a stable game board', () => {
  for (const viewport of VIEWPORTS) {
    test(`every answer is reachable without scrolling on ${viewport.label}`, async ({ browser }) => {
      const context = await phone(browser, viewport);
      try {
        await serveFlag(context, RATIOS[1]);
        const page = await context.newPage();
        await startRound(page);
        await settleFlag(page, RATIOS[1].width / RATIOS[1].height);
        const geometry = await readGeometry(page);

        expect(geometry.stageMode).toBe('yielded');
        expect(geometry.stageBoxHeight).toBe(0);
        // The whole unanswered question — header, flag and all four options —
        // sits inside the viewport. This is the assertion the inert globe strip
        // used to make impossible on a phone.
        expect(geometry.lastAnswerBottom).toBeLessThanOrEqual(viewport.height);
        // Answer controls keep at least the established standard control height.
        expect(geometry.shortestAnswer).toBeGreaterThanOrEqual(52);
        // Never sideways, at any tier.
        expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
        if (viewport.fitsWholePage) {
          // Nothing below the answers either: no reserved feedback area spills
          // past the fold on an ordinary phone.
          expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
        }
      } finally {
        await context.close();
      }
    });

    test(`flag aspect ratio never moves the answers on ${viewport.label}`, async ({ browser }) => {
      const measured: (Geometry & { label: string })[] = [];
      for (const ratio of RATIOS) {
        const context = await phone(browser, viewport);
        try {
          await serveFlag(context, ratio);
          const page = await context.newPage();
          await startRound(page);
          await settleFlag(page, ratio.width / ratio.height);
          const geometry = await readGeometry(page);
          // Whole artwork, at its own ratio: never stretched, cropped or
          // normalised to make it fit the reserved stage.
          expect(geometry.imageRatio).toBeCloseTo(ratio.width / ratio.height, 1);
          expect(geometry.imageHeight).toBeLessThanOrEqual(geometry.flagStageHeight + 1);
          measured.push({ ...geometry, label: ratio.label });
        } finally {
          await context.close();
        }
      }

      const [first, ...rest] = measured;
      for (const other of rest) {
        expect(Math.abs(other.answersTop - first.answersTop), `${other.label} moved the answers`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.flagStageTop - first.flagStageTop), `${other.label} moved the flag stage`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.flagStageHeight - first.flagStageHeight), `${other.label} resized the flag stage`).toBeLessThanOrEqual(1);
        expect(Math.abs(other.lastAnswerBottom - first.lastAnswerBottom), `${other.label} moved the last answer`).toBeLessThanOrEqual(1);
      }
    });
  }

  test('answering does not move the flag or the answers', async ({ browser }) => {
    const context = await phone(browser, { width: 390, height: 844 });
    try {
      await serveFlag(context, RATIOS[1]);
      const page = await context.newPage();
      await startRound(page);
      await settleFlag(page, 1.5);
      const before = await readGeometry(page);

      await page.locator('.answer-button').first().click();
      await expect(page.locator('.answer-feedback')).toBeVisible();
      const after = await readGeometry(page);

      // The feedback card is reserved permanently and floats over the reserve,
      // so its arrival resizes nothing above it.
      expect(Math.abs(after.flagStageTop - before.flagStageTop)).toBeLessThanOrEqual(1);
      expect(Math.abs(after.flagStageHeight - before.flagStageHeight)).toBeLessThanOrEqual(1);
      expect(Math.abs(after.answersTop - before.answersTop)).toBeLessThanOrEqual(1);
      expect(after.scrollHeight).toBe(before.scrollHeight);
    } finally {
      await context.close();
    }
  });

  test('reduced motion changes no layout semantics', async ({ browser }) => {
    const context = await phone(browser, { width: 390, height: 844 });
    try {
      await serveFlag(context, RATIOS[1]);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await startRound(page);
      await settleFlag(page, 1.5);
      const geometry = await readGeometry(page);
      expect(geometry.stageMode).toBe('yielded');
      expect(geometry.stageBoxHeight).toBe(0);
      expect(geometry.lastAnswerBottom).toBeLessThanOrEqual(844);
      expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
    } finally {
      await context.close();
    }
  });

  test('200% text zoom keeps every answer operable', async ({ browser }) => {
    const context = await phone(browser, { width: 390, height: 844 });
    try {
      await serveFlag(context, RATIOS[1]);
      const page = await context.newPage();
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.style.fontSize = '200%';
        });
      });
      await startRound(page);
      await settleFlag(page, 1.5);
      const geometry = await readGeometry(page);
      // Scrolling is allowed here; losing the answers sideways is not, and every
      // option must still be a real, full-height control.
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
      expect(geometry.shortestAnswer).toBeGreaterThanOrEqual(44);
      await expect(page.locator('.answer-button')).toHaveCount(4);
      await page.locator('.answer-button').first().click();
      await expect(page.locator('.answer-feedback')).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
