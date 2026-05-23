import fs from 'fs';
import os from 'os';
import path from 'path';
import { PriceService, QuoteCache, RiskFilter, WsBroadcaster, createServer, AuditLogger } from '../index';
import { NormalizedQuote, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
    ...overrides,
  };
  return computeSpread(base);
}

describe('PriceService', () => {
  it('exports all public modules', () => {
    expect(QuoteCache).toBeDefined();
    expect(RiskFilter).toBeDefined();
    expect(WsBroadcaster).toBeDefined();
    expect(createServer).toBeDefined();
    expect(PriceService).toBeDefined();
  });

  it('ingests quotes into cache', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL' }));
    expect(service.cache.size).toBe(1);
    expect(service.cache.get('AAPL')?.quote.symbol).toBe('AAPL');
  });

  it('ingests multiple symbols', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL' }));
    service.ingestQuote(makeQuote({ symbol: 'TSLA' }));
    service.ingestQuote(makeQuote({ symbol: 'NVDA' }));
    expect(service.cache.size).toBe(3);
    expect(service.cache.getFresh().length).toBe(3);
  });

  it('filters rejected quotes', () => {
    const service = new PriceService({ port: 0, wsPort: 0 });
    service.ingestQuote(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
    expect(service.cache.size).toBe(0);
    expect(service.cache.getFresh().length).toBe(0);
  });

  describe('audit / ingest stats', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'price-service-audit-'));
    });

    afterEach(() => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    });

    it('records accepted and rejected quotes via the audit logger', () => {
      const logPath = path.join(tmpDir, 'svc.log');
      const auditLogger = new AuditLogger({ logPath });
      const service = new PriceService({ port: 0, wsPort: 0 }, { auditLogger });

      service.ingestQuote(makeQuote({ symbol: 'AAPL' }));
      service.ingestQuote(makeQuote({ symbol: 'TSLA', sessionState: 'halted' }));

      const stats = service.getIngestStats();
      expect(stats.ingested).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.byReason.halted).toBe(1);
      expect(stats.firstAt).not.toBeNull();
      expect(stats.lastAt).not.toBeNull();

      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
      expect(lines).toHaveLength(2);
    });

    it('provides a default audit logger when none is supplied', () => {
      const service = new PriceService({ port: 0, wsPort: 0 });
      expect(service.auditLogger).toBeInstanceOf(AuditLogger);
    });
  });
});
