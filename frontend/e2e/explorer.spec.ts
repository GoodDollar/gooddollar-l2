import { test, expect } from '@playwright/test'

// Blockscout explorer address used for all explorer tests.
// This address has confirmed on-chain transaction history on the GoodDollar L2 devnet.
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const EXPLORER_URL = 'https://explorer.goodclaw.org'

test.describe('explorer/address', () => {
  test('transactions_visible — address page loads with transaction data', async ({ page }) => {
    // Navigate directly to the Blockscout explorer address page
    await page.goto(`${EXPLORER_URL}/address/${TEST_ADDRESS}`, {
      waitUntil: 'domcontentloaded',
    })

    // Verify the page shows an address with transaction data
    const addressDisplay = page.locator('text=/0x[a-fA-F0-9]{40}/')
    await expect(addressDisplay).toBeVisible({ timeout: 10_000 })

    // Verify the Transactions tab is present and shows transaction count
    const transactionsTab = page.getByRole('tab', { name: /transactions/i })
    await expect(transactionsTab).toBeVisible({ timeout: 10_000 })

    // The transaction count should be shown in the Details section
    const txCountText = page.getByText(/transactions/i).first()
    await expect(txCountText).toBeVisible({ timeout: 10_000 })
  })

  test('transactions_visible — transactions tab shows transaction count', async ({ page }) => {
    await page.goto(`${EXPLORER_URL}/address/${TEST_ADDRESS}`, {
      waitUntil: 'domcontentloaded',
    })

    // Verify the Transactions tab shows a count indicating transactions exist
    const transactionsTab = page.getByRole('tab', { name: /transactions/i })
    await expect(transactionsTab).toBeVisible({ timeout: 10_000 })

    // The tab text should include numbers, indicating transactions are present
    const tabText = await transactionsTab.textContent()
    expect(tabText).toMatch(/transactions.*\d+/i)

    // Verify there's no "no transactions" message in the details section
    const noTxsMsg = page.getByText(/no transactions/i)
    await expect(noTxsMsg).not.toBeVisible()
  })
})
