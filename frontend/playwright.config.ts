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
  // CRITICAL: NEXT_DIST_DIR=.next.e2e isolates Playwright's dev-server build
  // artifacts from the production `.next/` directory used by PM2-managed
  // `goodswap`. `next.config.js` reads `process.env.NEXT_DIST_DIR` and feeds
  // it into Next's `distDir` config, which IS honored by `next dev`.
  //
  // Why not `--dist-dir .next.e2e` on the CLI? Iter19 (task 0029) tried that;
  // Next 14.2.x's `next dev` rejects the flag with `unknown option`, so the
  // webServer silently failed and isolation was effectively off. See task
  // 0032 for the full forensics. The
  // `frontend/scripts/check-playwright-isolation.mjs` guard now refuses both
  // the legacy CLI flag (poison-pill) and a missing env var.
  webServer: process.env.SKIP_DEV_SERVER
    ? undefined
    : {
        command: `npx next dev -p ${e2ePort}`,
        env: {
          NEXT_DIST_DIR: '.next.e2e',
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
