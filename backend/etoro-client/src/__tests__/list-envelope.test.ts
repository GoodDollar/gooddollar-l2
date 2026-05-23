import {
  LIST_ENVELOPE_KEYS,
  readListEnvelope,
  readListOrAudit,
  MalformedListSink,
} from '../util/list-envelope';
import { MalformedListResponseError } from '../errors';
import { AuditLogger } from '../audit-logger';
import { AuditLogEntry } from '../types';

function recordingAudit(): { audit: AuditLogger; entries: AuditLogEntry[] } {
  const entries: AuditLogEntry[] = [];
  const audit = new AuditLogger('demo-readonly', {
    logPath: '/dev/null',
    appendImpl: (_p, line) => { entries.push(JSON.parse(line) as AuditLogEntry); },
    mkdirImpl: () => undefined,
    consoleErrorImpl: () => undefined,
  });
  return { audit, entries };
}

function makeSink(overrides: Partial<MalformedListSink> = {}): MalformedListSink {
  return {
    counter: new Map<string, number>(),
    throwOnMalformed: false,
    ...overrides,
  };
}

describe('LIST_ENVELOPE_KEYS', () => {
  it('is the de-duped, ordered union of the three legacy extractArray copies', () => {
    expect([...LIST_ENVELOPE_KEYS]).toEqual([
      'data', 'items', 'results',
      'instruments', 'quotes', 'candles',
      'positions', 'orders', 'trades', 'history',
    ]);
  });

  it('contains no duplicates', () => {
    expect(new Set(LIST_ENVELOPE_KEYS).size).toBe(LIST_ENVELOPE_KEYS.length);
  });
});

describe('readListEnvelope', () => {
  it('returns kind=array when input is an array', () => {
    const out = readListEnvelope([1, 2, 3], LIST_ENVELOPE_KEYS);
    expect(out).toEqual({ kind: 'array', items: [1, 2, 3] });
  });

  it('returns kind=envelope when input contains a known list key', () => {
    const out = readListEnvelope({ data: [1] }, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({ kind: 'envelope', items: [1], key: 'data' });
  });

  it('matches every key in LIST_ENVELOPE_KEYS', () => {
    for (const key of LIST_ENVELOPE_KEYS) {
      const out = readListEnvelope({ [key]: [42] }, LIST_ENVELOPE_KEYS);
      expect(out).toEqual({ kind: 'envelope', items: [42], key });
    }
  });

  it('first-match wins per LIST_ENVELOPE_KEYS order', () => {
    const out = readListEnvelope({ items: [2], data: [1] }, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({ kind: 'envelope', items: [1], key: 'data' });
  });

  it('returns malformed object-no-match when no allowed key holds an array', () => {
    const out = readListEnvelope({ weird: 'x' }, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'object-no-match',
      topLevelKeys: ['weird'],
    });
  });

  it('returns malformed null for null input', () => {
    const out = readListEnvelope(null, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'null',
      topLevelKeys: [],
    });
  });

  it('returns malformed null for undefined input', () => {
    const out = readListEnvelope(undefined, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'null',
      topLevelKeys: [],
    });
  });

  it('returns malformed primitive for number input', () => {
    const out = readListEnvelope(42, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'primitive',
      topLevelKeys: [],
    });
  });

  it('returns malformed primitive for string input', () => {
    const out = readListEnvelope('hello', LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'primitive',
      topLevelKeys: [],
    });
  });

  it('returns malformed for empty object', () => {
    const out = readListEnvelope({}, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'object-no-match',
      topLevelKeys: [],
    });
  });

  it('sorts topLevelKeys alphabetically for stable diagnostics', () => {
    const out = readListEnvelope({ zeta: 'x', alpha: 'y' }, LIST_ENVELOPE_KEYS);
    expect(out.kind).toBe('malformed');
    if (out.kind === 'malformed') {
      expect(out.topLevelKeys).toEqual(['alpha', 'zeta']);
    }
  });

  it('never throws on hostile input', () => {
    const inputs: unknown[] = [
      Symbol('x'),
      true,
      false,
      0,
      NaN,
      () => undefined,
      new Map(),
      new Set(),
    ];
    for (const i of inputs) {
      expect(() => readListEnvelope(i, LIST_ENVELOPE_KEYS)).not.toThrow();
    }
  });

  it('treats an envelope value that is not an array as a non-match', () => {
    const out = readListEnvelope({ data: 'not-a-list' }, LIST_ENVELOPE_KEYS);
    expect(out).toEqual({
      kind: 'malformed',
      observedShape: 'object-no-match',
      topLevelKeys: ['data'],
    });
  });
});

