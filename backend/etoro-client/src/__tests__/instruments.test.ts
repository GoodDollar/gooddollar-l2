import {
  applyInstrumentOverrides,
  getInstrument,
  INSTRUMENT_MAP,
  INSTRUMENT_SYMBOLS,
  isLaneSymbol,
  loadInstrumentOverrides,
} from '../instruments';

describe('INSTRUMENT_MAP', () => {
  it('contains the lane-1 symbols (BTC, ETH, SOL, AAPL, TSLA, NVDA, META, SPY)', () => {
    expect(INSTRUMENT_SYMBOLS).toEqual(['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'NVDA', 'META', 'SPY']);
    for (const sym of INSTRUMENT_SYMBOLS) {
      expect(INSTRUMENT_MAP[sym]).toBeDefined();
      expect(INSTRUMENT_MAP[sym].symbol).toBe(sym);
      expect(INSTRUMENT_MAP[sym].etoroInstrumentId).toMatch(/^ETORO-/);
      expect(INSTRUMENT_MAP[sym].referencePriceUsd).toBeGreaterThan(0);
    }
  });

  it('round-trips symbol → metadata via getInstrument', () => {
    expect(getInstrument('BTC')?.assetClass).toBe('crypto');
    expect(getInstrument('AAPL')?.assetClass).toBe('equity');
    expect(getInstrument('SPY')?.assetClass).toBe('etf');
  });

  it('returns null for unknown symbols', () => {
    expect(getInstrument('UNKNOWN')).toBeNull();
    expect(isLaneSymbol('UNKNOWN')).toBe(false);
  });
});

describe('loadInstrumentOverrides', () => {
  it('returns {} when env var is unset', () => {
    expect(loadInstrumentOverrides({})).toEqual({});
  });

  it('returns {} when env var is malformed JSON', () => {
    expect(loadInstrumentOverrides({ ETORO_INSTRUMENT_OVERRIDES: 'not json' })).toEqual({});
  });

  it('parses valid override JSON for known symbols', () => {
    const env = {
      ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({
        BTC: { etoroInstrumentId: 'INST-100' },
        AAPL: { etoroInstrumentId: 'INST-AAPL', displayName: 'Apple Override' },
      }),
    };
    const overrides = loadInstrumentOverrides(env);
    expect(overrides.BTC?.etoroInstrumentId).toBe('INST-100');
    expect(overrides.AAPL?.displayName).toBe('Apple Override');
  });

  it('drops unknown symbols silently', () => {
    const env = {
      ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({
        FOO: { etoroInstrumentId: 'INST-FOO' },
      }),
    };
    expect(loadInstrumentOverrides(env)).toEqual({});
  });

  it('rejects non-string ids and non-positive prices', () => {
    const env = {
      ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({
        BTC: { etoroInstrumentId: 123, referencePriceUsd: -10 },
      }),
    };
    expect(loadInstrumentOverrides(env)).toEqual({});
  });
});

describe('applyInstrumentOverrides', () => {
  it('returns a fresh map preserving fields not in overrides', () => {
    const merged = applyInstrumentOverrides(INSTRUMENT_MAP, {
      BTC: { etoroInstrumentId: 'BTC-LIVE-42' },
    });
    expect(merged.BTC.etoroInstrumentId).toBe('BTC-LIVE-42');
    expect(merged.BTC.assetClass).toBe('crypto');
    expect(merged.AAPL.etoroInstrumentId).toBe(INSTRUMENT_MAP.AAPL.etoroInstrumentId);
  });

  it('does not mutate the original frozen INSTRUMENT_MAP', () => {
    applyInstrumentOverrides(INSTRUMENT_MAP, {
      AAPL: { displayName: 'Mutated' },
    });
    expect(INSTRUMENT_MAP.AAPL.displayName).toBe('Apple Inc.');
  });
});
