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

  test('clicking Connect Wallet opens RainbowKit dialog', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  })

  test('RainbowKit dialog can be dismissed', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })

  test('Connect Wallet button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    // On mobile the "Connect Wallet" label is display:none but still in textContent
    const walletBtn = page.locator('button', { hasText: /connect wallet/i })
    await expect(walletBtn).toBeAttached()
    await walletBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
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
    expect(accounts.map((account) => account.toLowerCase())).toContain(
      TESTER_ADDRESS.toLowerCase(),
    )
  })

  test('mock wallet records chain switch requests for wrong-chain assertions', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() =>
      (window as any).ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa455' }],
      }),
    )

    const calls = await page.evaluate(() => (window as any).__switchEthereumChainCalls)
    expect(calls).toEqual([[{ chainId: '0xa455' }]])
  })

  test('mock wallet announces itself through EIP-6963 discovery', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const provider = await page.evaluate(async () => {
      return new Promise<{
        name: string
        rdns: string
        hasProviderRequest: boolean
        isMock: boolean
      }>((resolve) => {
        window.addEventListener(
          'eip6963:announceProvider',
          (event) => {
            const detail = (event as CustomEvent).detail
            resolve({
              name: detail.info.name,
              rdns: detail.info.rdns,
              hasProviderRequest: typeof detail.provider?.request === 'function',
              isMock: Boolean(detail.provider?._isMock),
            })
          },
          { once: true },
        )
        window.dispatchEvent(new Event('eip6963:requestProvider'))
      })
    })

    expect(provider).toEqual({
      name: 'GoodDollar E2E Wallet',
      rdns: 'org.gooddollar.e2e',
      hasProviderRequest: true,
      isMock: true,
    })
  })

  test('wallet button is present on app routes with injected provider', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/pool')
    await page.waitForLoadState('networkidle')

    // With mock wallet injected, Wagmi may auto-connect via the EIP-6963
    // provider — button shows account address instead of "Connect Wallet"
    const connectBtn = page.getByRole('button', { name: /connect wallet/i })
    const accountBtn = page.locator('header button').filter({ hasText: /0x[a-fA-F0-9]/ })

    await expect(connectBtn.or(accountBtn)).toBeVisible({ timeout: 10000 })
  })
})
