import { expect, type Page } from '@playwright/test'
import { publicClient, walletClient } from '../fixtures/chain'
import { CONTRACTS } from '../../src/lib/devnet'
import { MarginVaultABI, PerpEngineABI } from '../../src/lib/abi'

const PerpEngineFeeSplitterABI = [
  {
    name: 'feeSplitter',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const

const PerpFeeSplitterABI = [
  {
    name: 'goodDollar',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'setGoodDollar',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_goodDollar', type: 'address' }],
    outputs: [],
  },
] as const

/**
 * Devnet PerpUBIFeeSplitter is sometimes deployed with the Anvil placeholder
 * goodDollar (0x5FbDB…, no code). openPosition() then reverts at fee routing.
 * Idempotent: align splitter.goodDollar with MarginVault.collateral().
 */
export async function ensurePerpFeeSplitterConfigured(): Promise<void> {
  const feeSplitter = await publicClient.readContract({
    address: CONTRACTS.PerpEngine,
    abi: PerpEngineFeeSplitterABI,
    functionName: 'feeSplitter',
  })
  const collateral = await publicClient.readContract({
    address: CONTRACTS.MarginVault,
    abi: MarginVaultABI,
    functionName: 'collateral',
  })
  const goodDollar = await publicClient.readContract({
    address: feeSplitter,
    abi: PerpFeeSplitterABI,
    functionName: 'goodDollar',
  })
  if (goodDollar.toLowerCase() === collateral.toLowerCase()) return

  const hash = await walletClient.writeContract({
    address: feeSplitter,
    abi: PerpFeeSplitterABI,
    functionName: 'setGoodDollar',
    args: [collateral],
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

/**
 * Wait until the perps order form is ready for a market open (oracle + deploy gates).
 * Avoids clicking submit while sync/deploy guards still block the CTA.
 */
export async function waitForPerpsOrderFormSettled(page: Page): Promise<void> {
  await expect(page.locator('h1', { hasText: 'Perpetual Futures' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/0xf3…2266/i)).toBeVisible({ timeout: 15_000 })

  const submit = page.locator('button[type="submit"]').filter({ hasText: /Long|Short/ })
  await expect(submit).toBeVisible({ timeout: 15_000 })

  await expect
    .poll(
      async () => {
        if (await page.getByText(/Trading paused|Risk-increasing action blocked/i).isVisible().catch(() => false)) {
          return false
        }
        if (await page.getByText(/PerpEngine not deployed/i).isVisible().catch(() => false)) {
          return false
        }
        return !(await submit.isDisabled())
      },
      {
        message: 'perps order form should settle (submit enabled, no sync/deploy block)',
        timeout: 60_000,
        intervals: [500, 1000, 2000],
      },
    )
    .toBe(true)
}

/**
 * After submit, wait for either on-chain position reads or the open-positions UI row.
 */
export async function waitForOpenPositionSettled(
  page: Page,
  readOnChain: () => Promise<boolean>,
): Promise<void> {
  const panel = page.getByTestId('open-positions-panel')

  await expect
    .poll(
      async () => {
        const uiOpen = await panel
          .getByText(/LONG \d+x|SHORT \d+x/)
          .isVisible()
          .catch(() => false)
        if (uiOpen) return 'ui'
        if (await readOnChain()) return 'chain'
        return ''
      },
      {
        message: 'open position should appear in UI or on-chain after Order Placed',
        timeout: 90_000,
        intervals: [1000, 2000, 3000],
      },
    )
    .not.toBe('')

  await expect(panel.getByRole('heading', { name: 'Open Positions' })).toBeVisible()
  await expect(panel.getByText('No open positions')).not.toBeVisible({ timeout: 30_000 })
  await expect(panel.getByText(/LONG \d+x|SHORT \d+x/)).toBeVisible({ timeout: 15_000 })
}
