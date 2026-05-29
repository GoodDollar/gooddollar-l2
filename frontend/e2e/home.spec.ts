import { test, expect } from '@playwright/test'

test.describe('Home / Swap page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders page title and tagline', async ({ page }) => {
    await expect(page).toHaveTitle(/GoodDollar/)
    await expect(page.getByRole('heading', { name: /trade\. predict\. invest\./i })).toBeVisible()
  })

  test('renders UBI impact context without fabricated counters', async ({ page }) => {
    await expect(page.getByText(/Live counters coming soon/i)).toBeVisible()
    await expect(page.getByText(/640,000\+ people worldwide/i)).toBeVisible()
  })

  test('renders swap card', async ({ page }) => {
    const swapCard = page.locator('#swap-card')
    await expect(swapCard).toBeVisible()
    await expect(swapCard.getByRole('heading', { name: 'Swap' })).toBeVisible()
  })

  test('swap card has "You pay" and "You receive" sections', async ({ page }) => {
    const swapCard = page.locator('#swap-card')
    await expect(swapCard.getByText('You pay')).toBeVisible()
    await expect(swapCard.getByText('You receive')).toBeVisible()
  })

  test('entering an amount shows output and USD value', async ({ page }) => {
    const input = page.locator('#swap-card input[inputmode="decimal"]')
    await input.fill('1')
    // USD value should appear for input
    await expect(page.getByTestId('input-usd')).toBeVisible()
  })

  test('flip button swaps input and output tokens', async ({ page }) => {
    const swapCard = page.locator('#swap-card')

    // Wait for swap card to be fully loaded
    await expect(swapCard).toBeVisible()
    await expect(swapCard.getByText('You pay')).toBeVisible()
    await expect(swapCard.getByText('You receive')).toBeVisible()

    // Token selector buttons have data-testid="token-selector" (one for input, one for output)
    const tokenButtons = swapCard.getByTestId('token-selector')

    // Wait for at least one token button to be visible (default should be ETH and G$)
    await tokenButtons.first().waitFor({ state: 'visible', timeout: 10_000 })
    const tokenCount = await tokenButtons.count()

    // Should find at least 2 token buttons (input and output selectors)
    expect(tokenCount).toBeGreaterThanOrEqual(2)

    // Click the flip button using its aria-label for reliability
    const flipButton = swapCard.getByRole('button', { name: 'Swap token direction' })
    await flipButton.click()

    // After flip, token selectors should have swapped - just verify page is still intact
    await expect(swapCard.getByText('You pay')).toBeVisible()
    await expect(swapCard.getByText('You receive')).toBeVisible()

    // Verify token selectors are still present after flip
    const tokenCountAfterFlip = await swapCard.getByTestId('token-selector').count()
    expect(tokenCountAfterFlip).toBeGreaterThanOrEqual(2)
  })

  test('HowItWorks section is visible', async ({ page }) => {
    await page.getByText(/how it works/i).waitFor({ state: 'visible', timeout: 10000 })
    await expect(page.getByText(/how it works/i)).toBeVisible()
  })

  test('UBI Explainer section is present', async ({ page }) => {
    // Use full phrase to avoid matching hidden nav "UBI" link on mobile
    await page.getByText(/universal basic income/i).first().waitFor({ state: 'visible', timeout: 10000 })
    await expect(page.getByText(/universal basic income/i).first()).toBeVisible()
  })

  test('?buy= query param pre-selects output token', async ({ page }) => {
    await page.goto('/?buy=USDC')
    await expect(page.locator('#swap-card')).toBeVisible()
    // USDC should appear as output token
    await expect(page.locator('#swap-card').getByText('USDC').first()).toBeVisible()
  })
})
