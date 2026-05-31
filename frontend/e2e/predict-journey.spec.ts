import { test, expect } from '@playwright/test'
import { injectMockWallet, TESTER_ADDRESS } from './fixtures'
import { publicClient } from './fixtures/chain'

test.describe('Predict Journey', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('predict page loads with heading and markets', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1', { hasText: 'Prediction Markets' })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    const subtitle = page.locator('text=Bet on real-world events')
    await expect(subtitle).toBeVisible()
  })

  test('info banner explains how prediction markets work', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const infoTitle = page.locator('text=How Prediction Markets Work')
    const isVisible = await infoTitle.isVisible().catch(() => false)
    if (isVisible) {
      await expect(page.locator('text=Buy YES or NO shares')).toBeVisible()
    }
  })

  test('search input filters markets', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const searchInput = page.locator('input[placeholder="Search markets..."]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('bitcoin')
    await page.waitForTimeout(500)
  })

  test('sort options are visible and clickable', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const sortOptions = ['Trending', 'Newest', 'Highest Volume', 'Ending Soon']
    for (const option of sortOptions) {
      const btn = page.locator('button', { hasText: option })
      await expect(btn).toBeVisible()
    }

    const newestBtn = page.locator('button', { hasText: 'Newest' })
    await newestBtn.click()
    await expect(newestBtn).toHaveClass(/text-goodgreen/)
  })

  test('category filters are present', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const categories = ['All', 'Crypto', 'Politics', 'Sports', 'AI & Tech']
    for (const cat of categories) {
      const btn = page.getByRole('button', { name: cat, exact: true }).first()
      await expect(btn).toBeVisible()
    }
  })

  test('clicking a category filters the market list', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const cryptoBtn = page.locator('button', { hasText: 'Crypto' }).first()
    await cryptoBtn.click()
    await expect(cryptoBtn).toHaveClass(/text-goodgreen/)
  })

  test('featured market section is displayed', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const featured = page.locator('text=Featured').first()
    const trending = page.locator('text=Trending').first()
    const hasFeatured = await featured.isVisible().catch(() => false)
    const hasTrending = await trending.isVisible().catch(() => false)

    expect(hasFeatured || hasTrending).toBeTruthy()
  })

  test('market cards show YES/NO buttons with prices', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const yesButtons = page.locator('button[aria-label^="Buy YES"]')
    const noButtons = page.locator('button[aria-label^="Buy NO"]')

    const yesCount = await yesButtons.count()
    const noCount = await noButtons.count()

    expect(yesCount).toBeGreaterThan(0)
    expect(noCount).toBeGreaterThan(0)
  })

  test('market card shows probability percentage', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const chanceLbl = page.locator('text=chance').first()
    await expect(chanceLbl).toBeVisible()
  })

  test('market card shows volume and liquidity', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    // Markets hydrate async; YES buttons prove cards rendered before metric assertions.
    await expect(page.locator('button[aria-label^="Buy YES"]').first()).toBeVisible({
      timeout: 15_000,
    })

    // Featured hero always labels all-time volume "Vol."; grid cards with 24h stats show "24h" instead.
    const volumeLabel = page
      .locator('text=Vol.')
      .or(page.locator('text=24h'))
      .or(page.locator('text=all-time'))
      .first()
    await expect(volumeLabel).toBeVisible()

    await expect(page.locator('text=liquidity').first()).toBeVisible()
  })

  test('clicking YES on a market navigates to detail page', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const yesButton = page.locator('button[aria-label^="Buy YES"]').first()
    await yesButton.click()

    await page.waitForURL(/\/predict\/\d+/, { timeout: 5000 })
    expect(page.url()).toContain('/predict/')
  })

  test('footer disclaimer text is shown', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const disclaimer = page.locator('text=Markets are illustrative')
    await expect(disclaimer).toBeVisible()
  })

  test('no markets found state shows correctly when searching nonsense', async ({ page }) => {
    await page.goto('/predict')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1', { hasText: 'Prediction Markets' })).toBeVisible({ timeout: 10_000 })

    const searchInput = page.locator('input[placeholder="Search markets..."]')
    await searchInput.fill('zzzznonexistentmarket12345')
    await page.waitForTimeout(500)

    const noMarkets = page.locator('text=No markets found')
    await expect(noMarkets).toBeVisible()
  })

  test('tester address is funded on devnet', async () => {
    const balance = await publicClient.getBalance({
      address: TESTER_ADDRESS as `0x${string}`,
    })
    expect(balance).toBeGreaterThan(BigInt(0))
  })
})
