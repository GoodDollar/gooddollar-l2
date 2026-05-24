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

    // Audience-friendly pre-title — the page is read by external auditors
    // and board members as often as by the autobuilder team, so the
    // first thing they see must not be project-internal jargon.
    await expect(page.getByText(/Release gate · GoodChain live-prices pipeline/i)).toBeVisible()

    // Reviewer-context aside sits inside the header so the interpretation
    // rules are visible above the fold, before the reader scrolls into
    // any panel.
    const reviewerContext = page.getByTestId('reviewer-context')
    await expect(reviewerContext).toBeVisible()
    const reviewerCopy = (await reviewerContext.textContent()) ?? ''
    // Sync target: these regexes mirror the vitest invariants in
    // frontend/src/app/(app)/live-prices-proof/__tests__/page.test.tsx (~lines 100-102),
    // updated by task #0036 (commit 4c3ebe67). If you change the
    // reviewer-aside copy, edit BOTH this spec and the vitest case
    // — task lane6-e2e-spec-asserts-removed-reviewer-context-copy (0049).
    expect(reviewerCopy).toMatch(/never silently swallows/i)
    expect(reviewerCopy).toMatch(/yellow.*(degraded|awaiting)/i)

    // Safety banner — either the "Safe" pill or a refusal alert. We only
    // accept the "Safe" path in CI (real-trading must be disabled).
    const safe = page.getByText(/REAL_TRADING_ENABLED = false/i)
    await expect(safe).toBeVisible()

    // Four panel headings (h2 inside each card).
    await expect(page.getByRole('heading', { name: /Live Quotes/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /On-chain Oracle/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Recent Oracle Updates/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Last Demo Hedge/i })).toBeVisible()

    // Live-quotes header pill exposes which price-service URL was attempted
    // so reviewers can validate the build without devtools.
    const pricePill = page.getByTestId('price-service-url')
    await expect(pricePill).toBeVisible()
    const pillText = (await pricePill.textContent()) ?? ''
    expect(pillText.trim().length).toBeGreaterThan(0)

    // Pipeline status rollup must be visible above the panel grid.
    const pipelineBanner = page.getByTestId('pipeline-status-banner')
    await expect(pipelineBanner).toBeVisible()
    await expect.poll(async () => await pipelineBanner.getAttribute('data-status')).toMatch(
      /^(green|amber|red)$/,
    )

    // Session-local "last fully alive" recall — reviewers need to tell
    // a 5-second blip from a 5-hour outage, so the banner always carries
    // a non-empty line under the verdict (either "just now", a wallclock
    // ago-string, or the "Not yet observed all-green" cold-start copy).
    const lastAlive = page.getByTestId('last-fully-alive')
    await expect(lastAlive).toBeVisible()
    const lastAliveText = ((await lastAlive.textContent()) ?? '').trim()
    expect(lastAliveText.length).toBeGreaterThan(0)

    // Pipeline flow diagram visualises the eToro → … → demo-hedge chain.
    const flow = page.getByTestId('pipeline-flow-diagram')
    await expect(flow).toBeVisible()
    // #0074 — the diagram now ships two structural variants (desktop +
    // mobile) so the per-node testids resolve twice in the DOM. Scope
    // every assertion through the visible container at this viewport
    // (Playwright defaults to a desktop-class width).
    const desktopFlow = page.getByTestId('pipeline-flow-desktop')
    await expect(desktopFlow).toBeVisible()
    const nodes = desktopFlow.locator('[data-testid^="pipeline-node-"]')
    expect(await nodes.count()).toBeGreaterThanOrEqual(6)

    // #0054 — every axis-bound flow node is itself a jump-link to the
    // matching panel, mirroring the rollup chip-row pattern from #0024.
    // The upstream `eToro` source has no first-class panel and stays a
    // non-interactive span. #0073 — `oracle-signer` now jumps to the
    // OracleUpdatesPanel (write side) instead of the OnChainOraclePanel
    // (read side) so the recent oracle updates panel is finally
    // reachable from the diagram.
    const flowNodeJumpMap: Record<string, string> = {
      'price-service': '#panel-live-quotes',
      'oracle-signer': '#panel-oracle-updates',
      chain: '#panel-onchain-oracle',
      frontend: '#panel-onchain-oracle',
      'demo-hedge': '#panel-last-hedge',
    }
    for (const [nodeId, expectedHref] of Object.entries(flowNodeJumpMap)) {
      const link = desktopFlow.getByTestId(`pipeline-node-${nodeId}-link`)
      await expect(link).toBeVisible()
      expect(await link.getAttribute('href')).toBe(expectedHref)
    }
    expect(await desktopFlow.getByTestId('pipeline-node-etoro-link').count()).toBe(0)
    const firstFlowLink = desktopFlow.getByTestId('pipeline-node-price-service-link')
    await firstFlowLink.click()
    await expect(page.locator('#panel-live-quotes')).toBeInViewport()

    // Every panel exposes the stable `panel-*` id used by the degraded-
    // reason chips for in-page jump links. The OracleUpdatesPanel also
    // carries an id for consistency though no axis points at it today.
    for (const panelId of [
      'panel-live-quotes',
      'panel-onchain-oracle',
      'panel-oracle-updates',
      'panel-last-hedge',
    ]) {
      await expect(page.locator(`section#${panelId}`)).toHaveCount(1)
    }

    // The last-demo-hedge panel may be in `missing` / `error` state in
    // CI; only assert the humanised timestamp when the panel actually
    // rendered the proof card (the hedge-timestamp testid only exists
    // inside the ok branch).
    const hedgeTimestamp = page.getByTestId('hedge-timestamp')
    if (await hedgeTimestamp.count()) {
      await expect(hedgeTimestamp).toBeVisible()
      const title = await hedgeTimestamp.getAttribute('title')
      expect(title ?? '').toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    }

    // When the banner is degraded, the reason chips render as anchors
    // pointing at their corresponding panel. Click the first chip and
    // confirm the matching panel scrolls into view.
    const status = await pipelineBanner.getAttribute('data-status')
    if (status === 'amber' || status === 'red') {
      const chip = page.locator('[data-testid^="reason-chip-"]').first()
      const href = await chip.getAttribute('href')
      expect(href).toMatch(/^#panel-/)
      await chip.click()
      const target = page.locator(href ?? '#panel-live-quotes')
      await expect(target).toBeInViewport()
    }

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
      expect(txt).toMatch(/^0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}$/)
      expect(await oracleText.getAttribute('title')).toMatch(/^0x[a-fA-F0-9]{40}$/)
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
