import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient, walletClient } from './fixtures/chain'
import { CONTRACTS } from '../src/lib/devnet'
import { PerpEngineABI } from '../src/lib/abi'

test.describe('Perps Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('perps page loads with BTC-USD selected by default', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'Perpetual Futures' })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    const pairInfoBar = page.locator('[data-testid="pair-info-bar"]')
    await expect(pairInfoBar).toBeVisible()

    const markLabel = pairInfoBar.locator('text=Mark')
    await expect(markLabel).toBeVisible()
  })

  test('pair selector shows available markets', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const btcButton = page.locator('button', { hasText: 'BTC-USD' })
    await expect(btcButton).toBeVisible()

    const ethButton = page.locator('button', { hasText: 'ETH-USD' })
    await expect(ethButton).toBeVisible()
  })

  test('switching pairs updates the info bar', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const ethButton = page.locator('button', { hasText: 'ETH-USD' })
    await ethButton.click()

    await page.waitForTimeout(500)

    const pairInfoBar = page.locator('[data-testid="pair-info-bar"]')
    await expect(pairInfoBar).toBeVisible()
  })

  test('order form shows "Enter Size" when no size entered', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const enterSizeButton = page.locator('button', { hasText: 'Enter Size' })
    await expect(enterSizeButton).toBeVisible()
    await expect(enterSizeButton).toBeDisabled()
  })

  test('long/short toggle switches side', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const longButton = page.locator('button', { hasText: 'Long' }).first()
    const shortButton = page.locator('button', { hasText: 'Short' }).first()

    await expect(longButton).toBeVisible()
    await expect(shortButton).toBeVisible()

    await shortButton.click()
    await expect(shortButton).toHaveClass(/text-red-400/)

    await longButton.click()
    await expect(longButton).toHaveClass(/text-green-400/)
  })

  test('order type selector shows market/limit/stop-limit', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const marketButton = page.locator('button', { hasText: /^market$/i })
    const limitButton = page.locator('button', { hasText: /^limit$/i })
    const stopLimitButton = page.locator('button', { hasText: /stop-limit/i })

    await expect(marketButton).toBeVisible()
    await expect(limitButton).toBeVisible()
    await expect(stopLimitButton).toBeVisible()
  })

  test('selecting limit order type shows limit price input', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const limitButton = page.locator('button', { hasText: /^limit$/i })
    await limitButton.click()

    const limitPriceLabel = page.locator('label', { hasText: 'Limit Price' })
    await expect(limitPriceLabel).toBeVisible()
  })

  test('selecting stop-limit shows trigger + limit price inputs', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const stopLimitButton = page.locator('button', { hasText: /stop-limit/i })
    await stopLimitButton.click()

    const triggerLabel = page.locator('label', { hasText: 'Trigger Price' })
    const limitLabel = page.locator('label', { hasText: 'Limit Price' })
    await expect(triggerLabel).toBeVisible()
    await expect(limitLabel).toBeVisible()
  })

  test('leverage slider defaults to 10x', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const leverageDisplay = page.locator('text=10x').first()
    await expect(leverageDisplay).toBeVisible()
  })

  test('entering size shows order summary (notional, margin, liq price, fee)', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const sizeInput = page.locator('input[inputmode="decimal"]').first()
    await sizeInput.fill('0.01')
    await page.waitForTimeout(1000)

    await expect(page.getByText('Notional', { exact: true })).toBeVisible()
    await expect(page.getByText('Margin', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Liq. Price', { exact: true })).toBeVisible()
    await expect(page.getByText('Fee (').first()).toBeVisible()
    await expect(page.locator('text=→ UBI (20%)')).toBeVisible()
  })

  test('entering size activates the submit button', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const sizeInput = page.locator('input[inputmode="decimal"]').first()
    await sizeInput.fill('0.01')
    await page.waitForTimeout(1000)

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toHaveText(/Long BTC/)
  })

  test('account panel shows balance, equity, margin info', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const accountHeading = page.locator('h3', { hasText: 'Account' })
    await expect(accountHeading).toBeVisible()

    await expect(page.locator('text=Balance')).toBeVisible()
    await expect(page.locator('text=Equity')).toBeVisible()
    await expect(page.locator('text=Margin Used')).toBeVisible()
    await expect(page.locator('text=Available')).toBeVisible()
    await expect(page.locator('text=Margin Ratio')).toBeVisible()
  })

  test('open positions section shows "No open positions" initially', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const noPositions = page.locator('text=No open positions')
    await expect(noPositions).toBeVisible()
  })

  test('TP/SL toggle reveals take profit and stop loss inputs', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const tpSlToggle = page.locator('button', { hasText: /TP \/ SL/ })
    await tpSlToggle.click()

    const tpLabel = page.locator('label', { hasText: 'Take Profit' })
    const slLabel = page.locator('label', { hasText: 'Stop Loss' })
    await expect(tpLabel).toBeVisible()
    await expect(slLabel).toBeVisible()
  })

  test('advanced options toggle shows margin mode and quick size', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const advancedToggle = page.locator('button', { hasText: /Advanced Options/ })
    await advancedToggle.click()

    const marginModeLabel = page.locator('label', { hasText: 'Margin Mode' })
    await expect(marginModeLabel).toBeVisible()

    const crossButton = page.locator('button', { hasText: 'Cross' })
    const isolatedButton = page.locator('button', { hasText: 'Isolated' })
    await expect(crossButton).toBeVisible()
    await expect(isolatedButton).toBeVisible()
  })

  test('timeframe buttons switch chart period', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const timeframes = ['1D', '1W', '1M', '3M', '1Y']
    for (const tf of timeframes) {
      const btn = page.locator(`button:has-text("${tf}")`).first()
      await expect(btn).toBeVisible()
    }

    const oneWeekBtn = page.locator('button:has-text("1W")').first()
    await oneWeekBtn.click()
    await expect(oneWeekBtn).toHaveClass(/text-goodgreen/)
  })

  test('order book and recent trades sections are present', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const orderBookHeader = page.locator('h3', { hasText: 'Order Book' })
    const recentTradesHeader = page.locator('h3', { hasText: 'Recent Trades' })
    const openPositionsHeader = page.locator('h3', { hasText: 'Open Positions' })

    await expect(orderBookHeader).toBeVisible()
    await expect(recentTradesHeader).toBeVisible()
    await expect(openPositionsHeader).toBeVisible()
  })

  test('UBI fee info is displayed in order form', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 10_000 })

    const ubiFeeInfo = page.locator('text=Fees → 20% funds UBI')
    await expect(ubiFeeInfo).toBeVisible()
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})

