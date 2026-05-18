import { defineConfig, devices } from '@playwright/test'

// Port 3109 is reserved for the PM2-managed `goodagent-tori-prototype` service
// and reverse-proxied by Caddy via `@tori` (see `infra/caddy/Caddyfile`). Picking
// 3109 here causes Playwright `webServer` to fail with EADDRINUSE every run.
// 3119 is intentionally far from production / supervised ports (3100 prod
// goodswap, 3109 tori) and was verified free at iter17 plan time.
const e2ePort = process.env.E2E_PORT ?? '3119'
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
  // CRITICAL: --dist-dir .next.e2e isolates Playwright's dev server build
  // artifacts from the production `.next/` directory used by PM2-managed
  // `goodswap`. Without this flag, `next dev` clobbers production chunks and
  // breaks the public site (recurrence #3 — see task 0029).
  webServer: process.env.SKIP_DEV_SERVER
    ? undefined
    : {
        command: `npx next dev -p ${e2ePort} --dist-dir .next.e2e`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
