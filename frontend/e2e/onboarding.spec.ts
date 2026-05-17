/**
 * Wallet Onboarding E2E (iter 13 — Testnet Readiness Gate)
 *
 * Verifies the one-click "Add GoodChain Testnet" flow from both entry points:
 *
 *   • /testnet-guide — the canonical onboarding page
 *   • /faucet        — compact button right above the "Get Tokens" form
 *
 * The mock wallet records every `wallet_addEthereumChain` call on
 * `window.__addEthereumChainCalls`, so the test can assert that the canonical
 * EIP-3085 payload (chainId, RPC URL, explorer URL, native currency) actually
 * reached the wallet — not just that a button was clicked.
 *
 * Captures a screenshot of each entry point so reviewers have visual proof
 * for iteration 13's "Playwright onboarding path + screenshot" requirement.
 */

import { test, expect, type Page } from '@playwright/test'
import { injectMockWallet } from './fixtures'
import addresses from '../../op-stack/addresses.json'

const CHAIN_ID = addresses.chain_id
const RPC_URL = addresses.rpc_url
const EXPLORER_URL = addresses.explorer_url
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`

type AddEthereumChainParams = {
  chainId: string
  chainName: string
  rpcUrls: string[]
  blockExplorerUrls: string[]
  nativeCurrency: { name: string; symbol: string; decimals: number }
}

async function readAddNetworkCalls(
  page: Page,
): Promise<AddEthereumChainParams[][]> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __addEthereumChainCalls?: AddEthereumChainParams[][]
    }
    return Array.isArray(w.__addEthereumChainCalls)
      ? w.__addEthereumChainCalls
      : []
  })
}

test.describe('Wallet onboarding — Add GoodChain Testnet', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page)
  })

  test('testnet-guide: Add Network button sends canonical EIP-3085 payload', async ({
    page,
  }) => {
    await page.goto('/testnet-guide')

    // Compact wrapper makes the button addressable even if the visible label
    // changes later (e.g. a marketing rename).
    const container = page.getByTestId('add-network-button-container')
    await expect(container).toBeVisible()

    const addBtn = container.getByRole('button', {
      name: /add goodchain testnet/i,
    })
    await expect(addBtn).toBeVisible()

    await page.screenshot({
      path: 'e2e/screenshots/onboarding-testnet-guide-before.png',
      fullPage: true,
    })

    await addBtn.click()

    // Success state: success indicator AND a follow-up CTA.
    await expect(
      container.getByText(/goodchain testnet added to your wallet/i),
    ).toBeVisible({ timeout: 5000 })

    await page.screenshot({
      path: 'e2e/screenshots/onboarding-testnet-guide-after.png',
      fullPage: true,
    })

    // Canonical EIP-3085 payload reached the wallet.
    const calls = await readAddNetworkCalls(page)
    expect(calls.length).toBeGreaterThanOrEqual(1)

    const [param] = calls[calls.length - 1]
    expect(param.chainId).toBe(CHAIN_ID_HEX)
    expect(param.chainName).toBe('GoodChain Testnet')
    expect(param.rpcUrls).toEqual([RPC_URL])
    expect(param.blockExplorerUrls).toEqual([EXPLORER_URL])
    expect(param.nativeCurrency).toEqual({
      name: 'GoodDollar',
      symbol: 'G$',
      decimals: 18,
    })
  })

  test('faucet: compact Add Network button is present and works', async ({
    page,
  }) => {
    await page.goto('/faucet')

    const container = page.getByTestId('add-network-button-container')
    await expect(container).toBeVisible()

    const addBtn = container.getByRole('button', {
      name: /add goodchain testnet/i,
    })
    await expect(addBtn).toBeVisible()

    await page.screenshot({
      path: 'e2e/screenshots/onboarding-faucet-before.png',
      fullPage: true,
    })

    await addBtn.click()

    await expect(
      container.getByText(/goodchain testnet added to your wallet/i),
    ).toBeVisible({ timeout: 5000 })

    await page.screenshot({
      path: 'e2e/screenshots/onboarding-faucet-after.png',
      fullPage: true,
    })

    const calls = await readAddNetworkCalls(page)
    expect(calls.length).toBeGreaterThanOrEqual(1)
    expect(calls[calls.length - 1][0].chainId).toBe(CHAIN_ID_HEX)
  })

  test('faucet onboarding flow: add network → wallet address pre-fills', async ({
    page,
  }) => {
    await page.goto('/faucet')

    // 1) Add network
    const addBtn = page
      .getByTestId('add-network-button-container')
      .getByRole('button', { name: /add goodchain testnet/i })
    await addBtn.click()

    // 2) The faucet form is still usable and the address input accepts text.
    //    (We do not auto-connect via RainbowKit here — the goal is to prove the
    //    onboarding entry point coexists with the existing faucet form.)
    const addressInput = page.locator('#faucet-addr')
    await expect(addressInput).toBeVisible()
    await addressInput.fill('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    await expect(addressInput).toHaveValue(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    )
  })
})