describe('MalformedListResponseError', () => {
  it('carries all four diagnostic fields as readonly props', () => {
    const err = new MalformedListResponseError({
      action: 'getQuotes',
      observedShape: 'object-no-match',
      topLevelKeys: ['weird', 'other'],
      path: '/api/v1/market-data/quotes',
    });
    expect(err.name).toBe('MalformedListResponseError');
    expect(err.action).toBe('getQuotes');
    expect(err.observedShape).toBe('object-no-match');
    expect(err.topLevelKeys).toEqual(['weird', 'other']);
    expect(err.path).toBe('/api/v1/market-data/quotes');
  });

  it('embeds all four fields into the message string for fast triage', () => {
    const err = new MalformedListResponseError({
      action: 'getOpenPositions',
      observedShape: 'null',
      topLevelKeys: [],
      path: '/api/v1/positions',
    });
    expect(err.message).toContain('getOpenPositions');
    expect(err.message).toContain('null');
    expect(err.message).toContain('/api/v1/positions');
  });

  it('is a real Error subclass (instanceof checks work)', () => {
    const err = new MalformedListResponseError({
      action: 'getInstruments',
      observedShape: 'primitive',
      topLevelKeys: [],
      path: '/api/v1/market-data/instruments',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MalformedListResponseError);
  });
});

describe('readListOrAudit', () => {
  it('returns items unchanged for a raw array', () => {
    const sink = makeSink();
    const out = readListOrAudit({
      data: [{ a: 1 }, { a: 2 }],
      action: 'getQuotes',
      path: '/p',
      sink,
    });
    expect(out).toEqual([{ a: 1 }, { a: 2 }]);
    expect(sink.counter.size).toBe(0);
  });

  it('returns items from a recognized envelope key', () => {
    const sink = makeSink();
    const out = readListOrAudit({
      data: { quotes: [{ s: 'BTC' }] },
      action: 'getQuotes',
      path: '/p',
      sink,
    });
    expect(out).toEqual([{ s: 'BTC' }]);
    expect(sink.counter.size).toBe(0);
  });

  it('audits and returns [] for malformed envelope (default flag off)', () => {
    const { audit, entries } = recordingAudit();
    const sink = makeSink({ audit });
    const out = readListOrAudit({
      data: { weird: 'x' },
      action: 'getQuotes',
      path: '/api/v1/market-data/quotes',
      sink,
    });
    expect(out).toEqual([]);
    expect(sink.counter.get('getQuotes')).toBe(1);
    const lines = entries.filter((e) => e.action === 'getQuotes-malformed');
    expect(lines).toHaveLength(1);
    expect(lines[0].method).toBe('PARSE');
    expect(lines[0].path).toBe('/api/v1/market-data/quotes');
    expect(lines[0].error).toBe(
      'MalformedListResponse: object-no-match keys=[weird]',
    );
  });

  it('throws MalformedListResponseError when throwOnMalformed=true', () => {
    const { audit, entries } = recordingAudit();
    const sink = makeSink({ audit, throwOnMalformed: true });
    expect(() => readListOrAudit({
      data: null,
      action: 'getInstruments',
      path: '/api/v1/market-data/instruments',
      sink,
    })).toThrow(MalformedListResponseError);
    expect(sink.counter.get('getInstruments')).toBe(1);
    expect(entries.filter((e) => e.action === 'getInstruments-malformed'))
      .toHaveLength(1);
  });

  it('still increments + audits even when audit logger is absent', () => {
    const sink = makeSink();
    const out = readListOrAudit({
      data: 42,
      action: 'getCandles',
      path: '/p',
      sink,
    });
    expect(out).toEqual([]);
    expect(sink.counter.get('getCandles')).toBe(1);
  });

  it('accumulates counts across calls', () => {
    const sink = makeSink();
    for (let i = 0; i < 5; i++) {
      readListOrAudit({
        data: { weird: i },
        action: 'getQuotes',
        path: '/p',
        sink,
      });
    }
    expect(sink.counter.get('getQuotes')).toBe(5);
  });
});