test.describe('Perps full on-chain flow', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
    await closeTesterPerpPositions()
  })

  test.afterEach(async () => {
    await closeTesterPerpPositions()
  })

  test('opens a real market position through the UI with auto margin deposit', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 15_000 })

    // The mock EIP-1193 wallet auto-connects through RainbowKit on app routes.
    await expect(page.getByText(/0xf3…2266/i)).toBeVisible({ timeout: 15_000 })

    const before = await readOpenTesterPositions()
    expect(before.filter((position) => position.isOpen)).toHaveLength(0)

    const sizeInput = page.locator('label', { hasText: /^Size / }).locator('..').locator('input[inputmode="decimal"]')
    await expect(sizeInput).toBeVisible()
    await sizeInput.fill('0.001')

    await expect(page.getByText('Notional', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Margin', { exact: true }).first()).toBeVisible()

    const submit = page.locator('button[type="submit"]').filter({ hasText: /Long|Short/ })
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled({ timeout: 10_000 })

    await submit.click()

    await expect(page.getByText(/Approving|Confirming|Order Placed!/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 90_000 })

    await expect.poll(async () => {
      const positions = await readOpenTesterPositions()
      return positions.some((position) => position.isOpen && position.size > 0n)
    }, { timeout: 90_000 }).toBe(true)

    await expect(page.getByRole('heading', { name: 'Open Positions' })).toBeVisible()
    await expect(page.getByText('No open positions')).not.toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/LONG \d+x|SHORT \d+x/)).toBeVisible({ timeout: 15_000 })
  })
})

type TesterPerpPosition = {
  marketId: bigint
  isOpen: boolean
  size: bigint
}

async function readOpenTesterPositions(): Promise<TesterPerpPosition[]> {
  const marketCount = await publicClient.readContract({
    address: CONTRACTS.PerpEngine,
    abi: PerpEngineABI,
    functionName: 'marketCount',
  })

  const positions: TesterPerpPosition[] = []
  for (let i = 0n; i < marketCount; i++) {
    const result = await publicClient.readContract({
      address: CONTRACTS.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'positions',
      args: [TESTER_ADDRESS, i],
    })
    positions.push({ marketId: i, isOpen: result[0], size: result[2] })
  }
  return positions
}

async function closeTesterPerpPositions(): Promise<void> {
  const positions = await readOpenTesterPositions()
  for (const position of positions) {
    if (!position.isOpen) continue
    const hash = await walletClient.writeContract({
      address: CONTRACTS.PerpEngine,
      abi: PerpEngineABI,
      functionName: 'closePosition',
      args: [position.marketId],
    })
    await publicClient.waitForTransactionReceipt({ hash })
  }
}
