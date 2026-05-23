import type { Metadata } from 'next'
import { StocksSectionNav } from './StocksSectionNav'
import {
  STOCKS_LISTING_SYMBOLS,
  buildRebalanceStatusUrl,
} from '@/lib/stocksDefaultSymbols'

export const metadata: Metadata = {
  title: 'Synthetic Stocks',
  description: 'Trade tokenized equities on GoodDollar L2. Synthetic stocks backed by real price feeds — every fee funds UBI.',
}

/**
 * Endpoints the listing/detail pages fetch immediately after hydration.
 * Preloading them during the HTML stream lets the browser warm DNS,
 * open the connection, and start the request before the React bundle
 * finishes parsing — flattening the first-paint API waterfall.
 *
 * Task 0049: the rebalance-status preload uses the SAME `?symbols=…`
 * shape (built by the shared `buildRebalanceStatusUrl` helper from
 * the canonical listing symbol set) that the page's hook fetches at
 * runtime — so the browser can satisfy the runtime fetch from the
 * preload cache instead of issuing a second round-trip for different
 * URL bytes. Detail pages (`/stocks/[ticker]`) fetch a single ticker;
 * the listing-set preload is harmless for them (unused) — same as the
 * pre-fix behavior.
 */
const FIRST_PAINT_PRELOAD_ENDPOINTS = [
  '/api/status/quotes',
  '/api/status',
  buildRebalanceStatusUrl(STOCKS_LISTING_SYMBOLS),
] as const

export default function StocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {FIRST_PAINT_PRELOAD_ENDPOINTS.map((href) => (
        <link key={href} rel="preload" href={href} as="fetch" crossOrigin="anonymous" />
      ))}
      <StocksSectionNav />
      {children}
    </>
  )
}
