/**
 * Task 0030 invariant: the /stocks/[ticker] News & Events panel must
 * never render a hardcoded headline set. We feed the panel the page's
 * own `getStockNews(ticker)` payload for every known ticker and assert
 * the forbidden fabrications never appear in the DOM.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'
import { getStockNews } from '@/lib/stockInsights'

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD']
const FORBIDDEN = /Apple supply-chain update|Apple expands on-device AI suite|Services revenue tops \$26B|Market Wire|Tech Ledger|Earnings Desk|News powered by GoodChain/

describe('NewsEventsPanel integration with /stocks/[ticker] page data path', () => {
  it.each(TICKERS)(
    'renders feed-pending empty state for %s — no fabricated headlines or publisher names in DOM',
    (ticker) => {
      const items = getStockNews(ticker)
      const { container } = render(
        <NewsEventsPanel ticker={ticker} isLoading={false} error={null} items={items} />,
      )
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN)
      expect(container.querySelector('[data-testid="news-events-source-pending"]')).not.toBeNull()
    },
  )
})
