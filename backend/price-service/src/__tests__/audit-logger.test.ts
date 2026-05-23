import fs from 'fs';
import os from 'os';
import path from 'path';
import { AuditLogger } from '../audit-logger';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return computeSpread({
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 95,
    stale: false,
    ...overrides,
  });
}

describe('AuditLogger', () => {
  let tmpDir: string;
  let logPath: string;
  let logger: AuditLogger;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'price-audit-'));
    logPath = path.join(tmpDir, 'audit.log');
    logger = new AuditLogger({ logPath });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it('writes one JSONL line per record', () => {
    logger.record({ accepted: true, quote: makeQuote() });
    logger.record({ accepted: false, reason: 'stale: too old', quote: makeQuote() });

    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.accepted).toBe(true);
    expect(first.quote.symbol).toBe('AAPL');
    expect(first.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(first.reason).toBeUndefined();

    const second = JSON.parse(lines[1]);
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('stale: too old');
  });

  it('accumulates IngestStats across records', () => {
    logger.record({ accepted: true, quote: makeQuote() });
    logger.record({ accepted: true, quote: makeQuote({ symbol: 'TSLA' }) });
    logger.record({ accepted: false, reason: 'stale: 1', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'stale: 2', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'spread-too-wide: 1', quote: makeQuote() });

    const stats = logger.stats();
    expect(stats.ingested).toBe(2);
    expect(stats.rejected).toBe(3);
    expect(stats.byReason.stale).toBe(2);
    expect(stats.byReason['spread-too-wide']).toBe(1);
    expect(stats.firstAtMs).not.toBeNull();
    expect(stats.lastAtMs).not.toBeNull();
    expect(stats.lastAtMs).toBeGreaterThanOrEqual(stats.firstAtMs!);
    expect(stats.writeErrors).toBe(0);
  });

  it('buckets reasons by leading token before the colon', () => {
    logger.record({ accepted: false, reason: 'market-closed: equity session', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'market-closed: index session', quote: makeQuote() });
    logger.record({ accepted: false, reason: 'halted: market is halted', quote: makeQuote() });

    const stats = logger.stats();
    expect(stats.byReason['market-closed']).toBe(2);
    expect(stats.byReason.halted).toBe(1);
  });

  it('uses "unknown" reason bucket when reason is missing on rejection', () => {
    logger.record({ accepted: false, quote: makeQuote() });
    const stats = logger.stats();
    expect(stats.rejected).toBe(1);
    expect(stats.byReason.unknown).toBe(1);
  });

  it('survives write failures without throwing and counts them', () => {
    const badLogger = new AuditLogger({ logPath: '/proc/this-cannot-be-written/audit.log' });
    expect(() => {
      badLogger.record({ accepted: true, quote: makeQuote() });
      badLogger.record({ accepted: false, reason: 'stale: x', quote: makeQuote() });
    }).not.toThrow();

    const stats = badLogger.stats();
    expect(stats.ingested).toBe(1);
    expect(stats.rejected).toBe(1);
    expect(stats.writeErrors).toBeGreaterThanOrEqual(2);
  });

  it('reads default log path from PRICE_AUDIT_LOG_PATH env when not provided', () => {
    const envPath = path.join(tmpDir, 'env-audit.log');
    const prev = process.env.PRICE_AUDIT_LOG_PATH;
    process.env.PRICE_AUDIT_LOG_PATH = envPath;
    try {
      const envLogger = new AuditLogger();
      envLogger.record({ accepted: true, quote: makeQuote() });
      expect(fs.existsSync(envPath)).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.PRICE_AUDIT_LOG_PATH;
      else process.env.PRICE_AUDIT_LOG_PATH = prev;
    }
  });

  it('starts with zero stats and null firstAtMs/lastAtMs before any record', () => {
    const fresh = new AuditLogger({ logPath: path.join(tmpDir, 'fresh.log') });
    const stats = fresh.stats();
    expect(stats.ingested).toBe(0);
    expect(stats.rejected).toBe(0);
    expect(stats.byReason).toEqual({});
    expect(stats.firstAtMs).toBeNull();
    expect(stats.lastAtMs).toBeNull();
    expect(stats.writeErrors).toBe(0);
  });
});
