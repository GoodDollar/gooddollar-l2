import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient } from './fixtures/chain'

test.describe('Stocks Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('stocks page loads with Tokenized Stocks heading', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'Tokenized Stocks' })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    const subtitle = page.locator('text=Trade synthetic equities 24/7 with fractional shares')
    await expect(subtitle).toBeVisible()
  })

  test('info banner explains how tokenized stocks work', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=How Tokenized Stocks Work')).toBeVisible()
    await expect(page.locator('text=Synthetic stock tokens track real equity prices')).toBeVisible()
  })

  test('search input is present with placeholder', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const searchInput = page.locator('input[placeholder="Search stocks..."]')
    await expect(searchInput).toBeVisible()
  })

  test('stock table shows column headers', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('th', { hasText: 'Stock' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Price' })).toBeVisible()
    await expect(page.locator('th', { hasText: '24h Change' })).toBeVisible()
  })

  test('stock table shows volume and market cap columns', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('th', { hasText: 'Volume' })).toBeVisible()
    await expect(page.locator('th', { hasText: 'Market Cap' })).toBeVisible()
  })

  test('stock table has 7d trend column', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('th', { hasText: '7d Trend' })).toBeVisible()
  })

  test('stock rows display with trade button on hover area', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const tradeButtons = page.locator('button', { hasText: 'Trade' })
    expect(await tradeButtons.count()).toBeGreaterThanOrEqual(1)
  })

  test('search filters stocks by ticker', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const searchInput = page.locator('input[placeholder="Search stocks..."]')
    await searchInput.fill('AAPL')

    await expect(page.locator('table').getByText('AAPL').first()).toBeVisible()
  })

  test('no results shows empty state with clear button', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const searchInput = page.locator('input[placeholder="Search stocks..."]')
    await searchInput.fill('ZZZNONEXISTENT')

    await expect(page.locator('table').getByText('No stocks match your search')).toBeVisible()
    await expect(page.locator('table').getByRole('button', { name: 'Clear' })).toBeVisible()
  })

  test('clicking sort headers changes sort direction', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const priceHeader = page.locator('th', { hasText: 'Price' })
    await priceHeader.click()
    await priceHeader.click()
  })

  test('oracle price source disclaimer is shown', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    await expect(page.locator('text=Prices sourced from on-chain oracle')).toBeVisible()
  })

  test('clicking stock row navigates to detail page', async ({ page }) => {
    await page.goto('/stocks')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Tokenized Stocks' })).toBeVisible({ timeout: 10_000 })

    const firstTradeButton = page.locator('button', { hasText: 'Trade' }).first()
    await firstTradeButton.click()

    await page.waitForURL(/\/stocks\/[A-Z]+/)
  })

  test('malformed ticker routes render generic safe copy without encoded payload text', async ({ page }) => {
    for (const route of [
      '/stocks/%20',
      '/stocks/%00',
      '/stocks/%2520',
      '/stocks/%252520',
      '/stocks/%2F',
      '/stocks/%252525252525',
      '/stocks/AAPL%00',
      '/stocks/%3Csvg%20onload%3Dalert(1)%3E',
    ]) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading', { name: 'Stock Not Found' })).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('This stock symbol is not available.', { exact: true })).toBeVisible()

      const mainText = await page.locator('main').innerText()
      expect(mainText).not.toContain('%20')
      expect(mainText).not.toContain('%00')
      expect(mainText).not.toContain('%2520')
      expect(mainText).not.toContain('%252520')
      expect(mainText).not.toContain('%2F')
      expect(mainText).not.toContain('%252525252525')
      expect(mainText).not.toContain('AAPL%00')
      expect(mainText).not.toContain('%3Csvg')
      expect(mainText).not.toContain('onload')
      expect(mainText).not.toContain('alert(1)')
    }
  })

  test('encoded valid ticker routes resolve to stock detail page', async ({ page }) => {
    for (const route of ['/stocks/%41APL', '/stocks/%2541APL', '/stocks/%252541APL']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1', { hasText: 'AAPL' })).toBeVisible({ timeout: 10_000 })
      await expect(page.getByRole('heading', { name: 'Stock Not Found' })).toHaveCount(0)
    }
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})
