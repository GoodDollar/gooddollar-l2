import { defineConfig, devices } from '@playwright/test'

const e2ePort = process.env.E2E_PORT ?? '3109'
const baseURL = process.env.BASE_URL ?? `http://localhost:${e2ePort}`

export default defineConfig({
  testDir: './e2e',
  outputDir: '../.playwright-test-results/artifacts',
  // Public-testnet release gates run one route after another for deterministic evidence.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: '../.playwright-test-results/app-regression.json' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: process.env.SKIP_DEV_SERVER
    ? undefined
    : {
        command: `npx next dev -p ${e2ePort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
