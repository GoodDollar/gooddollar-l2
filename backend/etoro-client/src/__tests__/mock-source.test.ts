import { MockEtoroSource } from '../mock-source';
import { INSTRUMENT_SYMBOLS } from '../instruments';
import { NormalizedQuote } from '../types';

describe('MockEtoroSource', () => {
  it('emits one quote per subscribed symbol per tick', () => {
    const src = new MockEtoroSource({ seed: 1 });
    src.subscribe(['BTC', 'ETH']);
    const collected: NormalizedQuote[] = [];
    src.onQuote((q) => collected.push(q));

    src.tick();
    expect(collected.map((q) => q.symbol).sort()).toEqual(['BTC', 'ETH']);
    expect(collected[0].source).toBe('etoro');
    expect(collected[0].confidence).toBeGreaterThan(0);
    expect(collected[0].stale).toBe(false);
  });

  it('emits all instrument-map symbols when no explicit subscription is given', () => {
    const src = new MockEtoroSource({ seed: 1 });
    const collected: NormalizedQuote[] = [];
    src.onQuote((q) => collected.push(q));
    src.tick();
    const symbols = collected.map((q) => q.symbol).sort();
    expect(symbols).toEqual([...INSTRUMENT_SYMBOLS].sort());
  });

  it('produces deterministic sequences for the same seed', () => {
    const a = new MockEtoroSource({ seed: 42 });
    const b = new MockEtoroSource({ seed: 42 });
    a.subscribe(['BTC', 'ETH', 'AAPL']);
    b.subscribe(['BTC', 'ETH', 'AAPL']);

    const aQuotes: NormalizedQuote[] = [];
    const bQuotes: NormalizedQuote[] = [];
    a.onQuote((q) => aQuotes.push(q));
    b.onQuote((q) => bQuotes.push(q));

    for (let i = 0; i < 5; i++) {
      a.tick();
      b.tick();
    }

    expect(aQuotes).toHaveLength(bQuotes.length);
    for (let i = 0; i < aQuotes.length; i++) {
      expect(aQuotes[i].symbol).toBe(bQuotes[i].symbol);
      expect(aQuotes[i].mid).toBeCloseTo(bQuotes[i].mid, 10);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = new MockEtoroSource({ seed: 1 });
    const b = new MockEtoroSource({ seed: 999 });
    a.subscribe(['BTC']);
    b.subscribe(['BTC']);
    const aMids: number[] = [];
    const bMids: number[] = [];
    a.onQuote((q) => aMids.push(q.mid));
    b.onQuote((q) => bMids.push(q.mid));
    for (let i = 0; i < 10; i++) { a.tick(); b.tick(); }
    expect(aMids).not.toEqual(bMids);
  });

  it('honors the MarketDataSource interface (start/stop/subscribe/onQuote)', () => {
    const ticks: number[] = [];
    let captured: (() => void) | null = null;
    const fakeSetInterval = (cb: () => void, _ms: number) => {
      captured = cb;
      return Symbol('fake-handle');
    };
    const fakeClearInterval = jest.fn();

    const src = new MockEtoroSource({
      seed: 7,
      setIntervalImpl: fakeSetInterval as unknown as (cb: () => void, ms: number) => unknown,
      clearIntervalImpl: fakeClearInterval,
    });
    src.subscribe(['BTC']);
    const unsub = src.onQuote((q) => ticks.push(q.timestamp));

    src.startStreaming();
    expect(src.isStreaming()).toBe(true);
    if (captured) (captured as () => void)();
    if (captured) (captured as () => void)();
    expect(ticks).toHaveLength(2);

    unsub();
    if (captured) (captured as () => void)();
    expect(ticks).toHaveLength(2);

    src.stopStreaming();
    expect(fakeClearInterval).toHaveBeenCalled();
    expect(src.isStreaming()).toBe(false);
  });

  it('does no network I/O (constructed without an http client)', () => {
    expect(() => new MockEtoroSource()).not.toThrow();
  });

  it('quotes hover near the reference price (within ±2%)', () => {
    const src = new MockEtoroSource({ seed: 1 });
    src.subscribe(['BTC']);
    const mids: number[] = [];
    src.onQuote((q) => mids.push(q.mid));
    for (let i = 0; i < 50; i++) src.tick();
    const referencePrice = 60_000;
    for (const mid of mids) {
      expect(Math.abs(mid - referencePrice) / referencePrice).toBeLessThan(0.02);
    }
  });

  it('caches the most recent quote per symbol via getLatest', () => {
    const src = new MockEtoroSource({ seed: 1 });
    src.subscribe(['ETH']);
    src.tick();
    const latest = src.getLatest('eth');
    expect(latest?.symbol).toBe('ETH');
  });
});
