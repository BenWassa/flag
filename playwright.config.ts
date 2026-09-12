import { defineConfig, devices } from '@playwright/test';

const acceptanceDesktopTests = [
  'tests/browser/spatial-home-overlay.spec.ts',
  'tests/browser/spatial-home-matrix.spec.ts',
  'tests/browser/world-crown.spec.ts',
  'tests/browser/spatial-scope-selection.spec.ts',
  'tests/browser/spatial-framing.spec.ts',
  'tests/browser/spatial-marker-parity.spec.ts',
  'tests/browser/locations-three-strike.spec.ts',
  'tests/browser/locations-feedback-geometry.spec.ts',
  'tests/browser/locations-reduced-motion.spec.ts',
  'tests/browser/recognition-rounds.spec.ts',
  'tests/browser/flags-activity-viewport.spec.ts',
  'tests/browser/neighbors-suggestions-a11y.spec.ts',
];

const acceptanceMobileTests = [
  'tests/browser/spatial-home-overlay.spec.ts',
  'tests/browser/world-crown.spec.ts',
  'tests/browser/spatial-scope-selection.spec.ts',
  'tests/browser/spatial-framing.spec.ts',
  'tests/browser/locations-three-strike.spec.ts',
  'tests/browser/flags-activity-viewport.spec.ts',
];

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: {
      // Issue #119: the candidate needs a WebGL surface. Headless Chromium has
      // no GPU, so the suite runs against SwiftShader; that is engineering
      // evidence, never physical-device evidence.
      ...(process.env.ATLAS_CHROMIUM_PATH ? { executablePath: process.env.ATLAS_CHROMIUM_PATH } : {}),
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    {
      name: 'acceptance-desktop',
      testMatch: acceptanceDesktopTests,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'acceptance-mobile',
      testMatch: acceptanceMobileTests,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'acceptance-pwa-desktop',
      testMatch: ['tests/browser/pwa-runtime.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
