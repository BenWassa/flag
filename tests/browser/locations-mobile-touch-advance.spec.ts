// #235: Exact-production mobile touchscreen acceptance. The learner uses real
// Playwright touch input rather than focusing SVG elements or dispatching clicks.
import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';
import { auditFrame, openLocationsScope } from './helpers/locations-audit.js';

test.setTimeout(90_000);

const CASES = [
  { activity: 'Learn', route: '/#/locations/africa/west-africa', label: 'Learn West Africa', viewport: { width: 390, height: 844 } },
  { activity: 'Play', route: '/#/locations/north-america/caribbean', label: 'Play Caribbean', viewport: { width: 844, height: 390 } },
] as const;

async function currentTarget(page: Page) {
  const name = await page.locator('#map-prompt-heading').innerText();
  const country = COUNTRIES.find((item) => item.name === name);
  expect(country, `known country target: ${name}`).toBeTruthy();
  return country!;
}

async function fingerPoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  // The true-scale Caribbean panel owns touch input while it is visible.
  const insetHit = page.locator(`.map-inset__hit[data-action="map-answer"][data-id="${id}"]`).first();
  if (await insetHit.count()) {
    const box = await insetHit.boundingBox();
    expect(box, `${id} inset is visible at phone size`).not.toBeNull();
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  }

  const frame = await auditFrame(page);
  const point = frame.countries.find((entry) => entry.id === id)?.actionablePoint;
  expect(point, `${id} has a real tappable pixel on the phone viewport`).toBeTruthy();
  return point!;
}

// This diagnostic is intentionally limited to Locations' known feedback
// dwell timers. It distinguishes an accepted tap whose timer is never queued,
// one cancelled by route/state lifecycle, and a timer whose callback is starved.
async function installTouchTimerTrace(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Event = { event: string; id?: number; delay?: number; at: number };
    const events: Event[] = [];
    const win = window as Window & { __atlasTouchTimerTrace?: Event[] };
    win.__atlasTouchTimerTrace = events;
    const realSet = window.setTimeout.bind(window);
    const realClear = window.clearTimeout.bind(window);
    const pending = new Set<number>();
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (typeof handler !== 'function' || ![620, 700, 850, 1500].includes(Number(delay))) {
        return realSet(handler, delay, ...args);
      }
      const id = realSet(() => {
        pending.delete(id);
        events.push({ event: 'fire', id, delay, at: performance.now() });
        handler(...args);
      }, delay);
      pending.add(id);
      events.push({ event: 'schedule', id, delay, at: performance.now() });
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (id !== undefined && pending.delete(id)) events.push({ event: 'clear', id, at: performance.now() });
      return realClear(id);
    }) as typeof window.clearTimeout;
    // Probe timer and frame scheduling at document bootstrap, while the app is
    // still loading. By the time a round opens this baseline should have fired.
    window.setTimeout(() => events.push({ event: 'boot-timer-fire', at: performance.now() }), 250);
    window.requestAnimationFrame(() => events.push({ event: 'boot-frame-fire', at: performance.now() }));
  });
}

for (const fixture of CASES) {
  test(`${fixture.activity} accepts a finger tap and advances exactly once on a phone`, async ({ page }) => {
    test.skip(!test.info().project.name.includes('mobile'), 'A mobile touchscreen is the product acceptance surface.');

    await installTouchTimerTrace(page);
    await openLocationsScope(page, fixture.route, fixture.label, fixture.viewport);
    const target = await currentTarget(page);
    const point = await fingerPoint(page, target.id);
    const owner = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)
      ?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null, point);
    expect(owner, `${target.id} owns the finger's touch-down pixel`).toBe(target.id);

    const counter = page.locator('.map-round-count');
    const firstCount = await counter.innerText();
    await page.touchscreen.tap(point.x, point.y);

    // The accepted-answer feedback precedes the 620ms question transition.
    await expect(page.locator('.map-prompt__status--correct, .answer-feedback--correct').first(),
      'finger tap is accepted by the normal scoring path').toBeVisible({ timeout: 2_000 });
    // The probe is independent of the quiz timer. If it also never fires, the
    // browser event loop is starved, rather than only the Locations controller.
    await page.evaluate(() => {
      const events = (window as Window & { __atlasTouchTimerTrace?: { event: string; at: number }[] }).__atlasTouchTimerTrace;
      window.queueMicrotask(() => events?.push({ event: 'post-tap-microtask-fire', at: performance.now() }));
      window.requestAnimationFrame(() => events?.push({ event: 'post-tap-frame-fire', at: performance.now() }));
      window.setTimeout(() => {
        events?.push({ event: 'independent-probe-fire', at: performance.now() });
      }, 1_000);
    });
    try {
      await expect(counter, 'the accepted touch advances the round').not.toHaveText(firstCount, { timeout: 10_000 });
    } catch (error) {
      const diagnostics = await page.evaluate(() => ({
        now: performance.now(),
        visible: document.visibilityState,
        heading: document.querySelector('#map-prompt-heading')?.textContent,
        count: document.querySelector('.map-round-count')?.textContent,
        feedback: document.querySelector('.map-prompt__status, .answer-feedback')?.textContent,
        timers: (window as Window & { __atlasTouchTimerTrace?: unknown[] }).__atlasTouchTimerTrace ?? [],
      }));
      console.log('Locations #235 real touch timer diagnostics:', JSON.stringify(diagnostics));
      throw error;
    }

    const secondCount = await counter.innerText();
    const secondTarget = await currentTarget(page);
    expect(secondTarget.id).not.toBe(target.id);
    await page.waitForTimeout(1_800);
    await expect(counter, 'one tap must not advance a second time').toHaveText(secondCount);
    await expect(page.locator('#map-prompt-heading')).toHaveText(secondTarget.name);
  });
}
