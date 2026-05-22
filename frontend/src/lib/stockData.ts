/**
 * stockData.ts — Types and formatting utilities for GoodStocks.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainStocks() for stock listings + prices
 *   - useOnChainHoldings() for portfolio positions
 *   - useStockPrices() for live oracle prices
 *
 * This file retains types and formatting functions used by components.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Stock {
  ticker: string
  name: string
  sector: string
  description: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  high52w: number
  low52w: number
  sparkline7d: number[] | null
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
}

export interface PortfolioHolding {
  ticker: string
  shares: number
  avgCost: number
  currentPrice: number
  collateralDeposited: number
  collateralRequired: number
}

export interface TradeRecord {
  id: string
  ticker: string
  side: 'buy' | 'sell'
  shares: number
  price: number
  timestamp: number
  pnl: number
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatStockPrice(price: number): string {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function _formatWithSuffix(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toFixed(0)
}

export function formatLargeNumber(n: number): string {
  return `$${_formatWithSuffix(n)}`
}

export function formatLargeCount(n: number): string {
  return _formatWithSuffix(n)
}

/**
 * formatStockShares — render a share count using the same K/M/B/T
 * vocabulary as `formatLargeNumber`, but WITHOUT the leading `$`
 * because shares are a count, not a USD value. Used by the order
 * summary on `/stocks/[ticker]`.
 *
 * Boundaries match the proven `formatLargeNumber` ladder so the two
 * formatters never disagree on which suffix applies at a given
 * magnitude. NaN / non-finite inputs degrade to `'0'` rather than
 * leaking `'NaN'` or `'Infinity'` into the UI.
 */
export function formatStockShares(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`
  return `${sign}${abs.toFixed(4)}`
}

// ─── Order-form bounds ────────────────────────────────────────────────────────

/**
 * MAX_STOCK_ORDER_USD — highest plausible single-trade notional on
 * the Stocks order form. Calibrated to be ~2 orders of magnitude
 * above the largest realistic devnet/testnet order and far below
 * any number that overflows the downstream `bigint` math in
 * `toG$Wei` / `CollateralVault.mint`.
 *
 * Living in one place so the cap is auditable and easy to tune; do
 * not duplicate the literal in the page or in tests.
 */
export const MAX_STOCK_ORDER_USD = 10_000_000

// ─── Ticker list (for oracle reads) ──────────────────────────────────────────

const TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD']

export function getAllTickers(): string[] {
  return TICKERS
}

// ─── Deprecated mock getters — return empty; use hooks instead ───────────────
// Kept temporarily so pages that haven't migrated don't crash on import.

/** @deprecated Use useOnChainStocks() hook instead */
export function getStockData(): Stock[] { return [] }

/** @deprecated Use useOnChainStocks() hook instead */
export function getStockByTicker(_ticker: string): Stock | undefined { return undefined }

/** @deprecated Use useOnChainHoldings() hook instead */
export function getPortfolioHoldings(): PortfolioHolding[] { return [] }

/** @deprecated Use useOnChainHoldings() hook instead */
export function getTradeHistory(): TradeRecord[] { return [] }

/** @deprecated Use useOnChainHoldings() hook instead */
export function getPortfolioSummary() {
  return { totalValue: 0, totalCost: 0, totalCollateral: 0, totalRequired: 0, unrealizedPnl: 0, pnlPercent: 0, healthRatio: 0 }
}
