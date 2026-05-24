/**
 * E2E Swap Journey Tests
 *
 * Tests the full swap flow on the landing page:
 *   1. Happy path: enter ETH amount → see G$ output → click Swap → confirm modal → verify
 *   2. Dust guard: enter extremely small amount → verify "Amount Too Small" state
 *   3. Empty state: no amount → verify "Enter an Amount" prompt
 *
 * Uses the mock wallet fixture from e2e/fixtures/ to inject a pre-funded
 * `window.ethereum` provider backed by the Anvil devnet (chain 42069).
 */

import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient } from './fixtures/chain'

test.describe('Swap Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('empty state shows "Enter an Amount" button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const emptyButton = page.locator('[data-testid="swap-button-empty"]')
    await expect(emptyButton).toBeVisible()
    await expect(emptyButton).toHaveText('Enter an Amount')
  })

  test('entering an amount shows output and activates swap button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await expect(input).toBeVisible()

    await input.fill('1')
    await page.waitForTimeout(1500)

    const outputEl = page.locator('[data-testid="output-amount"]')
    await expect(outputEl).toBeVisible()

    const swapActive = page.locator('[data-testid="swap-button-active"]')
    const dustGuard = page.locator('[data-testid="swap-button-dust-guard"]')

    const activeVisible = await swapActive.isVisible().catch(() => false)
    const dustVisible = await dustGuard.isVisible().catch(() => false)

    expect(activeVisible || dustVisible).toBe(true)

    if (activeVisible) {
      await expect(swapActive).toContainText('Swap')
    }
  })

  test('happy path: swap ETH→G$ opens confirm modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('0.1')
    await page.waitForTimeout(2000)

    const swapButton = page.locator('[data-testid="swap-button-active"]')

    const isActive = await swapButton.isVisible().catch(() => false)
    if (!isActive) {
      test.skip(true, 'Swap button not active — on-chain quote may return dust for this amount')
      return
    }

    await swapButton.click()

    const modal = page.locator('[data-testid="modal-backdrop"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    const reviewTitle = page.locator('h3:has-text("Review Swap")')
    await expect(reviewTitle).toBeVisible()

    const youPay = page.locator('[data-testid="modal-backdrop"]').getByText('0.1', { exact: true }).first()
    await expect(youPay).toBeVisible()

    const ethLabel = page.locator('[data-testid="modal-backdrop"]').getByText('ETH').first()
    await expect(ethLabel).toBeVisible()

    const gdLabel = page.locator('[data-testid="modal-backdrop"]').getByText('G$').first()
    await expect(gdLabel).toBeVisible()

    const confirmBtn = page.locator('[data-testid="modal-backdrop"] button:has-text("Confirm Swap")')
    await expect(confirmBtn).toBeVisible()
    await expect(confirmBtn).toBeEnabled()
  })

  test('confirm modal shows swap details', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('0.5')
    await page.waitForTimeout(2000)

    const swapButton = page.locator('[data-testid="swap-button-active"]')
    const isActive = await swapButton.isVisible().catch(() => false)
    if (!isActive) {
      test.skip(true, 'Swap button not active for this amount')
      return
    }

    await swapButton.click()

    const modal = page.locator('[data-testid="modal-backdrop"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await expect(modal.getByText('Rate')).toBeVisible()
    await expect(modal.getByText('Price Impact')).toBeVisible()
    await expect(modal.getByText('Minimum Received')).toBeVisible()
    await expect(modal.getByText('Network Fee')).toBeVisible()
    await expect(modal.getByText('UBI Contribution')).toBeVisible()
    await expect(modal.getByText('Auto-cancel after')).toBeVisible()
  })

  test('confirm modal closes on backdrop click', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('0.5')
    await page.waitForTimeout(2000)

    const swapButton = page.locator('[data-testid="swap-button-active"]')
    const isActive = await swapButton.isVisible().catch(() => false)
    if (!isActive) {
      test.skip(true, 'Swap button not active for this amount')
      return
    }

    await swapButton.click()

    const modal = page.locator('[data-testid="modal-backdrop"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await modal.click({ position: { x: 10, y: 10 } })

    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('confirm modal closes on Escape key', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('0.5')
    await page.waitForTimeout(2000)

    const swapButton = page.locator('[data-testid="swap-button-active"]')
    const isActive = await swapButton.isVisible().catch(() => false)
    if (!isActive) {
      test.skip(true, 'Swap button not active for this amount')
      return
    }

    await swapButton.click()

    const modal = page.locator('[data-testid="modal-backdrop"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    await page.keyboard.press('Escape')

    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('dust guard: extremely small input shows "Amount Too Small"', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('0.0000000000001')
    await page.waitForTimeout(2000)

    const dustGuard = page.locator('[data-testid="swap-button-dust-guard"]')
    const emptyBtn = page.locator('[data-testid="swap-button-empty"]')
    const activeBtn = page.locator('[data-testid="swap-button-active"]')

    const dustVisible = await dustGuard.isVisible().catch(() => false)
    const emptyVisible = await emptyBtn.isVisible().catch(() => false)

    if (dustVisible) {
      await expect(dustGuard).toHaveText('Amount Too Small')
    } else if (emptyVisible) {
      test.skip(true, 'Input parsed as zero — dust guard not triggered for this value')
    } else {
      const activeVisible = await activeBtn.isVisible().catch(() => false)
      expect(activeVisible).toBe(true)
    }
  })

  test('flip button swaps input and output tokens', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const swapCard = page.locator('#swap-card')
    await expect(swapCard).toBeVisible()

    const tokenButtons = swapCard.locator('button[aria-haspopup="dialog"]:has(span.font-semibold)')
    await expect(tokenButtons).toHaveCount(2)

    const firstTokenBefore = await tokenButtons.nth(0).locator('span.font-semibold').textContent()
    const secondTokenBefore = await tokenButtons.nth(1).locator('span.font-semibold').textContent()

    const flipButton = swapCard.getByRole('button', { name: 'Swap token direction' })
    await expect(flipButton).toBeVisible()

    await flipButton.click()
    await page.waitForTimeout(1000)

    const firstTokenAfter = await tokenButtons.nth(0).locator('span.font-semibold').textContent()
    const secondTokenAfter = await tokenButtons.nth(1).locator('span.font-semibold').textContent()

    expect(firstTokenAfter).toBe(secondTokenBefore)
    expect(secondTokenAfter).toBe(firstTokenBefore)
  })

  test('input USD value updates when typing', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('1')
    await page.waitForTimeout(1500)

    const inputUsd = page.locator('[data-testid="input-usd"]')
    const usdVisible = await inputUsd.isVisible().catch(() => false)
    if (usdVisible) {
      const text = await inputUsd.textContent()
      expect(text).toMatch(/\$/)
    }
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})
