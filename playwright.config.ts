import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  outputDir: '.cache/playwright-results',
  reporter: [['list'], ['json', { outputFile: '.cache/playwright-results.json' }]],
  use: {
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'chrome' : undefined,
    baseURL: 'http://localhost:3043',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env['PLAYWRIGHT_EXTERNAL_SERVER']
    ? undefined
    : {
        command: 'npm run develop -- --host 127.0.0.1 --poll 1000',
        url: 'http://localhost:3043',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
