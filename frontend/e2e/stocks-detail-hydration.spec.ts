import { test, expect } from '@playwright/test'

test.describe('Stocks detail hydration stability', () => {
  test('stocks detail does not emit hydration mismatch errors', async ({ page }) => {
    const hydrationSignals: string[] = []

    page.on('console', (msg) => {
      const text = msg.text()
      const looksLikeHydrationIssue =
        text.includes('Text content did not match')
        || text.includes('Text content does not match server-rendered HTML')
        || text.includes('There was an error while hydrating this Suspense boundary')
        || text.includes('Switched to client rendering')

      if (looksLikeHydrationIssue) {
        hydrationSignals.push(`console:${msg.type()}:${text}`)
      }
    })

    page.on('pageerror', (error) => {
      const text = String(error)
      if (
        text.includes('Text content does not match server-rendered HTML')
        || text.includes('error while hydrating this Suspense boundary')
      ) {
        hydrationSignals.push(`pageerror:${text}`)
      }
    })

    await page.goto('/stocks/AAPL')
    await expect(page.getByRole('heading', { name: 'AAPL', exact: true })).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1200)

    expect(hydrationSignals).toEqual([])
  })
})
