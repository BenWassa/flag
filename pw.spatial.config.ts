import { defineConfig, devices } from '@playwright/test';

/**
 * Issue #119 — spatial browser matrix.
 *
 * Separate from `playwright.config.ts` only because the spatial suite needs the
 * SwiftShader flags a WebGL surface requires under headless Chromium. It runs
 * the same production preview build as the conventional browser matrix.
 */
const executablePath = process.env.ATLAS_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'spatial-atlas.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
