import { MAX_INVALID_REPORTED, MAX_REQUESTED_SYMBOLS, parseSymbolsQuery } from '../symbols-query';

describe('parseSymbolsQuery — pure helper (task 0077)', () => {
  it('returns null when query is undefined', () => {
    expect(parseSymbolsQuery(undefined)).toBeNull();
  });

  it('returns null when query is null', () => {
    expect(parseSymbolsQuery(null)).toBeNull();
  });

  it('returns presentButEmpty sentinel when query is an empty string (task 0088)', () => {
    expect(parseSymbolsQuery('')).toEqual({
      requested: [],
      invalid: [],
      capped: false,
      invalidTotal: 0,
      invalidCapped: false,
      presentButEmpty: true,
    });
  });

  it('returns presentButEmpty sentinel when query is whitespace + commas only (task 0088)', () => {
    expect(parseSymbolsQuery('   ,  ,  ')).toEqual({
      requested: [],
      invalid: [],
      capped: false,
      invalidTotal: 0,
      invalidCapped: false,
      presentButEmpty: true,
    });
  });

  it('returns presentButEmpty sentinel for whitespace-only and commas-only inputs (task 0088)', () => {
    // All three URL-decoded forms collapse to the same "filter
    // discarded" verdict so the handler emits one explicit signal.
    const expected = {
      requested: [],
      invalid: [],
      capped: false,
      invalidTotal: 0,
      invalidCapped: false,
      presentButEmpty: true as const,
    };
    expect(parseSymbolsQuery('   ')).toEqual(expected);
    expect(parseSymbolsQuery(',,,')).toEqual(expected);
    expect(parseSymbolsQuery(' , , , ')).toEqual(expected);
  });

  it('distinguishes absent from present-but-empty (task 0088)', () => {
    expect(parseSymbolsQuery(undefined)).toBeNull();
    expect(parseSymbolsQuery(null)).toBeNull();
    const empty = parseSymbolsQuery('');
    expect(empty).not.toBeNull();
    expect(empty?.presentButEmpty).toBe(true);
  });

  it('parses a single token', () => {
    const result = parseSymbolsQuery('AAPL');
    expect(result).toEqual({
      requested: ['AAPL'],
      invalid: [],
      capped: false,
      invalidTotal: 0,
      invalidCapped: false,
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


  it('dedupes invalid tokens and reports the pre-cap invalid total (task 0090)', () => {
    const result = parseSymbolsQuery('AAPL,@@@,@@@,bad#,Bad#');
    expect(result?.requested).toEqual(['AAPL']);
    expect(result?.invalid).toEqual(['@@@', 'bad#', 'Bad#']);
    expect(result?.invalidTotal).toBe(3);
    expect(result?.invalidCapped).toBe(false);
  });

  it('caps echoed invalid tokens but keeps invalidTotal for hostile floods (task 0090)', () => {
    const invalids = Array.from({ length: MAX_INVALID_REPORTED + 3 }, (_, i) => `BAD#${i}`);
    const result = parseSymbolsQuery(invalids.join(','));
    expect(result?.invalid).toHaveLength(MAX_INVALID_REPORTED);
    expect(result?.invalidTotal).toBe(MAX_INVALID_REPORTED + 3);
    expect(result?.invalidCapped).toBe(true);
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
