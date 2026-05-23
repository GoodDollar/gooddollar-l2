import {
  redactSourceReason,
  sanitizeSourceStatus,
  enrichSourceReason,
  REASON_CATALOG,
} from '../source-status';

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

describe('REASON_CATALOG and enrichSourceReason', () => {
  it('catalog covers the three known reason slugs', () => {
    expect(REASON_CATALOG['not-attached'].severity).toBe('info');
    expect(REASON_CATALOG['etoro-client-not-installed'].severity).toBe('critical');
    expect(REASON_CATALOG['source-unavailable'].severity).toBe('degraded');
  });

  it('every catalog entry has non-empty humanReason and nextStep strings', () => {
    for (const doc of Object.values(REASON_CATALOG)) {
      expect(typeof doc.humanReason).toBe('string');
      expect(doc.humanReason.length).toBeGreaterThan(0);
      expect(typeof doc.nextStep).toBe('string');
      expect(doc.nextStep.length).toBeGreaterThan(0);
    }
  });

  it('enrichSourceReason returns the catalog entry for a known code', () => {
    const doc = enrichSourceReason('etoro-client-not-installed');
    expect(doc.code).toBe('etoro-client-not-installed');
    expect(doc.severity).toBe('critical');
  });

  it('enrichSourceReason synthesises a code:"unknown" entry for an unrecognised reason', () => {
    const doc = enrichSourceReason('connection-refused');
    expect(doc.code).toBe('unknown');
    expect(doc.severity).toBe('degraded');
    expect(doc.humanReason).toContain('connection-refused');
    expect(doc.nextStep).toMatch(/logs|catalog/i);
  });
});

describe('sanitizeSourceStatus — reason catalog enrichment', () => {
  it('enriches not-attached with humanReason, nextStep, severity:info', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    expect(out.connected).toBe(false);
    if (!out.connected) {
      expect(out.reason).toBe('not-attached');
      expect(out.humanReason).toMatch(/booting|attach/i);
      expect(out.nextStep).toMatch(/wait|logs/i);
      expect(out.severity).toBe('info');
    }
  });

  it('enriches etoro-client-not-installed with severity:critical', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    if (!out.connected) {
      expect(out.severity).toBe('critical');
      expect(out.humanReason).toMatch(/lane-1|etoro-client/);
      expect(out.nextStep).toMatch(/install|rebuild/i);
    }
  });

  it('enriches source-unavailable with severity:degraded', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'source-unavailable',
      lastAttachAt: null,
    });
    if (!out.connected) expect(out.severity).toBe('degraded');
  });

  it('falls back to code:unknown for an unrecognised reason but keeps the message safe', () => {
    const out = sanitizeSourceStatus({
      connected: false,
      reason: 'lost connection',
      lastAttachAt: null,
    });
    if (!out.connected) {
      expect(out.severity).toBe('degraded');
      expect(out.humanReason).toContain('lost connection');
      expect(out.nextStep).toMatch(/logs|catalog/i);
    }
  });
});
