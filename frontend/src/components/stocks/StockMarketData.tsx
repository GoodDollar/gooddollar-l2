'use client'

/**
 * StockMarketData — wrapper that shows the honest synthetic-stock quote
 * view next to the Buy/Sell ticket on `/stocks/[ticker]` (task 0025).
 *
 * Synthetic stocks are oracle-priced AMM tokens — they do not trade on
 * a CLOB — so the previous OrderBook + RecentTrades panel was pure
 * fabrication. This component now delegates to
 * `<SyntheticStockQuotePanel>`, which renders the oracle mark + AMM
 * slippage curve (Shape A) or an explanatory empty-state (Shape B).
 *
 * The generic <OrderBook> / <RecentTrades> components remain in the
 * tree — perps still consumes them legitimately — but they are no
 * longer mounted on the stocks ticker page.
 */

import type { PriceSource } from '@/lib/priceSource'
import { SyntheticStockQuotePanel } from './SyntheticStockQuotePanel'

interface StockMarketDataProps {
  ticker: string
  markPrice: number
  source: PriceSource
}

export function StockMarketData({ ticker, markPrice, source }: StockMarketDataProps) {
  return <SyntheticStockQuotePanel ticker={ticker} markPrice={markPrice} source={source} />
}
