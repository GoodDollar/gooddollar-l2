/**
 * Task 0029 invariant: the /stocks/[ticker] page-level data path used by
 * `StockDetailContent` must never feed `AnalystOutlookCard` a hardcoded
 * "Street consensus aggregate" object. We render the card with the page's
 * own `getAnalystOutlook(ticker)` for every known ticker and assert the
 * forbidden fabrications never appear in the DOM.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'
import { getAnalystOutlook } from '@/lib/stockInsights'

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD']
const FORBIDDEN = /Street consensus aggregate|37 analysts|Buy 73%|Hold 24%|Sell 3%|as of May 2026/

describe('AnalystOutlook integration with /stocks/[ticker] page data path', () => {
  it.each(TICKERS)(
    'renders feed-pending empty state for %s — no Street consensus literals in DOM',
    (ticker) => {
      const outlook = getAnalystOutlook(ticker)
      const { container } = render(
        <AnalystOutlookCard currentPrice={200} outlook={outlook} isLoading={false} />,
      )
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN)
      expect(container.querySelector('[data-testid="analyst-outlook-source-pending"]')).not.toBeNull()
    },
  )
})
