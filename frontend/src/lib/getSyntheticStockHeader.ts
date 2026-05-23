/**
 * getSyntheticStockHeader — task 0022.
 *
 * Single source of copy for the /stocks and /stocks/[ticker] heroes so the
 * synthetic-token claim ("trade 24/7") never appears next to a bare
 * "Market Closed" pill that's actually describing the *underlying* NYSE
 * session. The two facts are individually correct but were composed into a
 * self-contradicting block in iteration #2.
 *
 * The helper takes a `MarketSession` and returns the pill, the subhead, and
 * the InfoBanner description in one tuple. Consumers render them verbatim;
 * the contradiction can't reappear without rewriting this file.
 */

import type { MarketSession } from './marketHours'

export type SyntheticStockHeaderTone = 'live' | 'subdued'

export interface SyntheticStockHeader {
  pillLabel: string
  pillTone: SyntheticStockHeaderTone
  subheadText: string
  infoBannerDescription: string
}

/** Human-readable status of the underlying NYSE/NASDAQ session. */
function describeUnderlyingState(session: MarketSession): string {
  switch (session.state) {
    case 'pre-market':
      return `in pre-market (${session.nextEventLabel.toLowerCase()})`
    case 'after-hours':
      return `in after-hours (${session.nextEventLabel.toLowerCase()})`
    case 'closed':
      return `closed (${session.nextEventLabel})`
    case 'open':
      // Open path is never read by callers — they branch on state first.
      return 'open'
  }
}

export function getSyntheticStockHeader(session: MarketSession): SyntheticStockHeader {
  if (session.state === 'open') {
    return {
      pillLabel: 'Live · oracle ticking',
      pillTone: 'live',
      subheadText:
        'Trade synthetic AAPL, TSLA, NVDA … 24/7. Oracle is publishing live prices from the open underlying session. Every trade funds UBI.',
      infoBannerDescription:
        'Synthetic stock tokens track real equity prices via StockOracleV2. Underlying market is open — oracle is updating live. Every trade routes 33% of fees to UBI.',
    }
  }

  const detail = describeUnderlyingState(session)
  return {
    pillLabel: 'Synthetic · trade 24/7',
    pillTone: 'subdued',
    subheadText:
      `Trade synthetic AAPL, TSLA, NVDA … 24/7 against the last oracle close. Underlying NYSE/NASDAQ is ${detail} — oracle prices will resume updating then. Every trade funds UBI.`,
    infoBannerDescription:
      `Synthetic stock tokens track real equity prices via StockOracleV2. Underlying market is ${detail}; the synthetic remains tradeable 24/7 against the last oracle close. Every trade routes 33% of fees to UBI.`,
  }
}
