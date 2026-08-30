import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/deployment',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
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
