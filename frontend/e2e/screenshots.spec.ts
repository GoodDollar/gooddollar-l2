import { test } from '@playwright/test'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100'
const SCREENSHOT_DIR = path.resolve(__dirname, '../../.autobuilder/review-screenshots/baseline')

const VIEWPORTS = [
  { width: 375, height: 812, label: '375px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1440, height: 900, label: '1440px' },
] as const

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'swap', path: '/explore' },
  { name: 'perps', path: '/perps' },
  { name: 'perps-portfolio', path: '/perps/portfolio' },
  { name: 'perps-leaderboard', path: '/perps/leaderboard' },
  { name: 'predict', path: '/predict' },
  { name: 'predict-create', path: '/predict/create' },
  { name: 'predict-portfolio', path: '/predict/portfolio' },
  { name: 'lend', path: '/lend' },
  { name: 'stable', path: '/stable' },
  { name: 'stocks', path: '/stocks' },
  { name: 'stocks-portfolio', path: '/stocks/portfolio' },
  { name: 'portfolio', path: '/portfolio' },
  { name: 'pool', path: '/pool' },
  { name: 'bridge', path: '/bridge' },
  { name: 'yield', path: '/yield' },
  { name: 'governance', path: '/governance' },
  { name: 'governance-analytics', path: '/governance/analytics' },
  { name: 'agents', path: '/agents' },
  { name: 'agents-register', path: '/agents/register' },
  { name: 'ubi-impact', path: '/ubi-impact' },
  { name: 'explore', path: '/explore' },
  { name: 'test-dashboard', path: '/test-dashboard' },
] as const

test.describe('Responsive screenshots', () => {
  for (const viewport of VIEWPORTS) {
    for (const page of PAGES) {
      test(`${page.name} at ${viewport.label}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        })
        const tab = await context.newPage()

        await tab.goto(`${BASE_URL}${page.path}`, {
          waitUntil: 'networkidle',
          timeout: 15_000,
        }).catch(() => {
          // Page may not load if dev server is down; take screenshot anyway
        })

        await tab.waitForTimeout(1000)

        await tab.screenshot({
          path: path.join(SCREENSHOT_DIR, `${page.name}-${viewport.label}.png`),
          fullPage: true,
        })

        await context.close()
      })
    }
  }
})
