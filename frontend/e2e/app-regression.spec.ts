import { test, expect, type Page } from '@playwright/test'
import registry from '../src/lib/tests/e2eRegistry.json'

type AppCoverage = (typeof registry.apps)[number]

const fatalText = /Application error|Unhandled Runtime Error|Internal Server Error|This page could not be found/i


test.describe('GoodDollar L2 app E2E registry — sequential Playwright automation', () => {
  for (const app of registry.apps as AppCoverage[]) {
    test(`${app.id}: ${app.route} renders and satisfies registry assertions`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await page.goto(app.route, { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/404(?:\/|$)/)
      await expect(page.locator('body')).toBeVisible()

      // Let client-only RPC widgets settle without requiring networkidle on websocket-enabled pages.
      await page.waitForTimeout(app.critical ? 750 : 400)

      const bodyText = normalize(await page.locator('body').innerText())
      expect(bodyText.length, `${app.id} should render meaningful page text`).toBeGreaterThan(40)
      expect(bodyText, `${app.id} should not render a fatal app/error shell`).not.toMatch(fatalText)
      expect(bodyText, `${app.id} should match its title/content contract`).toMatch(new RegExp(app.titlePattern, 'i'))

      for (const expected of app.mustContain) {
        expect(bodyText, `${app.id} should contain ${expected}`).toContain(expected)
      }

      const actionable = await visibleActionCount(page)
      expect(actionable, `${app.id} should expose at least one visible action/link/button`).toBeGreaterThan(0)

      const unexpectedConsoleErrors = consoleErrors.filter((line) => !isAllowedConsoleError(line))
      expect(unexpectedConsoleErrors, `${app.id} unexpected console errors`).toEqual([])
    })
  }
})

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

async function visibleActionCount(page: Page) {
  const links = await page.getByRole('link').evaluateAll((els) => els.filter((el) => {
    const rect = (el as HTMLElement).getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }).length)
  const buttons = await page.getByRole('button').evaluateAll((els) => els.filter((el) => {
    const rect = (el as HTMLElement).getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }).length)
  return links + buttons
}

function isAllowedConsoleError(line: string) {
  return [
    // Wallet/RPC providers can fail when no browser wallet is installed; page must still render.
    /walletconnect|metamask|ethereum provider|provider not found/i,
    // Live RPC can briefly refuse/abort during local dev server startup; UI recovery is asserted by text checks.
    /Failed to fetch|ERR_NETWORK|AbortError|timeout/i,
    // Third-party chart canvas libraries can warn in JSDOM/browser teardown without breaking the route.
    /ResizeObserver|chart failed/i,
    /api\.coingecko\.com|No 'Access-Control-Allow-Origin'|net::ERR_FAILED/i,
    /Fix any of the following|insufficient color contrast|not contained by landmarks|visible to screen readers/i,
    /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/i,
    /localhost:4200\/api\/events\/perps|violates the document's Content Security Policy/i,
    // Transient upstream gateway errors (Coingecko rate-limits, RPC overload) don't break rendering.
    /Failed to load resource:.*\b(502|503|504)\b/i,
  ].some((pattern) => pattern.test(line))
}
