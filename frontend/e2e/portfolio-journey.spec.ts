import { test, expect } from '@playwright/test'
import { injectMockWallet } from './fixtures'

// Iteration 21 — Portfolio lane hardening.
// Closes the E2E coverage gap: stocks-journey.spec.ts already covers the
// stocks half of row 21; this spec covers the cross-protocol portfolio
// roll-up at /portfolio. The page must classify Stocks, Predictions, and
// Perpetual Futures positions and must never go blank — see
// .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0031-iter21-portfolio-lane-e2e-hardening.md
test.describe('Portfolio Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('portfolio page loads with Portfolio Overview heading', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'Portfolio Overview' })
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('renders all three summary cards with their labels', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    // SummaryCard renders the label as a small <div>; assert each label
    // exists somewhere on the page.
    await expect(page.locator('text=Total Value').first()).toBeVisible()
    await expect(page.locator('text=Unrealized P&L').first()).toBeVisible()
    await expect(page.locator('text=Active Positions').first()).toBeVisible()
  })

  test('renders all three protocol section headers', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    // SectionHeader renders the title; check Stocks / Predictions / Perpetual Futures
    // each appear at least once. Stocks may also appear in the
    // ConnectWalletBanner CTA, so use the Stocks section heading element.
    const stocksHeader = page.getByRole('heading', { name: 'Stocks', exact: true })
    await expect(stocksHeader).toBeVisible()

    const predictionsHeader = page.getByRole('heading', { name: 'Predictions', exact: true })
    await expect(predictionsHeader).toBeVisible()

    const perpsHeader = page.getByRole('heading', { name: 'Perpetual Futures', exact: true })
    await expect(perpsHeader).toBeVisible()
  })

  test('Stocks section shows empty-state CTA or holdings — never blank', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    // Either the empty-state CTA renders OR a stock holding row links to
    // /stocks/<ticker>. One must be visible — the other branch is allowed
    // to be absent.
    const emptyTitle = page.locator('text=No stock holdings yet').first()
    const browseStocks = page.getByRole('link', { name: 'Browse stocks' })
    const holdingLink = page.locator('a[href^="/stocks/"]').first()

    const emptyVisible = await emptyTitle.isVisible().catch(() => false)
    const holdingVisible = await holdingLink.isVisible().catch(() => false)

    expect(emptyVisible || holdingVisible).toBeTruthy()

    if (emptyVisible) {
      await expect(browseStocks).toBeVisible()
      await expect(browseStocks).toHaveAttribute('href', '/stocks')
    }
  })

  test('Predictions section shows empty-state CTA or positions — never blank', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    const emptyTitle = page.locator('text=No prediction positions yet').first()
    const browseMarkets = page.getByRole('link', { name: 'Browse markets' })
    const positionLink = page.locator('a[href^="/predict/"]').first()

    const emptyVisible = await emptyTitle.isVisible().catch(() => false)
    const positionVisible = await positionLink.isVisible().catch(() => false)

    expect(emptyVisible || positionVisible).toBeTruthy()

    if (emptyVisible) {
      await expect(browseMarkets).toBeVisible()
      await expect(browseMarkets).toHaveAttribute('href', '/predict')
    }
  })

  test('Perpetual Futures section shows empty-state CTA or positions — never blank', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    const emptyTitle = page.locator('text=No open perps positions').first()
    const openPosition = page.getByRole('link', { name: 'Open a position' })
    const positionLink = page.locator('a[href="/perps/portfolio"]').first()

    const emptyVisible = await emptyTitle.isVisible().catch(() => false)
    const positionVisible = await positionLink.isVisible().catch(() => false)

    expect(emptyVisible || positionVisible).toBeTruthy()

    if (emptyVisible) {
      await expect(openPosition).toBeVisible()
      await expect(openPosition).toHaveAttribute('href', '/perps')
    }
  })

  test('section header View-all links resolve to per-protocol portfolio routes', async ({ page }) => {
    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    // SectionHeader renders a "View all" link with href bound to the
    // section's per-protocol portfolio route. Each route must be
    // present at least once. Use first() because hover/focus variants
    // can produce duplicate matches.
    await expect(page.locator('a[href="/stocks/portfolio"]').first()).toBeVisible()
    await expect(page.locator('a[href="/predict/portfolio"]').first()).toBeVisible()
    await expect(page.locator('a[href="/perps/portfolio"]').first()).toBeVisible()
  })

  test('does not throw uncaught console errors while loading', async ({ page }) => {
    // Allowlist of console.error noise that originates from third-party SDKs
    // and dev-mode tooling — NOT from the portfolio page itself. Filter rules:
    //   - 'wallet' / 'chain'        : pre-injectMockWallet wagmi/rainbowkit warnings
    //   - 'api.web3modal.org'       : Reown AppKit remote config 403; the demo
    //                                 projectId is restricted to production
    //                                 origins, so localhost dev always 403s.
    //   - 'Failed to load resource' : downstream side effect of the above 403
    //   - 'not contained by landmarks' : axe-core dev-only a11y advisory, not
    //                                    triggered in production builds.
    //   - 'CORS policy'             : downstream of the AppKit 403 in dev.
    // The remaining errors are real and must fail the test.
    const NOISY_PATTERNS: readonly string[] = [
      'wallet',
      'chain',
      'api.web3modal.org',
      'Failed to load resource',
      'not contained by landmarks',
      'CORS policy',
    ]

    const errors: string[] = []
    page.on('pageerror', err => {
      errors.push(`pageerror: ${err.message}`)
    })
    page.on('console', msg => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (NOISY_PATTERNS.some(p => text.includes(p))) return
      errors.push(`console.error: ${text}`)
    })

    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Portfolio Overview' })).toBeVisible({ timeout: 10_000 })

    // Give React a beat to flush any post-mount logs.
    await page.waitForTimeout(500)

    expect(errors, errors.join('\n')).toEqual([])
  })
})
