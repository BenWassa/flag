// #235 temporary exact-production diagnostic. Remove once we can classify the
// browser scheduling failure; it is NOT a replacement for the real-touch gate.
import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { auditFrame, openLocationsScope } from './helpers/locations-audit.js';

test.setTimeout(90_000);

async function installInputTrace(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type RecordItem = { name: string; at: number; detail?: string };
    const events: RecordItem[] = [];
    (window as Window & { __atlasIsolation?: RecordItem[] }).__atlasIsolation = events;
    for (const name of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'click']) {
      document.addEventListener(name, (event) => {
        const target = event.target instanceof Element
          ? event.target.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? event.target.tagName
          : 'unknown';
        events.push({ name, at: performance.now(), detail: target });
      }, true);
    }
  });
}

async function measureAfterInteraction(page: Page, label: string, firstCount?: string) {
  await page.evaluate(() => {
    const events = (window as Window & { __atlasIsolation?: { name: string; at: number; detail?: string }[] }).__atlasIsolation;
    if (!events) return;
    events.push({ name: 'probe-scheduled', at: performance.now() });
    window.queueMicrotask(() => events.push({ name: 'microtask-fired', at: performance.now() }));
    window.setTimeout(() => events.push({ name: 'timeout-fired', at: performance.now() }), 300);
    let frames = 0;
    const next = (at: number) => {
      frames += 1;
      if (frames <= 3 || frames === 15 || frames === 45) events.push({ name: 'frame-' + frames, at });
      if (frames < 60) window.requestAnimationFrame(next);
    };
    window.requestAnimationFrame(next);
  });
  await page.waitForTimeout(1_800);
  const result = await page.evaluate(() => ({
    trace: (window as Window & { __atlasIsolation?: { name: string; at: number; detail?: string }[] }).__atlasIsolation ?? [],
    now: performance.now(),
    visible: document.visibilityState,
    count: document.querySelector('.map-round-count')?.textContent ?? null,
    feedback: document.querySelector('.map-prompt__status, .answer-feedback')?.textContent ?? null,
  }));
  console.log('Locations #235 isolated browser probe:', JSON.stringify({ label, firstCount, ...result }));
  expect(result.trace.some((entry) => entry.name === 'timeout-fired'), label + ': timers run after touch').toBe(true);
  expect(result.trace.some((entry) => entry.name === 'frame-15'), label + ': successive frames run after touch').toBe(true);
  if (firstCount) expect(result.count, label + ': the accepted answer advances').not.toBe(firstCount);
}

async function quickCountryPoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const point = await page.evaluate((countryId) => {
    const eligible = [...document.querySelectorAll<SVGElement>(
      `[data-action="map-answer"][data-id="${countryId}"]`,
    )];
    for (const item of eligible) {
      const box = item.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      for (let row = 0; row < 12; row += 1) {
        for (let col = 0; col < 12; col += 1) {
          const x = box.x + box.width * ((col + 0.5) / 12);
          const y = box.y + box.height * ((row + 0.5) / 12);
          if (document.elementFromPoint(x, y)?.closest('[data-action="map-answer"]')?.getAttribute('data-id') === countryId) return { x, y };
        }
      }
    }
    return null;
  }, id);
  expect(point, `A tap must be owned by ${id} without the exhaustive frame audit`).toBeTruthy();
  return point!;
}

async function runMapTouch(page: Page, withFullAudit: boolean): Promise<void> {
  await installInputTrace(page);
  await openLocationsScope(page, '/#/locations/africa/west-africa', 'Learn West Africa', { width: 390, height: 844 });
  const prompt = await page.locator('#map-prompt-heading').innerText();
  const country = COUNTRIES.find((item) => item.name === prompt);
  expect(country).toBeTruthy();
  const point = withFullAudit
    ? (await auditFrame(page)).countries.find((item) => item.id === country!.id)?.actionablePoint ?? null
    : await quickCountryPoint(page, country!.id);
  expect(point).toBeTruthy();
  const count = await page.locator('.map-round-count').innerText();
  await page.touchscreen.tap(point!.x, point!.y);
  await expect(page.locator('.map-prompt__status--correct'), 'the tap must be accepted').toBeVisible({ timeout: 3_000 });
  await measureAfterInteraction(page, withFullAudit ? 'Locations+full-audit' : 'Locations+quick-point', count);
}

test('plain touchscreen tap does not suspend Chromium timers or frames', async ({ page }) => {
  test.skip(!test.info().project.name.includes('mobile'));
  await installInputTrace(page);
  await page.goto('about:blank');
  await page.setContent('<button id="probe" style="width:120px;height:64px">Tap here</button>');
  const box = (await page.locator('#probe').boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await measureAfterInteraction(page, 'plain-button');
});

test('touchscreen launch on Atlas preserves browser timers', async ({ page }) => {
  test.skip(!test.info().project.name.includes('mobile'));
  await installInputTrace(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/locations/africa/west-africa');
  const button = page.getByRole('button', { name: 'Learn West Africa' });
  await expect(button).toBeVisible();
  const box = (await button.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await measureAfterInteraction(page, 'Atlas-launch');
});

test('quick country-point touchscreen answer has functioning timers', async ({ page }) => {
  test.skip(!test.info().project.name.includes('mobile'));
  await runMapTouch(page, false);
});

test('full-audit country-point touchscreen answer has functioning timers', async ({ page }) => {
  test.skip(!test.info().project.name.includes('mobile'));
  await runMapTouch(page, true);
});
