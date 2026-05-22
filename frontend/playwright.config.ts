import { defineConfig, devices } from '@playwright/test'

// Port 3109 is reserved for the PM2-managed `goodagent-tori-prototype` service
// and reverse-proxied by Caddy via `@tori` (see `infra/caddy/Caddyfile`). Picking
// 3109 here causes Playwright `webServer` to fail with EADDRINUSE every run.
// 3119 is intentionally far from production / supervised ports (3100 prod
// goodswap, 3109 tori) and was verified free at iter17 plan time.
const e2ePort = process.env.E2E_PORT ?? '3119'
// Use 127.0.0.1 — next-runtime-server binds IPv4 only (0.0.0.0). Playwright's
// mobile-chrome and Node apiRequest resolve "localhost" to ::1 first on many
// hosts, causing ECONNREFUSED ::1:3119 while chromium still passes.
const e2eHost = process.env.E2E_HOST ?? '127.0.0.1'
const baseURL = process.env.BASE_URL ?? `http://${e2eHost}:${e2ePort}`
/** Full-suite gate uses production `next start` on `.next.e2e` (see scripts/e2e-web-server.mjs). */
const e2eProdServer = process.env.E2E_PROD_SERVER === '1'

export default defineConfig({
  testDir: './e2e',
  outputDir: '../.playwright-test-results/artifacts',
  // Autobuilder desktop screenshot captures; not part of the public-testnet gate.
  testIgnore: ['**/quick-screenshots.spec.ts'],
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
  // CRITICAL: NEXT_DIST_DIR=.next.e2e isolates Playwright build artifacts from
  // PM2-managed production `.next/`. Full suite (E2E_PROD_SERVER=1) runs
  // `next build` + `next start` via scripts/e2e-web-server.mjs so the server
  // does not die mid-run; dev-only mode uses `next dev` for short local runs.
  webServer: process.env.SKIP_DEV_SERVER
    ? undefined
    : {
        command: `node scripts/e2e-web-server.mjs -p ${e2ePort}`,
        env: {
          NEXT_DIST_DIR: '.next.e2e',
          ...(e2eProdServer ? { E2E_PROD_SERVER: '1' } : { E2E_DEV_SERVER: '1' }),
        },
        url: baseURL,
        // Production E2E must not reuse a stale server from a previous build;
        // otherwise HTML/chunk manifests can drift after build:e2e:force.
        reuseExistingServer: e2eProdServer ? false : !process.env.CI,
        timeout: e2eProdServer ? 600_000 : 120_000,
      },
})
