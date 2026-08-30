import { expect, test, type Page } from '@playwright/test';

/**
 * Issue #119 — Spatial Atlas browser regression.
 *
 * These cover what only a real renderer can answer: that the stage boots, that
 * geography and DOM controls reach the same place, that history still works
 * through the shell, that the stage yields where the contract says it must, and
 * that a device without WebGL still gets a complete Atlas.
 *
 * Headless Chromium is engineering evidence, not physical-device evidence. GPU
 * frame pacing, thermals, battery and platform edge gestures remain owner
 * acceptance items.
 */

const STAGE = '.spatial-stage[data-ready="true"] canvas';

// Booting a WebGL surface under SwiftShader, then walking twenty-four
// domain/continent frames, is slower than the suite default allows.
test.setTimeout(120_000);

async function openSpatial(page: Page, path: string) {
  await page.goto(`/#${path}`);
  await page.waitForSelector(STAGE, { timeout: 30000 });
}

async function stageMode(page: Page) {
  return page.locator('.spatial-shell').getAttribute('data-mode');
}

/**
 * Continents and areas are the same control at every level of the spatial
 * interface: a quiet chip whose accessible name also carries its progress, so
 * each is addressed by its visible label rather than by an exact name match.
 */
function scopeChip(page: Page, name: string) {
  return page.locator('.spatial-chip', { hasText: name });
}

test.describe('persistent spatial shell', () => {
  test('boots at world level and keeps one canvas across navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));

    await openSpatial(page, '/');
    expect(await stageMode(page)).toBe('world');
    const first = await page.locator('.spatial-stage__surface canvas').count();
    expect(first).toBe(1);

    await page.getByRole('button', { name: /^Flags/ }).first().click();
    await expect(page).toHaveURL(/#\/flags$/);
    expect(await stageMode(page)).toBe('world');

    await scopeChip(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    expect(await stageMode(page)).toBe('focus');

    // One scene for the whole traversal: the stage is a substrate, not a screen.
    expect(await page.locator('.spatial-stage__surface canvas').count()).toBe(1);
    expect(errors).toEqual([]);
  });

  test('native Back and Forward walk the same spatial hierarchy', async ({ page }) => {
    await openSpatial(page, '/flags');
    await scopeChip(page, 'Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await scopeChip(page, 'West Africa').click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);

    await page.goBack();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    expect(await stageMode(page)).toBe('focus');
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags$/);
    expect(await stageMode(page)).toBe('world');
    await page.goForward();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    expect(await stageMode(page)).toBe('focus');
  });

  test('a cold deep link initialises at its destination without replaying ancestry', async ({ page }) => {
    await openSpatial(page, '/neighbors/oceania/melanesia');
    expect(await stageMode(page)).toBe('focus');
    await expect(page.locator('.spatial-stage__caption')).toContainText('Melanesia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Melanesia');
  });

  test('every continent is reachable and framed in all four domains', async ({ page }) => {
    for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
      for (const continent of ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania']) {
        await openSpatial(page, `/${domain}/${continent}`);
        expect(await stageMode(page), `${domain}/${continent}`).toBe('focus');
        await expect(page.locator('.spatial-stage__caption')).not.toBeEmpty();
      }
    }
  });
});

