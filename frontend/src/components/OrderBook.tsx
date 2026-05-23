'use client'

/**
 * OrderBook — honest empty state. There is no on-chain CLOB behind the
 * stocks or perps oracle today: stock orders settle against the
 * `CollateralVault` mid and perps settle against the oracle mark, so any
 * rendered depth ladder would have to be fabricated. The previous
 * implementation invented bid/ask rows with RNG jitter on every render
 * — the same anti-pattern that task 0032 ripped out of the Recent
 * Trades tape sitting one tab over.
 *
 * This component is intentionally prop-free. The two call sites
 * (`StockMarketData` right rail and `perps/page` left rail) now render
 * `<OrderBook />` with no inputs. When a real depth feed lands the
 * empty state can be swapped for a live ladder, but never again for a
 * fabricated one.
 */

export function OrderBook() {
  return (
    <div className="text-xs">
      <div
        className="px-3 py-6 text-center"
        role="region"
        aria-label="Order book empty state"
      >
        <div className="text-sm font-medium text-gray-400">
          No on-chain depth available
        </div>
        <div className="mt-1 text-xs text-gray-500 leading-relaxed">
          Orders settle against the on-chain mid. A live order book will appear
          here once a depth feed is wired — none of this is fabricated.
        </div>
      </div>
    </div>
  )
}
