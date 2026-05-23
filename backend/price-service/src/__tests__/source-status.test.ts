import { redactSourceReason, sanitizeSourceStatus } from '../source-status';

describe('redactSourceReason', () => {
  it('returns stable code for MODULE_NOT_FOUND errors', () => {
    const err = new Error(
      "Cannot find module '../../etoro-client/src/index'\n" +
        'Require stack:\n' +
        '- /home/goodclaw/proj/backend/price-service/dist/index.js',
    ) as NodeJS.ErrnoException;
    err.code = 'MODULE_NOT_FOUND';
    expect(redactSourceReason(err)).toBe('etoro-client-not-installed');
  });

  it('strips trailing Require stack and absolute paths from a generic Error', () => {
    const err = new Error(
      "Cannot find module 'x'\nRequire stack:\n- /home/goodclaw/x/y.js",
    );
    const out = redactSourceReason(err);
    expect(out).not.toContain('\n');
    expect(out).not.toMatch(/\/home\//);
    expect(out).not.toContain('Require stack');
    expect(out).not.toContain('node_modules');
    expect(out.length).toBeLessThan(120);
  });

  it('strips inline absolute path on the first line', () => {
    const err = new Error('boom\n  at fn (/home/x/y.js:1:1)');
    const out = redactSourceReason(err);
    expect(out).toBe('boom');
    expect(out).not.toMatch(/\/home\//);
    expect(out).not.toContain('\n');
  });

  it('replaces an absolute path embedded on the first line', () => {
    const err = new Error("ENOENT: no such file or directory, open '/home/x/etoro/cfg.json'");
    const out = redactSourceReason(err);
    expect(out).not.toMatch(/\/home\//);
    expect(out).toContain('<path>');
    expect(out.startsWith('ENOENT')).toBe(true);
  });

  it('replaces a Windows absolute path', () => {
    const err = new Error('ENOENT: no such file, open C:\\Users\\x\\etoro\\cfg.json');
    const out = redactSourceReason(err);
    expect(out).not.toMatch(/[A-Z]:\\/);
    expect(out).toContain('<path>');
  });

  it('returns source-unavailable for non-Error throwables', () => {
    expect(redactSourceReason('boom')).toBe('source-unavailable');
    expect(redactSourceReason(undefined)).toBe('source-unavailable');
    expect(redactSourceReason({ message: 'no' })).toBe('source-unavailable');
  });

  it('echoes a short single-line message verbatim when no path is present', () => {
    const err = new Error('lost connection');
    expect(redactSourceReason(err)).toBe('lost connection');
  });

  it('truncates extremely long messages to under 120 chars', () => {
    const err = new Error('a'.repeat(500));
    const out = redactSourceReason(err);
    expect(out.length).toBeLessThanOrEqual(120);
  });
});

describe('sanitizeSourceStatus', () => {
  it('passes a connected status through unchanged', () => {
    const status = { connected: true as const, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    expect(sanitizeSourceStatus(status)).toEqual(status);
  });

  it('redacts a leaky reason on a disconnected status', () => {
    const status = {
      connected: false as const,
      reason: "Cannot find module 'x'\nRequire stack:\n- /home/goodclaw/y.js",
      lastAttachAt: null,
    };
    const out = sanitizeSourceStatus(status);
    expect(out.connected).toBe(false);
    if (!out.connected) {
      expect(out.reason).not.toContain('\n');
      expect(out.reason).not.toMatch(/\/home\//);
      expect(out.reason).not.toContain('Require stack');
    }
  });

  it('preserves an already-redacted reason', () => {
    const status = {
      connected: false as const,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const out = sanitizeSourceStatus(status);
    if (!out.connected) {
      expect(out.reason).toBe('etoro-client-not-installed');
    }
  });
});
