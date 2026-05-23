/**
 * oracleExplorer — single source of truth for "View on explorer" URLs that
 * the OracleStatusBadge attaches to per-rail proof transactions.
 *
 * The map is intentionally small and static. New chains are added by listing
 * the canonical block-explorer base URL alongside the chainId — no probing,
 * no env vars, no per-chain glue. When the requested chainId is unknown the
 * helper returns null so consumers render plain text instead of constructing
 * a broken link.
 */

import { DEVNET_CHAIN_ID, DEVNET_EXPLORER_URL } from './devnet'

export const EXPLORER_BY_CHAIN: Record<number, string> = {
  1: 'https://etherscan.io',
  42220: 'https://celoscan.io',
  [DEVNET_CHAIN_ID]: DEVNET_EXPLORER_URL,
}

export function buildOracleTxLink(
  chainId: number | null | undefined,
  txHash: string | null | undefined,
): string | null {
  if (chainId == null) return null
  if (!txHash || typeof txHash !== 'string') return null
  if (!txHash.startsWith('0x')) return null
  const base = EXPLORER_BY_CHAIN[chainId]
  if (!base) return null
  return `${base.replace(/\/+$/, '')}/tx/${txHash}`
}