test.describe('geography and DOM parity', () => {
  test('tapping a country resolves to the same route as its DOM control', async ({ page }) => {
    await openSpatial(page, '/flags');
    const surface = page.locator('.spatial-stage__surface');
    const box = (await surface.boundingBox())!;
    // The globe opens framed on Africa, so the centre of the stage is African land.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/#\/flags\/(africa|europe|asia)$/);

    const viaGeography = page.url();
    await page.goBack();
    await expect(page).toHaveURL(/#\/flags$/);
    const continent = viaGeography.split('/').pop()!;
    const label = { africa: 'Africa', europe: 'Europe', asia: 'Asia' }[continent]!;
    await scopeChip(page, label).click();
    expect(page.url()).toBe(viaGeography);
  });

  test('a drag rotates without navigating', async ({ page }) => {
    await openSpatial(page, '/flags');
    const box = (await page.locator('.spatial-stage__surface').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(page).toHaveURL(/#\/flags$/);
  });
});

test.describe('activities own the screen', () => {
  test('a Flags round keeps geography as inert context and returns to it', async ({ page }) => {
    await openSpatial(page, '/flags/africa/southern-africa');
    await page.getByRole('button', { name: 'Play Southern Africa' }).click();
    expect(await stageMode(page)).toBe('context');
    // No scope highlighting and no pointer target while a question is live.
    await expect(page.locator('.spatial-stage[data-mode="context"] .spatial-stage__surface')).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('.spatial-command')).toHaveCount(0);
    await expect(page.locator('.spatial-stage__caption')).toHaveCount(0);

    for (let index = 0; index < 40; index += 1) {
      if (await stageMode(page) === 'results') break;
      const option = page.locator('.answer-button:not([disabled])').first();
      // Play mode disables the options during its feedback dwell, so an empty
      // selection means "still resolving", not "round over".
      if (await option.count() === 0) { await page.waitForTimeout(400); continue; }
      await option.click();
      await page.waitForTimeout(1200);
    }
    expect(await stageMode(page)).toBe('results');
    await expect(page.locator('.spatial-stage__caption')).toContainText('Southern Africa');
  });

  test('map-native domains yield the stage entirely', async ({ page }) => {
    for (const [domain, expected] of [['locations', 'Find'], ['outlines', 'Which country'], ['neighbors', 'neighbour']] as const) {
      await openSpatial(page, `/${domain}/africa/southern-africa`);
      await page.getByRole('button', { name: 'Play Southern Africa' }).click();
      await page.waitForFunction(() => document.querySelector('.spatial-shell')?.getAttribute('data-mode') === 'yielded', null, { timeout: 30000 });
      expect(await stageMode(page), domain).toBe('yielded');
      // The stage is not merely hidden: it is out of the layout entirely, so the
      // activity gets the same viewport it has without the spatial shell.
      await expect(page.locator('.spatial-stage')).toBeHidden();
      await expect(page.locator('body')).toContainText(new RegExp(expected, 'i'));
    }
  });

  test('Learn runs in every domain and yields the stage', async ({ page }) => {
    // Flags Learn is a scrolling gallery; the geography domains open their own
    // surfaces. All four take the whole screen, so none competes with the globe.
    await openSpatial(page, '/flags/africa');
    await page.getByRole('button', { name: 'Learn Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/learn$/);
    expect(await stageMode(page)).toBe('yielded');
    await expect(page.locator('.flag-gallery').first()).toBeVisible();

    for (const domain of ['locations', 'outlines', 'neighbors']) {
      await openSpatial(page, `/${domain}/africa/southern-africa`);
      // Learn follows the framed scope, exactly as Play does.
      await page.getByRole('button', { name: 'Learn Southern Africa' }).click();
      await page.waitForFunction(() => document.querySelector('.spatial-shell')?.getAttribute('data-mode') === 'yielded', null, { timeout: 30000 });
      expect(await stageMode(page), domain).toBe('yielded');
    }
  });

  test('a refreshed round route falls back to its stable scope', async ({ page }) => {
    await openSpatial(page, '/flags/africa/southern-africa');
    await page.getByRole('button', { name: 'Play Southern Africa' }).click();
    await expect(page).toHaveURL(/southern-africa\/test$/);
    await page.reload();
    await page.waitForSelector(STAGE, { timeout: 30000 });
    await expect(page).toHaveURL(/#\/flags\/africa\/southern-africa$/);
    expect(await stageMode(page)).toBe('focus');
  });
});

test.describe('accessibility and resilience', () => {
  test('the canvas is not an accessibility surface and every action has a control', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    await expect(page.locator('.spatial-stage__surface canvas')).toHaveAttribute('aria-hidden', 'true');
    // Keyboard reaches the real controls without passing through the canvas.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe('CANVAS');
    // The framed scope offers Play immediately, without another page.
    await expect(page.getByRole('button', { name: 'Play Africa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Learn Africa' })).toBeVisible();
    // Every area a geography tap could select is also a real control.
    for (const region of ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa']) {
      await expect(scopeChip(page, region)).toBeVisible();
    }
    // Reachable and operable by keyboard, and it selects rather than starting a
    // round: choosing a place and playing it stay separate, deliberate acts.
    await scopeChip(page, 'East Africa').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/flags\/africa\/east-africa$/);
    await expect(page.getByRole('button', { name: 'Play East Africa' })).toBeVisible();
  });

  test('reduced motion arrives at the destination without animating', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSpatial(page, '/flags');
    await page.addInitScript(() => {
      (window as unknown as { __frames: number }).__frames = 0;
    });
    await scopeChip(page, 'Asia').click();
    await expect(page).toHaveURL(/#\/flags\/asia$/);
    expect(await stageMode(page)).toBe('focus');
  });

  test('the stage stops asking for frames once it settles', async ({ page }) => {
    await page.addInitScript(() => {
      const target = window as unknown as { __frames: number };
      target.__frames = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        target.__frames += 1;
        return original(callback);
      };
    });
    await openSpatial(page, '/flags/africa');
    await page.waitForTimeout(2500);
    const settled = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
    await page.waitForTimeout(1500);
    const idle = await page.evaluate(() => (window as unknown as { __frames: number }).__frames);
    // A handful of frames may still come from unrelated DOM work; a render loop
    // would add roughly sixty a second.
    expect(idle - settled).toBeLessThan(12);
  });

  test('a device without WebGL still gets a complete Atlas', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/#/flags/africa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Africa');
    await expect(page.locator('.spatial-shell')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Play West Africa' })).toBeVisible();
    await page.getByRole('button', { name: 'Play West Africa' }).first().click();
    await expect(page).toHaveURL(/west-africa/);
  });

  test('a lost WebGL context recovers rather than leaving a dead canvas', async ({ page }) => {
    await openSpatial(page, '/flags/africa');
    const lost = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('.spatial-stage__surface canvas');
      const context = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
      const extension = (context as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context');
      if (!extension) return 'unavailable';
      extension.loseContext();
      setTimeout(() => extension.restoreContext(), 100);
      return 'lost';
    });
    if (lost === 'unavailable') test.skip(true, 'WEBGL_lose_context is unavailable in this runner.');
    await page.waitForTimeout(1200);
    await expect(page.locator('.spatial-stage__surface')).not.toHaveAttribute('data-context-lost', 'true');
    // The framed scope's own Play, which is what this surface offers.
    await expect(page.getByRole('button', { name: 'Play Africa' })).toBeVisible();
  });
});

test.describe('layout matrix', () => {
  const viewports = [
    { name: 'small portrait', width: 320, height: 568 },
    { name: 'pixel portrait', width: 412, height: 915 },
    { name: 'tablet portrait', width: 768, height: 1024 },
    { name: 'short landscape', width: 844, height: 390 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} keeps geography and controls usable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openSpatial(page, '/flags/africa');

      const stage = (await page.locator('.spatial-stage').boundingBox())!;
      expect(stage.height).toBeGreaterThan(120);
      expect(stage.width).toBeLessThanOrEqual(viewport.width);

      // The primary control is reachable without horizontal scrolling.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      const play = page.getByRole('button', { name: 'Play Africa' });
      await expect(play).toBeVisible();

      // Issue #166: Play is on screen when the scope is focused. Reaching it
      // must not need a scroll, and no launcher page sits under the globe.
      // Playwright's boundingBox is {x, y, width, height} — no bottom/top.
      const playBox = (await play.boundingBox())!;
      expect(playBox.y + playBox.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(playBox.y).toBeGreaterThanOrEqual(-1);
      await expect(page.locator('.page--launcher')).toHaveCount(0);

      // ...and so is a live question, with its answers fully on screen.
      await play.click();
      await expect(page.locator('.answer-button').first()).toBeVisible();
      const quiz = await page.evaluate(() => {
        const answers = [...document.querySelectorAll('.answer-button')].map((element) => element.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          clipped: answers.some((rect) => rect.right > window.innerWidth + 1 || rect.left < -1),
          count: answers.length,
        };
      });
      expect(quiz.count).toBeGreaterThan(0);
      expect(quiz.clipped).toBe(false);
      expect(quiz.overflow).toBeLessThanOrEqual(1);
    });
  }
});
