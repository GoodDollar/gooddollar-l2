import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient } from './fixtures/chain'

test.describe('Lend Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('lend page loads with GoodLend heading', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'GoodLend' })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    const subtitle = page.locator('text=Supply & borrow assets')
    await expect(subtitle).toBeVisible()
  })

  test('markets tab is active by default', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const marketsBtn = page.locator('button', { hasText: 'Markets' })
    await expect(marketsBtn).toBeVisible()
    await expect(marketsBtn).toHaveClass(/text-goodgreen/)
  })

  test('dashboard tab is available and clickable', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const dashboardBtn = page.locator('button', { hasText: 'Dashboard' })
    await expect(dashboardBtn).toBeVisible()

    await dashboardBtn.click()
    await expect(dashboardBtn).toHaveClass(/text-goodgreen/)
  })

  test('markets table shows column headers', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const headers = ['Asset', 'Total Supplied', 'Supply APY', 'Total Borrowed', 'Borrow APY', 'Utilization', 'Available']
    for (const h of headers) {
      await expect(page.locator('th', { hasText: h })).toBeVisible()
    }
  })

  test('USDC and WETH reserves are shown as live', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('td', { hasText: 'USDC' }).first()
    await expect(usdcRow).toBeVisible()

    const wethRow = page.locator('td', { hasText: 'WETH' }).first()
    await expect(wethRow).toBeVisible()
  })

  test('non-deployed reserves show Coming Soon badge', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const comingSoon = page.locator('text=Coming Soon')
    const count = await comingSoon.count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking USDC opens the action panel with supply tab', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    const supplyTab = page.locator('button[data-state="active"]', { hasText: 'Supply' })
    await expect(supplyTab).toBeVisible({ timeout: 5000 })
  })

  test('action panel shows all four tabs', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    const tabs = ['Supply', 'Withdraw', 'Borrow', 'Repay']
    for (const tab of tabs) {
      await expect(page.locator('button[role="tab"]', { hasText: tab })).toBeVisible()
    }
  })

  test('action panel shows amount input and APY info', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    const amountInput = page.locator('input[placeholder="0.00"]')
    await expect(amountInput).toBeVisible()

    const supplyAPYLabel = page.locator('text=Supply APY').last()
    await expect(supplyAPYLabel).toBeVisible()
  })

  test('action panel shows LTV and liquidation threshold', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    await expect(page.locator('text=LTV').first()).toBeVisible()
    await expect(page.locator('text=Liquidation threshold').first()).toBeVisible()
  })

  test('action panel shows UBI fee info', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    const ubiFee = page.locator('text=Protocol fees fund GoodDollar UBI')
    await expect(ubiFee).toBeVisible()
  })

  test('reserve details panel shows when market selected', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    const usdcRow = page.locator('tr').filter({ hasText: 'USDC' }).filter({ hasText: 'gUSDC' })
    await usdcRow.click()

    await expect(page.locator('h3', { hasText: 'Reserve Details' })).toBeVisible()
    await expect(page.locator('text=Max LTV')).toBeVisible()
    await expect(page.locator('text=Reserve factor')).toBeVisible()
    await expect(page.locator('text=gToken')).toBeVisible()
  })

  test('protocol stats show TVL, total borrowed, UBI revenue', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Total Value Locked')).toBeVisible()
    await expect(page.locator('text=Total Borrowed').first()).toBeVisible()
    await expect(page.locator('text=UBI Revenue / yr')).toBeVisible()
  })

  test('select market placeholder shows when no market selected', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Select a market')).toBeVisible()
    await expect(page.locator('text=Click any row to supply or borrow')).toBeVisible()
  })

  test('devnet disclaimer is shown at bottom', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodLend' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Live markets show real devnet data')).toBeVisible()
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})
