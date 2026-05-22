import { test, expect, type Page } from '@playwright/test'
import { injectMockWallet } from './fixtures'

test.use({
  viewport: { width: 375, height: 812 },
})

async function assertNoHorizontalOverflow(page: Page) {
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
}

test.describe('Mobile Viewport — Swap Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('swap page loads at 375px', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /Trade\. Predict\. Invest\. Fund\s+UBI\./ })).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on swap page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })

  test('swap card is fully visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const swapCard = page.locator('[data-testid="swap-card"], .swap-card, [class*="swap"]').first()
    if (await swapCard.isVisible()) {
      const box = await swapCard.boundingBox()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(375 + 5)
      }
    }
  })
})

test.describe('Mobile Viewport — Perps Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('perps page loads at 375px', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Perpetual Trading')).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on perps page', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })

  test('perps action panels are stacked on mobile', async ({ page }) => {
    await page.goto('/perps')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const panels = page.locator('[data-testid*="panel"], [class*="panel"], [class*="card"]')
    const count = await panels.count()
    if (count >= 2) {
      const first = await panels.nth(0).boundingBox()
      const second = await panels.nth(1).boundingBox()
      if (first && second) {
        expect(second.y).toBeGreaterThanOrEqual(first.y)
      }
    }
  })
})

test.describe('Mobile Viewport — Stocks Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('stocks page loads at 375px', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on stocks page', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })

  test('mobile stock cards are shown instead of table', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const table = page.locator('table')
    const isTableVisible = await table.isVisible().catch(() => false)

    if (!isTableVisible) {
      const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]')
      expect(await cards.count()).toBeGreaterThanOrEqual(1)
    }
  })
})

test.describe('Mobile Viewport — Predict Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('predict page loads at 375px', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on predict page', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })
})

test.describe('Mobile Viewport — Lend Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('lend page loads at 375px', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Lending' })).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on lend page', async ({ page }) => {
    await page.goto('/lend')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })
})

test.describe('Mobile Viewport — Stable Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('stable page loads at 375px', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'GoodStable' })).toBeVisible({ timeout: 10_000 })
  })

  test('no horizontal overflow on stable page', async ({ page }) => {
    await page.goto('/stable')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await assertNoHorizontalOverflow(page)
  })
})
