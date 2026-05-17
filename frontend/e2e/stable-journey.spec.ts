import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient } from './fixtures/chain'

test.describe('Stable Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('stable page loads with GoodStable heading', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'GoodStable' })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    const subtitle = page.locator('text=Mint gUSD stablecoin by locking collateral')
    await expect(subtitle).toBeVisible()
  })

  test('protocol description explains mechanics', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Lock WETH, G$, or USDC to mint gUSD')).toBeVisible()
    await expect(page.locator('text=20% of stability fees fund the UBI pool')).toBeVisible()
  })

  test('protocol stats show total supply, UBI fees, min ratio', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Total gUSD Supply')).toBeVisible()
    await expect(page.locator('text=UBI Fees Routed')).toBeVisible()
    await expect(page.locator('text=Min. Ratio')).toBeVisible()
  })

  test('three vault panels are displayed (WETH, G$, USDC)', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=WETH Vault')).toBeVisible()
    await expect(page.locator('text=G$ Vault')).toBeVisible()
    await expect(page.locator('text=USDC Vault')).toBeVisible()
  })

  test('vault panels show min ratio and fee info', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Min. ratio 150%')).toBeVisible()
    await expect(page.locator('text=Min. ratio 200%')).toBeVisible()
    await expect(page.locator('text=Min. ratio 101%')).toBeVisible()
  })

  test('vault panels show collateral, debt, and ratio stats', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    const collateralLabels = page.locator('text=Collateral')
    expect(await collateralLabels.count()).toBeGreaterThanOrEqual(3)

    const debtLabels = page.locator('text=Debt')
    expect(await debtLabels.count()).toBeGreaterThanOrEqual(3)

    const ratioLabels = page.locator('text=Ratio')
    expect(await ratioLabels.count()).toBeGreaterThanOrEqual(3)
  })

  test('vault action tabs include deposit and mint', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    const depositTabs = page.locator('button[role="tab"]', { hasText: 'Deposit' })
    expect(await depositTabs.count()).toBeGreaterThanOrEqual(1)

    const mintTabs = page.locator('button[role="tab"]', { hasText: 'Mint' })
    expect(await mintTabs.count()).toBeGreaterThanOrEqual(1)
  })

  test('vault action tabs include withdraw and repay', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    const withdrawTabs = page.locator('button[role="tab"]', { hasText: 'Withdraw' })
    expect(await withdrawTabs.count()).toBeGreaterThanOrEqual(1)

    const repayTabs = page.locator('button[role="tab"]', { hasText: 'Repay' })
    expect(await repayTabs.count()).toBeGreaterThanOrEqual(1)
  })

  test('vault panel has amount input with placeholder', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    const inputs = page.locator('input[placeholder="0.00"]')
    expect(await inputs.count()).toBeGreaterThanOrEqual(1)
  })

  test('vault panel has MAX button', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    const maxButtons = page.locator('button', { hasText: 'MAX' })
    expect(await maxButtons.count()).toBeGreaterThanOrEqual(1)
  })

  test('how it works section is displayed', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('h2', { hasText: 'How GoodStable works' })).toBeVisible()
    await expect(page.locator('text=Deposit collateral')).toBeVisible()
    await expect(page.locator('text=Mint gUSD')).toBeVisible()
    await expect(page.locator('text=Repay gUSD')).toBeVisible()
  })

  test('how it works mentions liquidation risk', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Keep your health factor above 1.0 to avoid liquidation')).toBeVisible()
  })

  test('how it works mentions Close Vault feature', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Close Vault')).toBeVisible()
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})
