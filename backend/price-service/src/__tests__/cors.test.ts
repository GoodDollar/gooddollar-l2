import {
  DEFAULT_CORS_ALLOW_HEADERS,
  MAX_ALLOWED_HEADER_TOKENS,
  parseAllowedHeaders,
} from '../cors';

describe('parseAllowedHeaders — pure helper (task 0079)', () => {
  it('returns the default list when input is undefined', () => {
    expect(parseAllowedHeaders(undefined)).toBe(DEFAULT_CORS_ALLOW_HEADERS);
  });

  it('returns the default list when input is the empty string', () => {
    expect(parseAllowedHeaders('')).toBe(DEFAULT_CORS_ALLOW_HEADERS);
  });

  it('returns a single token verbatim (case preserved)', () => {
    expect(parseAllowedHeaders('X-Request-Id')).toEqual(['X-Request-Id']);
  });

  it('parses a comma-separated list preserving insertion order', () => {
    expect(parseAllowedHeaders('X-Request-Id, Authorization, Prefer')).toEqual([
      'X-Request-Id',
      'Authorization',
      'Prefer',
    ]);
  });

  it('preserves case (lowercase canonical and mixed-case both ride)', () => {
    expect(parseAllowedHeaders('x-request-id')).toEqual(['x-request-id']);
    expect(parseAllowedHeaders('X-Request-Id')).toEqual(['X-Request-Id']);
  });

  it('tolerates whitespace before/after each token', () => {
    expect(parseAllowedHeaders('  X-Request-Id  ,  Authorization  ')).toEqual([
      'X-Request-Id',
      'Authorization',
    ]);
  });

  it('drops malformed tokens (whitespace inside, colon, control chars)', () => {
    expect(parseAllowedHeaders('X-Request-Id, X-Inject: foo, Authorization')).toEqual([
      'X-Request-Id',
      'Authorization',
    ]);
  });

  it('dedupes case-insensitive duplicates (first wins for casing)', () => {
    expect(parseAllowedHeaders('X-Request-Id, x-request-id')).toEqual(['X-Request-Id']);
  });

  it('caps the output at MAX_ALLOWED_HEADER_TOKENS', () => {
    const many = Array.from({ length: 50 }, (_, i) => `Hdr-${i}`);
    const out = parseAllowedHeaders(many.join(','));
    expect(out.length).toBe(MAX_ALLOWED_HEADER_TOKENS);
  });

  it('handles array input shape (duplicate-header coalescing)', () => {
    expect(parseAllowedHeaders(['X-Request-Id', 'Authorization,Prefer'])).toEqual([
      'X-Request-Id',
      'Authorization',
      'Prefer',
    ]);
  });

  it('returns the default list when every token fails the regex', () => {
    expect(parseAllowedHeaders('foo:bar, x y z')).toBe(DEFAULT_CORS_ALLOW_HEADERS);
  });

  it('default list includes at minimum Content-Type, Authorization, X-Request-Id', () => {
    expect(DEFAULT_CORS_ALLOW_HEADERS).toEqual(
      expect.arrayContaining(['Content-Type', 'Authorization', 'X-Request-Id']),
    );
  });
});
