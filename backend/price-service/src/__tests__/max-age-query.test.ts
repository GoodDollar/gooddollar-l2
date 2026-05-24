import {
  MAX_AGE_MS_REGEX,
  MAX_MAX_AGE_MS,
  parseMaxAgeMs,
} from '../max-age-query';

describe('parseMaxAgeMs (task 0081)', () => {
  it('absent → kind absent', () => {
    expect(parseMaxAgeMs(undefined)).toEqual({ kind: 'absent' });
    expect(parseMaxAgeMs(null)).toEqual({ kind: 'absent' });
    expect(parseMaxAgeMs('')).toEqual({ kind: 'absent' });
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

  it('rejects malformed strings with reason="shape"', () => {
    const bad = [
      'abc',
      '-1',
      '0',
      '1.5',
      '1e6',
      '30000a',
      '030000',
      ' 30000',
      '30000 ',
      '+30000',
      '99999999999999999999',
    ];
    for (const s of bad) {
      expect(parseMaxAgeMs(s)).toMatchObject({ kind: 'invalid', reason: 'shape' });
    }
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
