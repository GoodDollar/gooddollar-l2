'use client'

import type { Stock } from '@/lib/stockData'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'

const EM_DASH = '—'
const TILE_CLS = 'flex flex-col sm:flex-row sm:items-baseline'
const LABEL_CLS =
  'text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal'
const MUTED_VALUE_CLS = 'text-gray-400 font-medium sm:ml-1.5'

function derive24hRange(price: number, change24h: number) {
  if (change24h === 0) return { high: price, low: price }
  const baseline = price / (1 + change24h / 100)
  return {
    high: Math.max(price, baseline),
    low: Math.min(price, baseline),
  }
}

function isNoMarketData(stock: Stock): boolean {
  return stock.change24h === 0 && stock.volume24h === 0
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={TILE_CLS}>
      <span className={LABEL_CLS}>{label}</span>
      {children}
    </div>
  )
}

function MutedValue({ children }: { children: React.ReactNode }) {
  return <span className={MUTED_VALUE_CLS}>{children}</span>
}

export function StockStatsBar({ stock }: { stock: Stock }) {
  const noData = isNoMarketData(stock)
  const { high, low } = derive24hRange(stock.price, stock.change24h)

  return (
    <div
      data-testid="stock-stats-bar"
      className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-0 text-xs py-2 mb-3"
    >
      <Tile label="Mark">
        <span className="text-white font-medium sm:ml-1.5">{formatStockPrice(stock.price)}</span>
      </Tile>
      <Tile label="24h">
        {noData ? (
          <MutedValue>{EM_DASH}</MutedValue>
        ) : (
          <span
            className={`font-medium sm:ml-1.5 ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {stock.change24h >= 0 ? '▲ +' : '▼ '}
            {stock.change24h.toFixed(2)}%
          </span>
        )}
      </Tile>
      <Tile label="24h H">
        {noData ? (
          <MutedValue>{EM_DASH}</MutedValue>
        ) : (
          <span className="text-green-400 font-medium sm:ml-1.5">{formatStockPrice(high)}</span>
        )}
      </Tile>
      <Tile label="24h L">
        {noData ? (
          <MutedValue>{EM_DASH}</MutedValue>
        ) : (
          <span className="text-red-400 font-medium sm:ml-1.5">{formatStockPrice(low)}</span>
        )}
      </Tile>
      <Tile label="Vol">
        {noData ? (
          <MutedValue>{EM_DASH}</MutedValue>
        ) : (
          <span className="text-white font-medium sm:ml-1.5">{formatLargeNumber(stock.volume24h)}</span>
        )}
      </Tile>
      <Tile label="Funding">
        <MutedValue>{EM_DASH}</MutedValue>
      </Tile>
      <Tile label="OI">
        <MutedValue>{EM_DASH}</MutedValue>
      </Tile>
    </div>
  )
}
