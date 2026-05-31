/**
 * Viem helpers for verifying on-chain state in E2E tests.
 *
 * Creates a public client (read-only) and a wallet client (write-capable)
 * backed by the canonical devnet RPC (`op-stack/addresses.json`), so test assertions can read balances, call
 * view functions, and submit transactions directly.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { TESTER_PRIVATE_KEY, CHAIN_ID, RPC_URL } from './wallet'

const gooddollarL2 = defineChain({
  id: CHAIN_ID,
  name: 'GoodDollar L2 Devnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: true,
})

const transport = http(RPC_URL)

export const publicClient: PublicClient = createPublicClient({
  chain: gooddollarL2,
  transport,
})

export const walletClient: WalletClient = createWalletClient({
  chain: gooddollarL2,
  transport,
  account: privateKeyToAccount(TESTER_PRIVATE_KEY as `0x${string}`),
})

export const testerAccount = privateKeyToAccount(
  TESTER_PRIVATE_KEY as `0x${string}`,
)
