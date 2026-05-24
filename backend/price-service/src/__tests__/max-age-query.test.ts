import {
  INVALID_REASON_MESSAGE_TAIL,
  InvalidReason,
  MAX_AGE_MS_REGEX,
  MAX_MAX_AGE_MS,
  parseMaxAgeMs,
} from '../max-age-query';

describe('parseMaxAgeMs (task 0081, refined by 0089)', () => {
  it('absent → kind absent (undefined / null only — empty is now invalid)', () => {
    expect(parseMaxAgeMs(undefined)).toEqual({ kind: 'absent' });
    expect(parseMaxAgeMs(null)).toEqual({ kind: 'absent' });
  });

  it('valid 30000 → kind ok value 30000', () => {
    expect(parseMaxAgeMs('30000')).toEqual({ kind: 'ok', value: 30000 });
  });

  it('clamps overflow at MAX_MAX_AGE_MS (24h)', () => {
    expect(parseMaxAgeMs('99999999999')).toEqual({
      kind: 'ok',
      value: MAX_MAX_AGE_MS,
    });
    expect(MAX_MAX_AGE_MS).toBe(86_400_000);
  });

  it('rejects non-string types (number, array, object) with reason="type"', () => {
    expect(parseMaxAgeMs(30000)).toEqual({ kind: 'invalid', reason: 'type' });
    expect(parseMaxAgeMs(['30000'])).toEqual({ kind: 'invalid', reason: 'type' });
    expect(parseMaxAgeMs({})).toEqual({ kind: 'invalid', reason: 'type' });
  });

  it('MAX_AGE_MS_REGEX pattern is documented and testable', () => {
    expect(MAX_AGE_MS_REGEX.source).toBe('^[1-9][0-9]{0,10}$');
    expect(MAX_AGE_MS_REGEX.test('1')).toBe(true);
    expect(MAX_AGE_MS_REGEX.test('86400000')).toBe(true);
    expect(MAX_AGE_MS_REGEX.test('0')).toBe(false);
    expect(MAX_AGE_MS_REGEX.test('01')).toBe(false);
  });

  it('parses the upper-edge 86_400_000 verbatim (no clamp)', () => {
    expect(parseMaxAgeMs('86400000')).toEqual({
      kind: 'ok',
      value: 86_400_000,
    });
  });

  it('parses the lower-edge 1 verbatim', () => {
    expect(parseMaxAgeMs('1')).toEqual({ kind: 'ok', value: 1 });
  });
});

describe('parseMaxAgeMs sub-reason classifier (task 0089)', () => {
  const cases: Array<[string, InvalidReason]> = [
    ['', 'empty'],
    ['0', 'leading-zero'],
    ['00', 'leading-zero'],
    ['030000', 'leading-zero'],
    ['-1', 'negative'],
    ['-500', 'negative'],
    ['-1.5', 'negative'], // sign wins over decimal — first pre-check
    ['1.5', 'decimal'],
    ['0.0', 'decimal'],
    ['999999999999', 'too-many-digits'], // 12 digits, all-digit
    ['12345678901234', 'too-many-digits'], // 14 digits, all-digit
    ['99999999999999999999', 'too-many-digits'],
    ['ABC', 'non-numeric'],
    ['abc', 'non-numeric'],
    ['12x', 'non-numeric'],
    [' 30000', 'non-numeric'], // leading space
    ['30000 ', 'non-numeric'], // trailing space
    ['+30000', 'non-numeric'], // explicit plus
    ['1e6', 'non-numeric'], // scientific
    ['30000a', 'non-numeric'],
  ];

  it.each(cases)('parseMaxAgeMs(%j) classifies as %s', (input, expected) => {
    expect(parseMaxAgeMs(input)).toEqual({ kind: 'invalid', reason: expected });
  });

  it('every InvalidReason has a non-empty message tail in INVALID_REASON_MESSAGE_TAIL', () => {
    const reasons: InvalidReason[] = [
      'type',
      'empty',
      'leading-zero',
      'negative',
      'decimal',
      'too-many-digits',
      'non-numeric',
    ];
    for (const r of reasons) {
      expect(typeof INVALID_REASON_MESSAGE_TAIL[r]).toBe('string');
      expect(INVALID_REASON_MESSAGE_TAIL[r].length).toBeGreaterThan(0);
    }
  });

  it('breaking-change documented: empty string is now invalid (was absent)', () => {
    // task 0089 — `?maxAgeMs=` (empty after parse) used to be treated
    // as `absent` (silent skip). It now returns `invalid` with
    // reason `'empty'` and an omit-hint tail so a templating bug
    // surfaces explicitly. Callers that wanted the silent skip
    // must drop the query param entirely.
    expect(parseMaxAgeMs('')).toEqual({ kind: 'invalid', reason: 'empty' });
  });
});

describe('parseMaxAgeMs drift gate vs MAX_AGE_MS_REGEX (task 0089)', () => {
  it('regex accepts ⇔ parser accepts on a representative corpus', () => {
    // Generate a small corpus mixing accept / reject cases. The
    // canonical regex still owns the boundary; the parser only
    // classifies the WHY of rejection. This pin prevents a future
    // edit from drifting the two.
    const inputs = [
      '1',
      '10',
      '100',
      '1000',
      '1000000',
      '86400000',
      '99999999999',
      // rejects
      '0',
      '-1',
      '1.5',
      '999999999999',
      'abc',
      ' 30000',
      '30000 ',
      '+30000',
      '1e6',
      '030000',
      '12x',
      '',
    ];
    for (const input of inputs) {
      const regexAccepts = input.length > 0 && MAX_AGE_MS_REGEX.test(input);
      const parserAccepts = parseMaxAgeMs(input).kind === 'ok';
      expect(parserAccepts).toBe(regexAccepts);
    }
  });
});
