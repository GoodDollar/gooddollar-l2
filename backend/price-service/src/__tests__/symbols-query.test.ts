import { MAX_REQUESTED_SYMBOLS, parseSymbolsQuery } from '../symbols-query';

describe('parseSymbolsQuery — pure helper (task 0077)', () => {
  it('returns null when query is undefined', () => {
    expect(parseSymbolsQuery(undefined)).toBeNull();
  });

  it('returns null when query is null', () => {
    expect(parseSymbolsQuery(null)).toBeNull();
  });

  it('returns null when query is an empty string', () => {
    expect(parseSymbolsQuery('')).toBeNull();
  });

  it('returns null when query is whitespace only', () => {
    expect(parseSymbolsQuery('   ,  ,  ')).toBeNull();
  });

  it('parses a single token', () => {
    const result = parseSymbolsQuery('AAPL');
    expect(result).toEqual({
      requested: ['AAPL'],
      invalid: [],
      capped: false,
    });
  });

  it('parses a comma-separated list and uppercases', () => {
    const result = parseSymbolsQuery('aapl,MSFT');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
    expect(result?.invalid).toEqual([]);
    expect(result?.capped).toBe(false);
  });

  it('trims whitespace around tokens', () => {
    const result = parseSymbolsQuery('  AAPL ,  MSFT  ');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
  });

  it('drops empty tokens between commas', () => {
    const result = parseSymbolsQuery('AAPL,,MSFT');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
    expect(result?.invalid).toEqual([]);
  });

  it('dedupes case-insensitive duplicates', () => {
    const result = parseSymbolsQuery('AAPL,aapl,MSFT,AAPL');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
  });

  it('routes invalid tokens to invalid[] and preserves original case', () => {
    const result = parseSymbolsQuery('AAPL,@@@,msft');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
    expect(result?.invalid).toEqual(['@@@']);
  });

  it('treats punctuation-only tokens as invalid via the alnum gate', () => {
    const result = parseSymbolsQuery('AAPL,...,MSFT');
    expect(result?.requested).toEqual(['AAPL', 'MSFT']);
    expect(result?.invalid).toEqual(['...']);
  });

  it('handles array shape from Express duplicate-header coalescing', () => {
    const result = parseSymbolsQuery(['AAPL', 'MSFT,NVDA']);
    expect(result?.requested).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('caps post-trim tokens at MAX_REQUESTED_SYMBOLS', () => {
    const many = Array.from({ length: MAX_REQUESTED_SYMBOLS + 5 }, (_, i) => `SYM${i}`);
    const result = parseSymbolsQuery(many.join(','));
    expect(result?.capped).toBe(true);
    // The total post-validation set is bounded by the cap.
    expect((result?.requested.length ?? 0) + (result?.invalid.length ?? 0))
      .toBeLessThanOrEqual(MAX_REQUESTED_SYMBOLS);
  });

  it('returns capped=false when within the cap', () => {
    const result = parseSymbolsQuery('AAPL,MSFT,NVDA');
    expect(result?.capped).toBe(false);
  });

  it('rejects nested-object shapes (returns null)', () => {
    // qs would synthesise `{symbols: {foo: 'bar'}}` for `?symbols[foo]=bar`.
    expect(parseSymbolsQuery({ foo: 'bar' })).toBeNull();
  });

  it('rejects numeric or boolean input as null (unexpected types)', () => {
    expect(parseSymbolsQuery(42)).toBeNull();
    expect(parseSymbolsQuery(true)).toBeNull();
  });
});
