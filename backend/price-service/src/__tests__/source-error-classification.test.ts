import {
  classifySourceError,
  REASON_CATALOG,
  sanitizeSourceStatus,
} from '../source-status';

/**
 * Task 0049 splits the conflated responsibilities of
 * `redactSourceReason` (sanitise + classify) into two functions:
 *
 *  - `redactSourceReason` keeps redacting (path strip + single line +
 *    bounded length) and is now used only to compute the optional
 *    `detail` machine string.
 *  - `classifySourceError` (NEW) maps any thrown value to a stable
 *    catalog slug. Every production failure now lands in the catalog
 *    (`/docs/source-reasons`) instead of shipping the raw first line
 *    of `err.message` as if it were a slug.
 */
describe('classifySourceError → catalog slug + detail (task 0049)', () => {
  it('MODULE_NOT_FOUND error → etoro-client-not-installed (existing slug)', () => {
    const err = Object.assign(new Error('Cannot find module'), {
      code: 'MODULE_NOT_FOUND',
    });
    const out = classifySourceError(err);
    expect(out.reason).toBe('etoro-client-not-installed');
    expect(out.detail).toBeNull();
  });

  it('arbitrary Error → source-unavailable + redacted detail', () => {
    const err = new Error(
      '⨯ Unable to compile TypeScript:\n/path/to/file.ts:31:5 - error TS2322',
    );
    const out = classifySourceError(err);
    expect(out.reason).toBe('source-unavailable');
    expect(out.detail).toBeDefined();
    expect(out.detail).toMatch(/Unable to compile TypeScript/);
    expect(out.detail).not.toContain('\n');
    expect(out.detail).not.toMatch(/\/path\/to\/file\.ts/);
  });

  it('plain Error message → source-unavailable + verbatim detail', () => {
    const out = classifySourceError(new Error('eToro sandbox is down'));
    expect(out.reason).toBe('source-unavailable');
    expect(out.detail).toBe('eToro sandbox is down');
  });

  it('non-Error string → source-unavailable + null detail', () => {
    const out = classifySourceError('boom');
    expect(out.reason).toBe('source-unavailable');
    expect(out.detail).toBeNull();
  });

  it('non-Error undefined → source-unavailable + null detail', () => {
    const out = classifySourceError(undefined);
    expect(out.reason).toBe('source-unavailable');
    expect(out.detail).toBeNull();
  });

  it('non-Error number → source-unavailable + null detail', () => {
    const out = classifySourceError(42);
    expect(out.reason).toBe('source-unavailable');
    expect(out.detail).toBeNull();
  });

  it('drift gate: every classifier output is a key of REASON_CATALOG', () => {
    const samples: unknown[] = [
      Object.assign(new Error('x'), { code: 'MODULE_NOT_FOUND' }),
      new Error('arbitrary'),
      'literal string',
      undefined,
      42,
      { not: 'an error' },
    ];
    for (const s of samples) {
      const { reason } = classifySourceError(s);
      expect(REASON_CATALOG[reason]).toBeDefined();
    }
  });
});

describe('sanitizeSourceStatus disconnected with detail (task 0049)', () => {
  it('propagates detail when set on the input status', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'source-unavailable',
      detail: 'redacted ts compile error',
      lastAttachAt: null,
    });
    if (!out.connected) {
      expect(out.detail).toBe('redacted ts compile error');
    } else {
      throw new Error('expected disconnected branch');
    }
  });

  it('sets detail to null when omitted on the input status', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    });
    if (!out.connected) {
      expect(out.detail).toBeNull();
    } else {
      throw new Error('expected disconnected branch');
    }
  });

  it('humanReason on the wire equals the catalog prose for the slug', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'source-unavailable',
      detail: 'something',
      lastAttachAt: null,
    });
    if (!out.connected) {
      expect(out.humanReason).toBe(
        REASON_CATALOG['source-unavailable'].humanReason,
      );
      expect(out.severity).toBe('degraded');
    } else {
      throw new Error('expected disconnected branch');
    }
  });
});
