import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.ATLAS_FIREBASE_ORIGIN ?? 'https://atlas-3c48a.web.app';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'firebase-hosting.spec.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
