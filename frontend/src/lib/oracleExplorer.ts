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

function explorerBase(chainId: number | null | undefined): string | null {
  if (chainId == null) return null
  const base = EXPLORER_BY_CHAIN[chainId]
  return base ? base.replace(/\/+$/, '') : null
}

function isHexAddress(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('0x')
}

export function buildOracleTxLink(
  chainId: number | null | undefined,
  txHash: string | null | undefined,
): string | null {
  if (!isHexAddress(txHash)) return null
  const base = explorerBase(chainId)
  return base ? `${base}/tx/${txHash}` : null
}

export function buildOracleAddressLink(
  chainId: number | null | undefined,
  address: string | null | undefined,
): string | null {
  if (!isHexAddress(address)) return null
  const base = explorerBase(chainId)
  return base ? `${base}/address/${address}` : null
}
