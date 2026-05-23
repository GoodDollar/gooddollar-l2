import { InvalidInstrumentOverridesError } from '../errors';
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

  it('returns {} when env var is the empty string', () => {
    expect(loadInstrumentOverrides({ ETORO_INSTRUMENT_OVERRIDES: '' })).toEqual({});
  });

  it('throws InvalidInstrumentOverridesError({ field: "json" }) for malformed JSON', () => {
    try {
      loadInstrumentOverrides({ ETORO_INSTRUMENT_OVERRIDES: 'not json' });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidInstrumentOverridesError);
      expect((e as InvalidInstrumentOverridesError).field).toBe('json');
    }
  });

  it('throws field "shape" for array root', () => {
    try {
      loadInstrumentOverrides({ ETORO_INSTRUMENT_OVERRIDES: '[1,2,3]' });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidInstrumentOverridesError);
      expect((e as InvalidInstrumentOverridesError).field).toBe('shape');
    }
  });

  it('throws field "shape" for bare-string root', () => {
    try {
      loadInstrumentOverrides({ ETORO_INSTRUMENT_OVERRIDES: '"hello"' });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidInstrumentOverridesError);
      expect((e as InvalidInstrumentOverridesError).field).toBe('shape');
    }
  });

  it('throws field "symbol" for an unknown key, naming valid symbols', () => {
    try {
      loadInstrumentOverrides({
        ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({ DOGE: { etoroInstrumentId: 'X' } }),
      });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidInstrumentOverridesError);
      const err = e as InvalidInstrumentOverridesError;
      expect(err.field).toBe('symbol');
      expect(err.offendingKey).toBe('DOGE');
      expect(err.message).toContain('BTC');
    }
  });

  it('throws field "shape" for an empty-string etoroInstrumentId', () => {
    try {
      loadInstrumentOverrides({
        ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({ BTC: { etoroInstrumentId: '' } }),
      });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidInstrumentOverridesError);
      expect((e as InvalidInstrumentOverridesError).field).toBe('shape');
    }
  });

  it('throws field "shape" for a negative referencePriceUsd', () => {
    expect(() => loadInstrumentOverrides({
      ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({ BTC: { referencePriceUsd: -1 } }),
    })).toThrow(InvalidInstrumentOverridesError);
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

  it('keeps merged-override behavior for a clean BTC update', () => {
    const env = {
      ETORO_INSTRUMENT_OVERRIDES: JSON.stringify({
        BTC: { etoroInstrumentId: 'real-id-123', referencePriceUsd: 65_000 },
      }),
    };
    const overrides = loadInstrumentOverrides(env);
    expect(overrides.BTC).toEqual({ etoroInstrumentId: 'real-id-123', referencePriceUsd: 65_000 });
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
