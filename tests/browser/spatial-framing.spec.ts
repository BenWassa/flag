import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Issue #199 — exact-production evidence for selected-scope framing and zoom bounds.
 *
 * Pure production geometry is audited across the full scope × viewport matrix by
 * `verify-spatial-framing.mjs`. These tests exercise the browser-owned parts of
 * the same contract: the camera actually receives that pose, projected #197
 * labels remain usable, wheel/pinch/drag keep route ownership intact, resize
 * retargets safely, and selected scopes cannot retreat to world-marble scale.
 *
 * Headless Chromium/SwiftShader is engineering evidence, not physical-device
 * evidence. Platform edge gestures remain a device acceptance concern.
 */

const STAGE = '.spatial-stage[data-ready="true"]';
const SURFACE = `${STAGE} .spatial-stage__surface`;
const CAMERA = `${SURFACE}[data-camera-distance]`;
const SELECTED_CLEARANCE_MULTIPLIER = 1.25;

test.setTimeout(120_000);

interface ScopeCase {
  id: string;
  label: string;
  path: string;
  /** Region routes keep their own projected label current. */
  currentLabel?: string;
}

const REQUIRED_SCOPES: readonly ScopeCase[] = [
  { id: 'africa', label: 'Africa', path: '/flags/africa' },
  { id: 'asia', label: 'Asia', path: '/flags/asia' },
  { id: 'north-america', label: 'North America', path: '/flags/north-america' },
  { id: 'south-america', label: 'South America', path: '/flags/south-america' },
  { id: 'oceania', label: 'Oceania', path: '/flags/oceania' },
  { id: 'caribbean', label: 'Caribbean', path: '/flags/north-america/caribbean', currentLabel: 'caribbean' },
  { id: 'middle-east', label: 'Middle East', path: '/flags/asia/middle-east', currentLabel: 'middle-east' },
  { id: 'caucasus', label: 'Caucasus', path: '/flags/asia/caucasus', currentLabel: 'caucasus' },
  { id: 'polynesia', label: 'Polynesia', path: '/flags/oceania/polynesia', currentLabel: 'polynesia' },
  { id: 'micronesia', label: 'Micronesia', path: '/flags/oceania/micronesia', currentLabel: 'micronesia' },
];

const VIEWPORTS = [
  { name: 'small-portrait', width: 320, height: 568 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'short-landscape', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

async function openSpatial(page: Page, path: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(`/#${path}`);
  await page.waitForSelector(CAMERA, { timeout: 30_000 });
}

async function cameraDistance(page: Page): Promise<number> {
  const value = await page.locator(CAMERA).getAttribute('data-camera-distance');
  const distance = Number(value);
  expect(Number.isFinite(distance), `finite production camera distance (${value})`).toBe(true);
  return distance;
}

async function stageCentre(page: Page): Promise<{ x: number; y: number }> {
  const box = await page.locator(SURFACE).boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function wheelOutToClamp(page: Page): Promise<number> {
  const centre = await stageCentre(page);
  await page.mouse.move(centre.x, centre.y);
  for (let step = 0; step < 12; step += 1) await page.mouse.wheel(0, 100);
  return cameraDistance(page);
}

async function expectScopeRelativeClamp(page: Page, initial: number, context: string) {
  const beforeUrl = page.url();
  const maximum = await wheelOutToClamp(page);
  expect(maximum, `${context} permits modest retreat`).toBeGreaterThan(initial);
  expect(
    (maximum - 1) / (initial - 1),
    `${context} maximum clearance is derived from its initial frame`,
  ).toBeCloseTo(SELECTED_CLEARANCE_MULTIPLIER, 2);
  expect(page.url(), `${context} wheel zoom does not own routing`).toBe(beforeUrl);

  // More zoom-out input cannot move past the derived ceiling.
  const centre = await stageCentre(page);
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.wheel(0, 500);
  expect(await cameraDistance(page), `${context} stays clamped`).toBeCloseTo(maximum, 3);

  // Zoom-in remains available from the bound.
  await page.mouse.wheel(0, -100);
  expect(await cameraDistance(page), `${context} still zooms in`).toBeLessThan(maximum);
}

async function expectProjectedLabelsUsable(page: Page, scope: ScopeCase) {
  const front = page.locator('.spatial-scope[data-facing="front"]');
  expect(await front.count(), `${scope.label} keeps at least one truthful projected label visible`).toBeGreaterThan(0);

  if (!scope.currentLabel) return;
  const current = page.locator(`.spatial-scope[data-scope-id="${scope.currentLabel}"][aria-current="true"]`);
  await expect(current, `${scope.label} current label remains projected`).toHaveAttribute('data-facing', 'front');
  const box = await current.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width, `${scope.label} label keeps practical touch width`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${scope.label} label keeps practical touch height`).toBeGreaterThanOrEqual(44);
}

async function captureStage(page: Page, testInfo: TestInfo, name: string) {
  await page.locator(STAGE).screenshot({ path: testInfo.outputPath(`issue-199-${name}.png`) });
}

test.describe('selected-scope camera contract', () => {
  test('required continent and region scopes stay large, labelled and scope-bounded on phone portrait', async ({ page }, testInfo) => {
    for (const scope of REQUIRED_SCOPES) {
      await openSpatial(page, scope.path, 390, 844);
      const initial = await cameraDistance(page);
      expect(initial, `${scope.label} initial camera clears the unit sphere`).toBeGreaterThan(1.05);
      expect(initial, `${scope.label} does not start at the old global marble bound`).toBeLessThan(4.2);
      await expectProjectedLabelsUsable(page, scope);
      await captureStage(page, testInfo, `${scope.id}-390x844`);
      await expectScopeRelativeClamp(page, initial, `${scope.label} at 390×844`);
    }
  });

  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}×${viewport.height} keeps broad and tiny selected geography usable`, async ({ page }, testInfo) => {
      // Africa exercises a broad continental frame; Polynesia exercises the
      // small-scope orienting floor and projected archipelago label.
      for (const scope of [REQUIRED_SCOPES[0], REQUIRED_SCOPES[8]]) {
        await openSpatial(page, scope.path, viewport.width, viewport.height);
        const initial = await cameraDistance(page);
        await expectProjectedLabelsUsable(page, scope);
        await captureStage(page, testInfo, `${scope.id}-${viewport.width}x${viewport.height}`);
        await expectScopeRelativeClamp(page, initial, `${scope.label} at ${viewport.width}×${viewport.height}`);
      }
    });
  }
});

