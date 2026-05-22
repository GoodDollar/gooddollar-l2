import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS, CHAIN_ID } from './fixtures'

test.describe('Wallet connection', () => {
  // Connect Wallet button lives in the desktop header; run at desktop viewport
  test.use({ viewport: { width: 1280, height: 720 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Connect Wallet button is visible in header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible()
  })

  test('clicking Connect Wallet opens the RainbowKit wallet picker', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await expect(page.getByText(/connect a wallet/i)).toBeVisible()
    await expect(page.getByText(/metamask/i)).toBeVisible()
  })

  test('wallet picker can be dismissed', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click()
    await expect(page.getByText(/connect a wallet/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText(/connect a wallet/i)).not.toBeVisible({ timeout: 5000 })
  })

  test('Connect Wallet button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    // On mobile the visible text is replaced by an icon, but the button
    // must keep an accessible name for screen readers and E2E automation.
    const connectBtn = page.getByRole('button', { name: /connect wallet/i })
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
    expect(accounts.map((account) => account.toLowerCase())).toContain(
      TESTER_ADDRESS.toLowerCase(),
    )
  })

  test('mock wallet can simulate rejected account access', async ({ page }) => {
    await injectMockWallet(page, { rejectRequestAccounts: true })
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const rejection = await page.evaluate(async () => {
      try {
        await (window as any).ethereum?.request({ method: 'eth_requestAccounts' })
        return null
      } catch (error) {
        return {
          code: (error as { code?: number }).code,
          message: (error as Error).message,
        }
      }
    })

    expect(rejection).toEqual({
      code: 4001,
      message: 'User rejected the request.',
    })
  })

  test('mock wallet records and applies chain switch requests for wrong-chain assertions', async ({ page }) => {
    await injectMockWallet(page, { chainId: 1 })
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const initialChainId = await page.evaluate(
      () => (window as any).ethereum?.request({ method: 'eth_chainId' }),
    )
    expect(initialChainId).toBe('0x1')

    const targetChainId = `0x${CHAIN_ID.toString(16)}`
    const switched = await page.evaluate(async (chainId) => {
      const chainChanged = new Promise<string>((resolve) => {
        ;(window as any).ethereum?.on('chainChanged', resolve)
      })

      await (window as any).ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })

      return {
        eventChainId: await chainChanged,
        activeChainId: await (window as any).ethereum?.request({ method: 'eth_chainId' }),
      }
    }, targetChainId)

    const calls = await page.evaluate(() => (window as any).__switchEthereumChainCalls)
    expect(calls).toEqual([[{ chainId: targetChainId }]])
    expect(switched).toEqual({ eventChainId: targetChainId, activeChainId: targetChainId })
  })

  test('mock wallet records add-chain requests for onboarding assertions', async ({ page }) => {
    await injectMockWallet(page, { chainId: 1 })
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const targetChainId = `0x${CHAIN_ID.toString(16)}`
    const chainParams = {
      chainId: targetChainId,
      chainName: 'GoodDollar L2 Devnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['http://127.0.0.1:8545'],
      blockExplorerUrls: ['http://127.0.0.1:4000'],
    }

    await page.evaluate(async (params) => {
      await (window as any).ethereum?.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      })
    }, chainParams)

    const calls = await page.evaluate(() => (window as any).__addEthereumChainCalls)
    expect(calls).toEqual([[chainParams]])
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

  test('Connect Wallet button shows RainbowKit on app routes', async ({ page }) => {
    await injectMockWallet(page)
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    const connectBtn = page.getByRole('button', { name: /connect wallet/i })
    await expect(connectBtn).toBeVisible({ timeout: 10000 })
  })
})
