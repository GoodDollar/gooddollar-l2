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
  sparkline7d: number[]
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

export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
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

// ─── Spread config ───────────────────────────────────────────────────────────

/**
 * Default bid/ask spread in basis points for synthetic stock AMM.
 * Derived from eToro typical spread for US large-cap equities (~15bps each side).
 * Will be replaced by real AMM spread data once StockOracleV2 provides it.
 */
export const DEFAULT_STOCK_SPREAD_BPS = 15

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

// ─── Financials / Earnings data ─────────────────────────────────────────────

export interface QuarterlyFinancial {
  quarter: string
  revenue: number
  eps: number
  epsEstimate: number
}

export interface StockFinancials {
  nextEarningsDate: string
  quarters: QuarterlyFinancial[]
}

const FINANCIALS_DATA: Record<string, StockFinancials> = {
  AAPL: {
    nextEarningsDate: 'Jul 31, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 94.8e9, eps: 1.65, epsEstimate: 1.60 },
      { quarter: 'Q1 2026', revenue: 124.3e9, eps: 2.40, epsEstimate: 2.35 },
      { quarter: 'Q4 2025', revenue: 89.5e9, eps: 1.46, epsEstimate: 1.47 },
      { quarter: 'Q3 2025', revenue: 85.8e9, eps: 1.40, epsEstimate: 1.35 },
    ],
  },
  TSLA: {
    nextEarningsDate: 'Jul 22, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 25.7e9, eps: 0.85, epsEstimate: 0.78 },
      { quarter: 'Q1 2026', revenue: 21.3e9, eps: 0.52, epsEstimate: 0.58 },
      { quarter: 'Q4 2025', revenue: 25.2e9, eps: 0.73, epsEstimate: 0.71 },
      { quarter: 'Q3 2025', revenue: 23.4e9, eps: 0.62, epsEstimate: 0.60 },
    ],
  },
  NVDA: {
    nextEarningsDate: 'Aug 20, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 44.1e9, eps: 0.89, epsEstimate: 0.84 },
      { quarter: 'Q1 2026', revenue: 39.3e9, eps: 0.78, epsEstimate: 0.74 },
      { quarter: 'Q4 2025', revenue: 35.1e9, eps: 0.68, epsEstimate: 0.64 },
      { quarter: 'Q3 2025', revenue: 30.0e9, eps: 0.58, epsEstimate: 0.57 },
    ],
  },
  MSFT: {
    nextEarningsDate: 'Jul 22, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 65.6e9, eps: 3.30, epsEstimate: 3.22 },
      { quarter: 'Q1 2026', revenue: 69.6e9, eps: 3.46, epsEstimate: 3.30 },
      { quarter: 'Q4 2025', revenue: 62.0e9, eps: 3.05, epsEstimate: 2.98 },
      { quarter: 'Q3 2025', revenue: 56.5e9, eps: 2.93, epsEstimate: 2.82 },
    ],
  },
  META: {
    nextEarningsDate: 'Jul 23, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 42.3e9, eps: 6.20, epsEstimate: 5.95 },
      { quarter: 'Q1 2026', revenue: 40.1e9, eps: 5.85, epsEstimate: 5.70 },
      { quarter: 'Q4 2025', revenue: 40.1e9, eps: 5.33, epsEstimate: 5.25 },
      { quarter: 'Q3 2025', revenue: 34.1e9, eps: 4.50, epsEstimate: 4.39 },
    ],
  },
  AMZN: {
    nextEarningsDate: 'Jul 24, 2026',
    quarters: [
      { quarter: 'Q2 2026', revenue: 158.9e9, eps: 1.45, epsEstimate: 1.38 },
      { quarter: 'Q1 2026', revenue: 155.7e9, eps: 1.36, epsEstimate: 1.29 },
      { quarter: 'Q4 2025', revenue: 170.0e9, eps: 1.48, epsEstimate: 1.46 },
      { quarter: 'Q3 2025', revenue: 143.1e9, eps: 1.14, epsEstimate: 1.12 },
    ],
  },
}

export function getStockFinancials(ticker: string): StockFinancials | null {
  return FINANCIALS_DATA[ticker] ?? null
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
