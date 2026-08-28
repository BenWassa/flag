import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './experiments/spatial-continuity',
  testMatch: 'stage0-baseline.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Pixel 7'],
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    // Sandboxes and CI images that ship their own Chromium can point at it
    // without the harness pinning a machine-specific path into the repo.
    launchOptions: process.env.ATLAS_CHROMIUM_PATH
      ? { executablePath: process.env.ATLAS_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
