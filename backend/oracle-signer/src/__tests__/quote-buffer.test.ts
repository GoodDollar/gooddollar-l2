import { QuoteBuffer } from '../quote-buffer';
import { NormalizedQuote, SessionState } from '../types';

function makeQuote(symbol: string, mid: number, overrides: Partial<NormalizedQuote> = {}): NormalizedQuote {
  return {
    source: 'etoro',
    symbol,
    instrumentId: '1',
    bid: mid - 0.01,
    ask: mid + 0.01,
    mid,
    last: mid,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 95,
    stale: false,
    ...overrides,
  };
}

describe('QuoteBuffer', () => {
  it('returns all symbols on first pass (no prior submissions)', () => {
    const buffer = new QuoteBuffer(10); // 10 bps = 0.1%
    buffer.update(makeQuote('AAPL', 191.50));
    buffer.update(makeQuote('TSLA', 178.30));

    const updates = buffer.getPendingUpdates();
    expect(updates).toHaveLength(2);
    expect(updates.map(u => u.symbol).sort()).toEqual(['AAPL', 'TSLA']);
  });

  it('filters out symbols below deviation threshold after submission', () => {
    const buffer = new QuoteBuffer(100); // 100 bps = 1%
    buffer.update(makeQuote('AAPL', 191.50));

    const first = buffer.getPendingUpdates();
    expect(first).toHaveLength(1);

    buffer.markSubmitted([{ symbol: 'AAPL', mid: 191.50 }]);

    // Small move: 0.05% — below 1% threshold
    buffer.update(makeQuote('AAPL', 191.60));
    const second = buffer.getPendingUpdates();
    expect(second).toHaveLength(0);
  });

  it('includes symbols that exceed deviation threshold', () => {
    const buffer = new QuoteBuffer(100); // 100 bps = 1%
    buffer.update(makeQuote('AAPL', 191.50));
    buffer.markSubmitted([{ symbol: 'AAPL', mid: 191.50 }]);

    // Large move: ~1.6% — exceeds 1% threshold
    buffer.update(makeQuote('AAPL', 194.50));
    const updates = buffer.getPendingUpdates();
    expect(updates).toHaveLength(1);
    expect(updates[0].symbol).toBe('AAPL');
  });

  it('converts mid price to 8-decimal fixed point correctly', () => {
    const buffer = new QuoteBuffer(0);
    buffer.update(makeQuote('TSLA', 178.30));

    const updates = buffer.getPendingUpdates();
    expect(updates[0].price8).toBe(BigInt(17_830_000_000));
  });

  it('maps session states correctly', () => {
    const buffer = new QuoteBuffer(0);

    const cases: Array<[NormalizedQuote['sessionState'], SessionState]> = [
      ['open', SessionState.Open],
      ['pre-market', SessionState.PreMarket],
      ['after-hours', SessionState.AfterHours],
      ['closed', SessionState.Closed],
      ['halted', SessionState.Halted],
    ];

    for (const [input, expected] of cases) {
      buffer.update(makeQuote('TEST', 100, { sessionState: input }));
      const updates = buffer.getPendingUpdates();
      expect(updates[0].session).toBe(expected);
    }
  });

  it('clamps confidence to 0-100 range', () => {
    const buffer = new QuoteBuffer(0);

    buffer.update(makeQuote('A', 100, { confidence: 150 }));
    let updates = buffer.getPendingUpdates();
    expect(updates[0].confidence).toBe(100);

    buffer.update(makeQuote('B', 100, { confidence: -10 }));
    updates = buffer.getPendingUpdates();
    const b = updates.find(u => u.symbol === 'B');
    expect(b?.confidence).toBe(0);
  });

  it('tracks latest quote per symbol', () => {
    const buffer = new QuoteBuffer(0);
    buffer.update(makeQuote('AAPL', 190.00));
    buffer.update(makeQuote('AAPL', 191.50));

    const quote = buffer.getLatestQuote('AAPL');
    expect(quote?.mid).toBe(191.50);
  });

  it('reports correct symbol count', () => {
    const buffer = new QuoteBuffer(0);
    expect(buffer.symbolCount).toBe(0);

    buffer.update(makeQuote('AAPL', 190));
    buffer.update(makeQuote('TSLA', 178));
    expect(buffer.symbolCount).toBe(2);

    buffer.update(makeQuote('AAPL', 191));
    expect(buffer.symbolCount).toBe(2);
  });

  it('converts timestamp from ms to seconds', () => {
    const tsMs = 1716100000000;
    const buffer = new QuoteBuffer(0);
    buffer.update(makeQuote('AAPL', 190, { timestamp: tsMs }));

    const updates = buffer.getPendingUpdates();
    expect(updates[0].timestamp).toBe(1716100000);
  });

  describe('markSubmitted anchors to the submitted mid, not latestQuotes', () => {
    // Regression for the slow-tx drift: WS quotes that arrive between
    // gate-snapshot and tx-confirm must not move the deviation anchor.
    it('records the mid that was submitted, not the live mid at confirm time', () => {
      const buffer = new QuoteBuffer(10); // 10 bps default
      buffer.update(makeQuote('AAPL', 191.50));

      const snapshot = buffer.getPendingUpdates();
      expect(snapshot[0].symbol).toBe('AAPL');

      // WS quote arrives during the in-flight tx. The buffer's
      // latestQuotes mutates, but the anchor must remain the
      // submitted price.
      buffer.update(makeQuote('AAPL', 191.99));
      buffer.markSubmitted([{ symbol: 'AAPL', mid: 191.50 }]);

      // 191.65 vs anchor 191.50 → 7.83 bps, below 10 bps threshold.
      buffer.update(makeQuote('AAPL', 191.65));
      const after = buffer.getPendingUpdates();
      expect(after).toHaveLength(0);

      // Sanity: had the buggy behavior persisted (anchor = 191.99),
      // 191.65 vs 191.99 = 17.7 bps and the symbol would have been
      // emitted; the test above proves the new anchor is in effect.
    });

    it('ignores entries with non-finite or non-positive mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', 191.50));

      buffer.markSubmitted([
        { symbol: 'AAPL', mid: 191.50 },
        { symbol: 'TSLA', mid: NaN },
        { symbol: 'NVDA', mid: 0 },
      ]);

      // AAPL anchored at 191.50; the other entries are ignored so
      // the next ingest of TSLA/NVDA is treated as a first-time
      // submission (i.e., always emitted).
      buffer.update(makeQuote('TSLA', 178.30));
      buffer.update(makeQuote('NVDA', 1000));
      const pending = buffer.getPendingUpdates().map((u) => u.symbol).sort();
      expect(pending).toEqual(['AAPL', 'NVDA', 'TSLA']);
    });
  });

  describe('NaN/Infinity guards', () => {
    it('silently ignores quotes with NaN mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', NaN));

      expect(buffer.symbolCount).toBe(0);
      expect(buffer.getPendingUpdates()).toHaveLength(0);
    });

    it('silently ignores quotes with Infinity mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', Infinity));

      expect(buffer.symbolCount).toBe(0);
      expect(buffer.getPendingUpdates()).toHaveLength(0);
    });

    it('silently ignores quotes with -Infinity mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', -Infinity));

      expect(buffer.symbolCount).toBe(0);
      expect(buffer.getPendingUpdates()).toHaveLength(0);
    });

    it('silently ignores quotes with zero mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', 0));

      expect(buffer.symbolCount).toBe(0);
      expect(buffer.getPendingUpdates()).toHaveLength(0);
    });

    it('silently ignores quotes with negative mid', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('AAPL', -5.0));

      expect(buffer.symbolCount).toBe(0);
      expect(buffer.getPendingUpdates()).toHaveLength(0);
    });

    it('does not block valid quotes when invalid ones are present', () => {
      const buffer = new QuoteBuffer(0);
      buffer.update(makeQuote('BAD1', NaN));
      buffer.update(makeQuote('AAPL', 191.50));
      buffer.update(makeQuote('BAD2', Infinity));
      buffer.update(makeQuote('TSLA', 178.30));

      const updates = buffer.getPendingUpdates();
      expect(updates).toHaveLength(2);
      expect(updates.map(u => u.symbol).sort()).toEqual(['AAPL', 'TSLA']);
    });
  });
});
