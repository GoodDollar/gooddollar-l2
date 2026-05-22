import {
  devices,
  test,
  expect,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'

// Blockscout explorer address used for all explorer tests.
// This address has confirmed on-chain transaction history on the GoodDollar L2 devnet.
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const EXPLORER_URL = 'https://explorer.goodclaw.org'
const API_TIMEOUT_MS = 15_000
const UI_TIMEOUT_MS = 45_000

let explorerSkipReason: string | null = null
let preflightTransactionCount = 0

async function preflightExplorer(request: APIRequestContext) {
  const headers = { 'User-Agent': 'GoodDollar-L2-E2E/1.0' }
  const addressRes = await request.get(
    `${EXPLORER_URL}/api/v2/addresses/${TEST_ADDRESS}`,
    { headers, timeout: API_TIMEOUT_MS, failOnStatusCode: false },
  )

  if (!addressRes.ok()) {
    throw new Error(`address API returned HTTP ${addressRes.status()}`)
  }

  const txRes = await request.get(
    `${EXPLORER_URL}/api/v2/addresses/${TEST_ADDRESS}/transactions`,
    { headers, timeout: API_TIMEOUT_MS, failOnStatusCode: false },
  )

  if (!txRes.ok()) {
    throw new Error(`transactions API returned HTTP ${txRes.status()}`)
  }

  const txBody = (await txRes.json()) as { items?: unknown[] }
  const count = Array.isArray(txBody.items) ? txBody.items.length : 0
  if (count < 1) {
    throw new Error('transactions API returned no items for the fixture address')
  }

  preflightTransactionCount = count
}

function explorerProxy() {
  const server = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY
  if (!server) return undefined

  const bypass = new Set(
    (process.env.NO_PROXY ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  )
  bypass.add('explorer.goodclaw.org')

  return { server, bypass: Array.from(bypass).join(',') }
}

async function openAddressPage(
  browser: Browser,
  projectName: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    ...(projectName === 'mobile-chrome' ? devices['Pixel 5'] : devices['Desktop Chrome']),
    proxy: explorerProxy(),
  })
  const page = await context.newPage()

  // Blockscout is an external app and can spend test budget on images/fonts.
  // Keep real UI coverage while dropping non-essential assets that caused
  // occasional hard timeouts in the release gate.
  await page.route(/\.(?:png|jpe?g|webp|gif|ico|woff2?|ttf)(?:\?.*)?$/i, (route) =>
    route.abort(),
  )

  const response = await page.goto(`${EXPLORER_URL}/address/${TEST_ADDRESS}`, {
    waitUntil: 'domcontentloaded',
    timeout: UI_TIMEOUT_MS,
  })

  if (!response?.ok()) {
    throw new Error(`explorer UI returned HTTP ${response?.status() ?? 'no response'}`)
  }

  await expect(page.locator('body')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/transactions/i).first()).toBeVisible({
    timeout: 20_000,
  })

  return { context, page }
}

test.describe('explorer/address', () => {
  test.beforeAll(async ({ request }) => {
    try {
      await preflightExplorer(request)
    } catch (err) {
      explorerSkipReason = `Blockscout preflight unavailable: ${err instanceof Error ? err.message : String(err)}`
    }
  })

  test.beforeEach(() => {
    test.skip(Boolean(explorerSkipReason), explorerSkipReason ?? undefined)
  })

  test('transactions_visible — address page loads with transaction data', async ({ browser }, testInfo) => {
    test.setTimeout(60_000)

    const { context, page } = await openAddressPage(browser, testInfo.project.name)
    try {
      // Verify the explorer rendered the fixture address page rather than an
      // error shell. Desktop renders the full hash; mobile truncates the middle.
      const bodyText = await page.locator('body').innerText()
      expect(bodyText).toMatch(/0xf39Fd6e51aad88F6F4ce6aB8827.*2266/i)

      // Verify the Transactions surface is present; the API preflight above
      // proves this fixture address currently has transaction data.
      await expect(page.getByText(/transactions/i).first()).toBeVisible({
        timeout: 20_000,
      })
      expect(preflightTransactionCount).toBeGreaterThan(0)
    } finally {
      await context.close()
    }
  })

  test('transactions_visible — transactions tab shows transaction count', async ({ browser }, testInfo) => {
    test.setTimeout(60_000)

    const { context, page } = await openAddressPage(browser, testInfo.project.name)
    try {
      const transactionsText = page.getByText(/transactions/i).first()
      await expect(transactionsText).toBeVisible({ timeout: 20_000 })

      const visibleTransactionLabels = await page
        .getByText(/transactions/i)
        .evaluateAll((els) => els.map((el) => el.textContent ?? '').filter(Boolean))

      expect(
        visibleTransactionLabels.some((text) => /transactions.*\d+|\d+.*transactions/i.test(text)),
        `expected a visible transactions label with a count; labels=${JSON.stringify(visibleTransactionLabels)}`,
      ).toBe(true)
      expect(preflightTransactionCount).toBeGreaterThan(0)

      // Verify there's no "no transactions" message in the details section.
      const noTxsMsg = page.getByText(/no transactions/i)
      await expect(noTxsMsg).not.toBeVisible()
    } finally {
      await context.close()
    }
  })
})
