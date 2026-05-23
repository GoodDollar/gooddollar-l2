import type { Metadata } from 'next'
import { StocksSectionNav } from './StocksSectionNav'

export const metadata: Metadata = {
  title: 'Synthetic Stocks',
  description: 'Trade tokenized equities on GoodDollar L2. Synthetic stocks backed by real price feeds — every fee funds UBI.',
}

/**
 * Endpoints the listing/detail pages fetch immediately after hydration.
 * Preloading them during the HTML stream lets the browser warm DNS,
 * open the connection, and start the request before the React bundle
 * finishes parsing — flattening the first-paint API waterfall.
 */
const FIRST_PAINT_PRELOAD_ENDPOINTS = [
  '/api/status/quotes',
  '/api/status',
  '/api/stocks/rebalance-status',
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
