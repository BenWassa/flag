import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface StepEvidence {
  label: string;
  url: string;
  elapsedMs: number;
  activeElement: string | null;
}

async function snapshotStep(page: Page, label: string, startedAt: number): Promise<StepEvidence> {
  return {
    label,
    url: page.url(),
    elapsedMs: Math.round(performance.now() - startedAt),
    activeElement: await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      return element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 120) ?? element.tagName;
    }),
  };
}

async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(value, null, 2)),
    contentType: 'application/json',
  });
}

test('captures deterministic production navigation evidence for the H1 comparison', async ({ page }, testInfo) => {
  const startedAt = performance.now();
  const steps: StepEvidence[] = [];
  let actionCount = 0;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Atlas' })).toBeVisible();
  steps.push(await snapshotStep(page, 'home', startedAt));

  await page.getByRole('button', { name: 'Flags' }).click();
  actionCount += 1;
  await expect(page).toHaveURL(/#\/flags$/);
  await expect(page.getByRole('heading', { name: 'Flags' })).toBeVisible();
  steps.push(await snapshotStep(page, 'flags world/domain index', startedAt));

  await page.getByRole('button', { name: 'Africa' }).click();
  actionCount += 1;
  await expect(page).toHaveURL(/#\/flags\/africa$/);
  await expect(page.getByRole('heading', { name: /Africa flags launcher/ })).toBeVisible();
  steps.push(await snapshotStep(page, 'Africa launcher', startedAt));

  await page.getByRole('button', { name: 'Play West Africa' }).click();
  actionCount += 1;
  await expect(page).toHaveURL(/#\/flags\/africa\/west-africa\/test$/);
  steps.push(await snapshotStep(page, 'West Africa Play', startedAt));

  await page.goBack();
  await expect(page).toHaveURL(/#\/flags\/africa$/);
  steps.push(await snapshotStep(page, 'Back to Africa', startedAt));

  await page.goBack();
  await expect(page).toHaveURL(/#\/flags$/);
  steps.push(await snapshotStep(page, 'Back to world/domain', startedAt));

  await page.goForward();
  await expect(page).toHaveURL(/#\/flags\/africa$/);
  steps.push(await snapshotStep(page, 'Forward to Africa', startedAt));

  const timing = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      navigation: navigation ? {
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        loadMs: navigation.loadEventEnd,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
      } : null,
      resources: resources.map((resource) => ({
        name: new URL(resource.name).pathname,
        initiatorType: resource.initiatorType,
        durationMs: Math.round(resource.duration * 10) / 10,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
      })),
    };
  });

  await attachJson(testInfo, 'stage0-navigation.json', {
    evidenceClass: 'Playwright mobile viewport',
    finalBaseline: process.env.ATLAS_STAGE0_FINAL === '1',
    actionCountToWestAfricaPlay: actionCount,
    steps,
    timing,
  });
});

test('captures deep-link, ephemeral-round, focus and reduced-motion invariants', async ({ page }, testInfo) => {
  await page.goto('/#/flags/africa/west-africa');
  await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
  await expect(page.getByRole('heading', { name: /West Africa flags launcher/ })).toBeVisible();
  await expect(page.locator('[data-autofocus]').first()).toBeFocused();

  await page.reload();
  await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
  await expect(page.getByRole('heading', { name: /West Africa flags launcher/ })).toBeVisible();

  await page.goto('/#/flags/africa/west-africa/test');
  await expect(page).toHaveURL(/#\/flags\/africa\/west-africa$/);
  await expect(page.getByRole('heading', { name: /West Africa flags launcher/ })).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/flags');
  const africa = page.getByRole('button', { name: 'Africa' });
  await expect(africa).toBeVisible();
  const motion = await africa.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      transitionDuration: styles.transitionDuration,
      animationDuration: styles.animationDuration,
    };
  });

  await attachJson(testInfo, 'stage0-invariants.json', {
    evidenceClass: 'Playwright mobile viewport',
    finalBaseline: process.env.ATLAS_STAGE0_FINAL === '1',
    deepLink: 'pass',
    activeRoundColdLoadFallsBackToStableScope: 'pass',
    autofocus: 'pass',
    reducedMotion: motion,
  });

  expect(parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.01);
  expect(parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.01);
});
