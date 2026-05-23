/**
 * Lane 6 — /live-prices-proof page smoke spec.
 *
 * Asserts the canonical proof page renders:
 *   - safety banner with REAL_TRADING_ENABLED=false language
 *   - the four panel headings (Live Quotes, On-chain Oracle, Recent Oracle
 *     Updates, Last Demo Hedge)
 *   - degraded states surface inline rather than crashing the page
 *
 * Defensive by design: the page must work even when the price-service or
 * Anvil are unreachable (the panels degrade gracefully).
 */

import { test, expect } from '@playwright/test'

test.describe('Lane 6 — /live-prices-proof', () => {
  test('renders all four panels and the safety banner', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    const response = await page.goto('/live-prices-proof', { waitUntil: 'domcontentloaded' })
    expect(response, 'response').not.toBeNull()
    expect(response!.status(), `GET /live-prices-proof returned ${response!.status()}`).toBeLessThan(400)

    await expect(page.getByTestId('live-prices-proof-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Live Prices Proof/i })).toBeVisible()

    // Safety banner — either the "Safe" pill or a refusal alert. We only
    // accept the "Safe" path in CI (real-trading must be disabled).
    const safe = page.getByText(/REAL_TRADING_ENABLED = false/i)
    await expect(safe).toBeVisible()

    // Four panel headings (h2 inside each card).
    await expect(page.getByRole('heading', { name: /Live Quotes/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /On-chain Oracle/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Recent Oracle Updates/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Last Demo Hedge/i })).toBeVisible()

    // Pipeline status rollup must be visible above the panel grid.
    const pipelineBanner = page.getByTestId('pipeline-status-banner')
    await expect(pipelineBanner).toBeVisible()
    await expect.poll(async () => await pipelineBanner.getAttribute('data-status')).toMatch(
      /^(green|amber|red)$/,
    )

    // On-chain oracle address must be surfaced as either a link to the
    // configured explorer or a span carrying the full address. Whichever
    // variant the harness env produces, the full 0x-prefixed address must
    // be reachable.
    const oracleLink = page.getByTestId('oracle-address-link')
    const oracleText = page.getByTestId('oracle-address-text')
    if (await oracleLink.count()) {
      const href = await oracleLink.getAttribute('href')
      expect(href).toMatch(/\/address\/0x[a-fA-F0-9]{40}$/)
    } else {
      const txt = (await oracleText.textContent()) ?? ''
      expect(txt).toMatch(/0x[a-fA-F0-9]{40}/)
    }

    expect(errors, `page errors: ${JSON.stringify(errors)}`).toEqual([])
  })

  test('/proof alias renders the same page', async ({ page }) => {
    const response = await page.goto('/proof', { waitUntil: 'domcontentloaded' })
    expect(response!.status()).toBeLessThan(400)
    await expect(page.getByTestId('live-prices-proof-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Live Prices Proof/i })).toBeVisible()
  })
})