test.describe('camera lifecycle and gesture ownership', () => {
  test('orientation/resize recomputes the selected frame and its zoom-out bound', async ({ page }) => {
    const scope = REQUIRED_SCOPES.find((item) => item.id === 'caucasus')!;
    await openSpatial(page, scope.path, 390, 844);
    const portrait = await cameraDistance(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(() => cameraDistance(page)).not.toBeCloseTo(portrait, 3);
    const landscape = await cameraDistance(page);
    await expectProjectedLabelsUsable(page, scope);
    await expectScopeRelativeClamp(page, landscape, 'Caucasus after portrait → landscape resize');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => cameraDistance(page)).toBeCloseTo(portrait, 3);
    await expect(page).toHaveURL(/#\/flags\/asia\/caucasus$/);
  });

  test('Back/Forward retargets the same camera without creating a navigation stack', async ({ page }) => {
    await openSpatial(page, '/flags/africa', 390, 844);
    const continentDistance = await cameraDistance(page);
    await page.locator('.spatial-chip', { hasText: 'West Africa' }).click();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect.poll(() => cameraDistance(page)).not.toBeCloseTo(continentDistance, 3);
    const regionDistance = await cameraDistance(page);

    await page.goBack();
    await expect(page).toHaveURL(/#\/flags\/africa$/);
    await expect.poll(() => cameraDistance(page)).toBeCloseTo(continentDistance, 3);

    await page.goForward();
    await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
    await expect.poll(() => cameraDistance(page)).toBeCloseTo(regionDistance, 3);
    await expect(page.locator('.spatial-scope[data-scope-id="west-africa"][aria-current="true"]')).toHaveAttribute('data-facing', 'front');
  });

  test('pinch, wheel and drag manipulate the camera but never the route', async ({ page }) => {
    await openSpatial(page, '/flags/oceania/micronesia', 390, 844);
    const url = page.url();
    const initial = await cameraDistance(page);
    const box = await page.locator(SURFACE).boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;

    // Synthetic touch PointerEvents exercise the production pinch owner. Move
    // the second finger inward: spread falls, so the camera dollies outward.
    await page.locator(SURFACE).evaluate((element, point) => {
      const fire = (type: string, pointerId: number, clientX: number, clientY: number) => {
        element.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId,
          pointerType: 'touch',
          isPrimary: pointerId === 1,
          clientX,
          clientY,
        }));
      };
      fire('pointerdown', 1, point.x - 45, point.y);
      fire('pointerdown', 2, point.x + 45, point.y);
      fire('pointermove', 2, point.x + 20, point.y);
      fire('pointerup', 2, point.x + 20, point.y);
      fire('pointerup', 1, point.x - 45, point.y);
    }, { x, y });
    expect(await cameraDistance(page), 'pinch-out retreat changes camera distance').toBeGreaterThan(initial);
    expect(page.url(), 'pinch does not navigate').toBe(url);

    const afterPinch = await cameraDistance(page);
    const maximum = await wheelOutToClamp(page);
    expect(maximum).toBeGreaterThanOrEqual(afterPinch);
    expect((maximum - 1) / (initial - 1)).toBeCloseTo(SELECTED_CLEARANCE_MULTIPLIER, 2);
    expect(page.url(), 'wheel does not navigate').toBe(url);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 80, y, { steps: 8 });
    await page.mouse.up();
    expect(page.url(), 'drag does not navigate').toBe(url);
  });

  test('reduced motion arrives directly at the selected scope and keeps the same clamp', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSpatial(page, '/flags', 390, 844);
    await page.locator('.spatial-chip', { hasText: 'Asia' }).click();
    await expect(page).toHaveURL(/#\/flags\/asia$/);
    const initial = await cameraDistance(page);
    await expectScopeRelativeClamp(page, initial, 'Asia under reduced motion');
  });

  test('Home/world retain their separate whole-globe/global zoom contract', async ({ page }) => {
    await openSpatial(page, '/', 320, 568);
    const homeInitial = await cameraDistance(page);
    const homeMaximum = await wheelOutToClamp(page);
    expect(homeMaximum, 'Home may recover/retain whole-globe distance').toBeGreaterThanOrEqual(homeInitial);

    await openSpatial(page, '/flags', 390, 844);
    const worldInitial = await cameraDistance(page);
    const worldMaximum = await wheelOutToClamp(page);
    expect(worldMaximum, 'world-level domain navigation keeps the established global ceiling').toBeGreaterThan(worldInitial);
    expect(worldMaximum).toBeCloseTo(4.2, 3);
    await expect(page).toHaveURL(/#\/flags$/);
  });
});
