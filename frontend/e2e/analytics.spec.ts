import { test, expect, type APIResponse } from '@playwright/test'

/**
 * Iter 27 — Internal analytics dashboard smoke test.
 *
 * See:
 *   - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *       0038-iter27-internal-analytics-dashboard.md
 *   - docs/TESTNET-READINESS-50-ITERATIONS.md (row 27)
 *
 * Verifies:
 *   1. `/analytics` returns HTTP 200 and renders the four panel headings
 *      without a runtime overlay.
 *   2. `/api/analytics/overview` returns the documented union shape
 *      with per-source `ok` flags (no silent nulls).
 *   3. The dashboard surfaces freshness honestly — the indexer-vs-chain
 *      lag is rendered as a labelled badge.
 */
test.describe('Iter 27 — Internal analytics dashboard', () => {
  test('/analytics renders the four panels and links to the API', async ({ page }) => {
    // Wait for the analytics API call to complete before checking headings,
    // so the panels have moved past their skeleton state.
    const apiResponse = page.waitForResponse((res) =>
      res.url().includes('/api/analytics/overview') && res.status() === 200,
    )

    const pageResponse = await page.goto('/analytics')
    expect(pageResponse?.status()).toBe(200)
    await apiResponse

    // No runtime error overlay (react-error-overlay or Next.js error dialog).
    await expect(page.locator('react-error-overlay')).toHaveCount(0)
    await expect(page.locator('nextjs-portal')).toHaveCount(0)

    // The page-level heading.
    await expect(
      page.getByRole('heading', { name: /Analytics Dashboard/i, level: 1 }),
    ).toBeVisible()

    // The four required panels, in order.
    for (const heading of [
      /Service Health/i,
      /Chain & Indexer Activity/i,
      /UBI Fee Landscape/i,
      /Protocols/i,
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }

    // The freshness badge always renders (one of: Fresh, Stale, Far behind,
    // DB ahead of chain, Unknown).
    await expect(page.getByTestId('indexer-freshness-badge')).toBeVisible()

    // The page links to the underlying API and the status proxy so an
    // operator can pivot to raw JSON.
    await expect(
      page.getByRole('link', { name: /\/api\/analytics\/overview/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /\/api\/status/ }),
    ).toBeVisible()
  })

  test('GET /api/analytics/overview returns the documented union shape', async ({
    request,
  }) => {
    const res: APIResponse = await request.get('/api/analytics/overview')
    expect(res.status()).toBe(200)
    const body = await res.json()

    expect(body).toMatchObject({ ok: true })
    // summary
    expect(body.summary).toMatchObject({
      totalProtocols: expect.any(Number),
      totalContracts: expect.any(Number),
      generatedAt: expect.any(String),
    })
    expect(body.summary.totalProtocols).toBeGreaterThanOrEqual(1)
    expect(body.summary.totalContracts).toBeGreaterThanOrEqual(1)

    // per-source ok flags (no silent nulls — Non-Negotiable #8)
    for (const key of ['status', 'indexer', 'chain'] as const) {
      expect(body[key]).toHaveProperty('ok')
      expect(typeof body[key].ok).toBe('boolean')
    }

    // ubi block (sourced from address-book.json, always present)
    expect(body.ubi).toMatchObject({
      totalRoutes: expect.any(Number),
      pendingCount: expect.any(Number),
      routes: expect.any(Array),
    })
    expect(body.ubi.totalRoutes).toBeGreaterThanOrEqual(1)

    // protocols (sourced from address-book.json, always present)
    expect(Array.isArray(body.protocols)).toBe(true)
    expect(body.protocols.length).toBeGreaterThanOrEqual(1)
    expect(body.protocols[0]).toMatchObject({
      key: expect.any(String),
      label: expect.any(String),
      count: expect.any(Number),
    })
  })
})
