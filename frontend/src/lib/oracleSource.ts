/**
 * oracleSource — single source of truth for the "Source: …" provenance
 * line the OracleStatusBadge renders under both variants.
 *
 * Three small pieces assemble the string:
 *   - upstream label (e.g. "eToro demo" / "mock")
 *   - publisher contract name (per-rail: stocks → StockOracleV2,
 *     crypto → SwapPriceOracle)
 *   - network name (devnet / anvil / Ethereum / Celo / chain <id>)
 *
 * When `cached: true` is set (the `useStocksFallback` cached-snapshot path)
 * we short-circuit to `"Source: cached snapshot"` instead of inventing
 * provenance we cannot prove.
 */

export type OracleRail = 'stocks' | 'crypto'

const RAIL_PUBLISHER: Record<OracleRail, string> = {
  stocks: 'StockOracleV2',
  crypto: 'SwapPriceOracle',
}

// Known crypto symbols routed via the SwapPriceOracle rail. Listed inline
// because the lane only carries three live tickers today; adding new ones
// is a one-line follow-up.
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'WETH'])

export function isCryptoRailSymbol(symbol: string): boolean {
  return CRYPTO_SYMBOLS.has(symbol.toUpperCase())
}

export function railForSymbol(symbol: string | undefined): OracleRail {
  return symbol && isCryptoRailSymbol(symbol) ? 'crypto' : 'stocks'
}

export function publisherForRail(rail: OracleRail): string {
  return RAIL_PUBLISHER[rail]
}

export function chainName(chainId: number | null | undefined): string {
  if (chainId == null) return 'awaiting chain'
  switch (chainId) {
    case 1: return 'Ethereum'
    case 42220: return 'Celo'
    case 42069: return 'devnet'
    case 31337: return 'anvil'
    default: return `chain ${chainId}`
  }
}

export function buildSourceLine(opts: {
  upstreamLabel?: string | null
  rail: OracleRail
  chainId: number | null | undefined
  cached?: boolean
}): string {
  if (opts.cached) return 'Source: cached snapshot'
  const upstream = opts.upstreamLabel?.trim() || 'mock'
  const publisher = RAIL_PUBLISHER[opts.rail]
  const network = chainName(opts.chainId)
  return `Source: ${upstream} → ${publisher} (${network})`
}
