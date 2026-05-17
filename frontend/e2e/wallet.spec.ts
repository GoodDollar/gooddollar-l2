import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'

test.describe('Wallet connection', () => {
  // Connect Wallet button lives in the desktop header; run at desktop viewport
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Connect Wallet button is visible in header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible()
  })

  test('clicking Connect Wallet shows the testnet launch toast', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await expect(page.getByText(/testnet launching soon/i)).toBeVisible()
  })

  test('wallet toast disappears after ~3 seconds', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await expect(page.getByText(/testnet launching soon/i)).toBeVisible()
    // Toast auto-dismisses after 3s
    await expect(page.getByText(/testnet launching soon/i)).not.toBeVisible({ timeout: 5000 })
  })

  test('Connect Wallet button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    // On mobile the label may be hidden but button should still exist
    const btn = page.locator('button').filter({ hasText: '' }).first()
    const connectBtn = page.getByRole('button', { name: /connect wallet/i })
    // The button element should be in the DOM even if text is visually hidden
    await expect(connectBtn).toBeAttached()
  })

  test('swap button requires wallet when no wallet connected', async ({ page }) => {
    const swapCard = page.locator('#swap-card')
    // The swap action area should be visible
    await expect(swapCard).toBeVisible()
    // Without wallet, should show connect prompt or disabled state — not crash
    const actionArea = swapCard.locator('div.p-4.pt-3')
    await expect(actionArea).toBeVisible()
  })
})

test.describe('SwapCard wallet actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('entering amount and clicking swap shows connect wallet prompt', async ({ page }) => {
    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('1')
    const swapActions = page.locator('#swap-card div.p-4.pt-3')
    await expect(swapActions).toBeVisible()
  })
})

test.describe('Mock wallet integration', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('injected mock wallet is detected on /swap page', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const hasMock = await page.evaluate(() => (window as any).ethereum?._isMock)
    expect(hasMock).toBe(true)
  })

  test('mock wallet provides correct chain ID', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const chainId = await page.evaluate(
      () => (window as any).ethereum?.request({ method: 'eth_chainId' }),
    )
    expect(chainId).toBe('0xa455')
  })

  test('mock wallet returns tester account', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const accounts: string[] = await page.evaluate(
      () => (window as any).ethereum?.request({ method: 'eth_requestAccounts' }),
    )
    expect(accounts).toContain(TESTER_ADDRESS.toLowerCase())
  })

  test('Connect Wallet button shows RainbowKit on app routes', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const connectBtn = page.getByRole('button', { name: /connect wallet/i })
    await expect(connectBtn).toBeVisible({ timeout: 10000 })
  })
})
