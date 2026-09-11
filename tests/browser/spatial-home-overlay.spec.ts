import { expect, test, type Page } from '@playwright/test';

/** Issue #187 — exact-production Home composition regression. */
const STAGE = '.spatial-stage[data-ready="true"] canvas';
const MODE_NAMES = ['Flags', 'Locations', 'Outlines', 'Neighbours'] as const;

test.setTimeout(120_000);

async function openHome(page: Page) {
  await page.goto('/#/');
  await page.waitForSelector(STAGE, { timeout: 30_000 });
  await expect(page.locator('.spatial-command[data-surface="domains"]')).toBeVisible();
}

function modeButton(page: Page, name: typeof MODE_NAMES[number]) {
  return page.getByRole('button', { name: new RegExp(`^${name}, \\d+ of \\d+ cleared$`) });
}

async function modeBoxes(page: Page) {
  const boxes = [];
  for (const name of MODE_NAMES) boxes.push((await modeButton(page, name).boundingBox())!);
  return boxes;
}

test.describe('Spatial Home overlay', () => {
  test('390x844 is globe-first with a screen header and separate 2x2 mode tiles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const stage = (await page.locator('.spatial-stage').boundingBox())!;
    const chooser = (await page.locator('.spatial-command[data-surface="domains"]').boundingBox())!;
    const boxes = await modeBoxes(page);

    expect(stage.width).toBeGreaterThanOrEqual(389);
    expect(stage.height).toBeGreaterThanOrEqual(843);
    expect(Math.abs(chooser.x + chooser.width / 2 - 195)).toBeLessThanOrEqual(2);
    expect(Math.abs(chooser.y + chooser.height / 2 - 422)).toBeLessThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'Modes' })).toHaveCount(0);

    expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(2);
    expect(Math.abs(boxes[2].y - boxes[3].y)).toBeLessThanOrEqual(2);
    expect(boxes[0].x).toBeLessThan(boxes[1].x);
    expect(boxes[0].y).toBeLessThan(boxes[2].y);

    for (const name of MODE_NAMES) {
      const button = modeButton(page, name);
      await expect(button).toBeVisible();
      const icon = button.locator('.spatial-mode__mark');
      const size = (await icon.boundingBox())!;
      expect(size.width).toBeGreaterThanOrEqual(40);
      expect(size.height).toBeGreaterThanOrEqual(40);
    }

    const layout = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      chooserOverflow: document.querySelector<HTMLElement>('.spatial-command[data-surface="domains"]')!.scrollHeight
        - document.querySelector<HTMLElement>('.spatial-command[data-surface="domains"]')!.clientHeight,
    }));
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(layout.chooserOverflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0);
  });

  test('individual mode surfaces stay opaque Atlas chrome as the globe moves behind them', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const modes = page.locator('.spatial-mode');
    const surface = async () => modes.evaluateAll((elements) => {
      const element = elements[0];
      const style = getComputedStyle(element);
      const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
      const probe = document.createElement('span');
      probe.style.color = canvas;
      document.body.append(probe);
      const canvasColour = getComputedStyle(probe).color;
      probe.remove();
      return {
        backgrounds: elements.map((mode) => getComputedStyle(mode).backgroundColor),
        canvas: canvasColour,
        image: style.backgroundImage,
        backdrop: style.backdropFilter,
        webkitBackdrop: (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? '',
      };
    });

    const initial = await surface();
    expect(new Set(initial.backgrounds)).toEqual(new Set([initial.canvas]));
    expect(initial.image).toBe('none');
    expect(['', 'none']).toContain(initial.backdrop);
    expect(['', 'none']).toContain(initial.webkitBackdrop);

    const stage = page.locator('.spatial-stage__surface');
    const box = (await stage.boundingBox())!;
    const drags = [
      { dx: box.width * 0.34, dy: 0 },
      { dx: -box.width * 0.58, dy: box.height * 0.08 },
    ];
    const backgrounds = [...initial.backgrounds];
    await page.screenshot({ path: test.info().outputPath('home-material-default.png') });
    for (let index = 0; index < drags.length; index += 1) {
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width * 0.5 + drags[index].dx,
        box.y + box.height * 0.5 + drags[index].dy,
        { steps: 12 },
      );
      await page.mouse.up();
      await page.waitForTimeout(250);
      backgrounds.push(...(await surface()).backgrounds);
      await page.screenshot({ path: test.info().outputPath(`home-material-rotated-${index + 1}.png`) });
    }
    expect(new Set(backgrounds)).toEqual(new Set([initial.canvas]));
  });

  test('all four modes use the authoritative route and Back restores Home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const routes = ['flags', 'locations', 'outlines', 'neighbors'] as const;
    for (let index = 0; index < MODE_NAMES.length; index += 1) {
      await modeButton(page, MODE_NAMES[index]).click();
      await expect(page).toHaveURL(new RegExp(`#/${routes[index]}$`));
      if (index === 0) {
        const command = (await page.locator('.spatial-command').boundingBox())!;
        const stage = (await page.locator('.spatial-stage').boundingBox())!;
        expect(command.y).toBeLessThan(stage.y);
        const labelSize = await page.locator('.spatial-scope').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
        expect(labelSize).toBeGreaterThanOrEqual(16);
      }
      await page.goBack();
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.spatial-command[data-surface="domains"]')).toBeVisible();
    }

    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/#\/profile$/);
    await page.goBack();
    await expect(page.locator('.spatial-command[data-surface="domains"]')).toBeVisible();
  });

  test('scope actions make Play dominant and place it directly below the selected region name', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    await page.goto('/#/flags/africa/west-africa');
    await page.waitForSelector(STAGE, { timeout: 30_000 });

    const heading = (await page.getByRole('heading', { name: 'West Africa' }).boundingBox())!;
    const play = page.getByRole('button', { name: 'Play West Africa' });
    const learn = page.getByRole('button', { name: 'Learn West Africa' });
    const playBox = (await play.boundingBox())!;
    const learnBox = (await learn.boundingBox())!;
    expect(playBox.y).toBeGreaterThanOrEqual(heading.y + heading.height);
    expect(playBox.height).toBeGreaterThan(learnBox.height);
    await expect(play).toHaveCSS('font-size', '18px');
    await expect(learn).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('cold Home stays focus-neutral, then keyboard reaches Profile and modes in logical order', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const initial = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim(),
    }));
    expect(['BODY', 'HTML']).toContain(initial.tag);
    expect(initial.text).not.toBe('Atlas');

    const expected = [
      page.getByRole('button', { name: 'Profile' }),
      modeButton(page, 'Flags'),
      modeButton(page, 'Locations'),
      modeButton(page, 'Outlines'),
      modeButton(page, 'Neighbours'),
    ];
    for (const control of expected) {
      await page.keyboard.press('Tab');
      await expect(control).toBeFocused();
    }

    const outline = await modeButton(page, 'Neighbours').evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test('844x390 keeps the full globe and all four modes in one compact row', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openHome(page);

    const stage = (await page.locator('.spatial-stage').boundingBox())!;
    const chooser = (await page.locator('.spatial-command[data-surface="domains"]').boundingBox())!;
    const boxes = await modeBoxes(page);

    expect(stage.width).toBeGreaterThanOrEqual(843);
    expect(stage.height).toBeGreaterThanOrEqual(389);
    expect(chooser.y).toBeGreaterThanOrEqual(0);
    expect(chooser.y + chooser.height).toBeLessThanOrEqual(390);
    expect(Math.max(...boxes.map((box) => box.y)) - Math.min(...boxes.map((box) => box.y))).toBeLessThanOrEqual(2);
    expect(boxes[0].x).toBeLessThan(boxes[1].x);
    expect(boxes[1].x).toBeLessThan(boxes[2].x);
    expect(boxes[2].x).toBeLessThan(boxes[3].x);
  });

  test('narrow effective zoom viewport reflows without horizontal clipping', async ({ page }) => {
    // A 390x844 phone at 200% browser zoom exposes roughly half the CSS-pixel
    // viewport. Exercise that reflow boundary directly rather than pretending
    // emulation is evidence of physical-device feel.
    await page.setViewportSize({ width: 195, height: 422 });
    await openHome(page);

    const boxes = await modeBoxes(page);
    expect(Math.max(...boxes.map((box) => box.x)) - Math.min(...boxes.map((box) => box.x))).toBeLessThanOrEqual(2);
    for (const name of MODE_NAMES) {
      const button = modeButton(page, name);
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('chooser exists before WebGL readiness and renderer failure still exposes conventional Home', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route(/\/assets\/stage-controller-[^/]+\.js$/, async (route) => {
      await gate;
      await route.continue();
    });

    try {
      await page.goto('/#/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.spatial-command[data-surface="domains"]')).toBeVisible();
      await expect(page.locator('.spatial-stage')).not.toHaveAttribute('data-ready', 'true');
    } finally {
      release();
    }
    await expect(page.locator('.spatial-stage')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });

    const fallback = await page.context().newPage();
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (typeof type === 'string' && type.includes('webgl')) return null;
        return (original as unknown as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await fallback.goto('/#/');
    await expect(fallback.locator('.spatial-shell')).toHaveCount(0);
    await expect(fallback.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible();
    await expect(fallback.getByRole('button', { name: 'Profile' })).toBeVisible();
    for (const name of MODE_NAMES) await expect(fallback.getByRole('button', { name: new RegExp(name, 'i') }).first()).toBeVisible();
    await fallback.close();
  });

  test('forced colours uses a solid DOM chooser and Home does not start an idle render loop', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto('/#/');
    const chooser = page.locator('.spatial-command[data-surface="domains"]');
    await expect(chooser).toBeVisible();
    await expect(page.locator('.spatial-stage')).toBeHidden();
    const background = await chooser.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    for (const name of MODE_NAMES) await expect(modeButton(page, name)).toBeVisible();

    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForSelector(STAGE, { timeout: 30_000 });
    await page.evaluate(() => {
      const target = window as unknown as { __homeFrames: number };
      target.__homeFrames = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        target.__homeFrames += 1;
        return original(callback);
      };
    });
    await page.waitForTimeout(2_000);
    const settled = await page.evaluate(() => (window as unknown as { __homeFrames: number }).__homeFrames);
    await page.waitForTimeout(1_500);
    const idle = await page.evaluate(() => (window as unknown as { __homeFrames: number }).__homeFrames);
    expect(idle - settled).toBeLessThan(12);
  });
});
