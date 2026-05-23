import fs from 'fs';
import os from 'os';
import path from 'path';
import { PriceService, QuoteCache, RiskFilter, WsBroadcaster, createServer, AuditLogger, envPort } from '../index';
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
      expect(stats.firstAtMs).not.toBeNull();
      expect(stats.lastAtMs).not.toBeNull();

      const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
      expect(lines).toHaveLength(2);
    });

    it('provides a default audit logger when none is supplied', () => {
      const service = new PriceService({ port: 0, wsPort: 0 });
      expect(service.auditLogger).toBeInstanceOf(AuditLogger);
    });
  });

  describe('source status', () => {
    it('default source status is not-attached / disconnected', () => {
      const svc = new PriceService({ port: 0, wsPort: 0 });
      expect(svc.getSourceStatus()).toEqual({
        connected: false,
        reason: 'not-attached',
        lastAttachAt: null,
      });
    });

    it('setSourceStatus(connected) is observable via getSourceStatus', () => {
      const svc = new PriceService({ port: 0, wsPort: 0 });
      svc.setSourceStatus({
        connected: true,
        symbols: ['AAPL', 'TSLA'],
        lastAttachAt: 12345,
      });
      const got = svc.getSourceStatus();
      expect(got.connected).toBe(true);
      if (got.connected) {
        expect(got.symbols).toEqual(['AAPL', 'TSLA']);
        expect(got.lastAttachAt).toBe(12345);
      }
    });

    it('setSourceStatus(disconnected) is observable via getSourceStatus', () => {
      const svc = new PriceService({ port: 0, wsPort: 0 });
      svc.setSourceStatus({
        connected: false,
        reason: 'lost connection',
        lastAttachAt: 999,
      });
      const got = svc.getSourceStatus();
      expect(got.connected).toBe(false);
      if (!got.connected) {
        expect(got.reason).toBe('lost connection');
        expect(got.lastAttachAt).toBe(999);
      }
    });
  });

  describe('bootAtMs', () => {
    it('PriceService.start wires bootAtMs through to /health and /audit/stats', async () => {
      const service = new PriceService({ port: 0, wsPort: 0 });
      service.start();
      try {
        const httpServer = (service as unknown as { httpServer: import('http').Server }).httpServer;
        const addr = httpServer.address() as import('net').AddressInfo;
        const baseUrl = `http://127.0.0.1:${addr.port}`;
        const hRes = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, number>;
        const aRes = (await (await fetch(`${baseUrl}/audit/stats`)).json()) as Record<string, number>;
        expect(typeof hRes.bootAtMs).toBe('number');
        expect(hRes.bootAtMs).toBe(service.bootAtMs);
        expect(aRes.bootAtMs).toBe(service.bootAtMs);
        expect(hRes.uptimeMs).toBeGreaterThanOrEqual(0);
        expect(aRes.uptimeMs).toBeGreaterThanOrEqual(0);
      } finally {
        service.stop();
      }
    });
  });

  describe('envPort', () => {
    const ENV_NAME = '__TEST_PRICE_SERVICE_PORT__';

    afterEach(() => {
      delete process.env[ENV_NAME];
    });

    it('returns undefined when unset', () => {
      expect(envPort(ENV_NAME)).toBeUndefined();
    });

    it('parses a valid port', () => {
      process.env[ENV_NAME] = '9300';
      expect(envPort(ENV_NAME)).toBe(9300);
    });

    it('returns undefined for empty string', () => {
      process.env[ENV_NAME] = '';
      expect(envPort(ENV_NAME)).toBeUndefined();
    });

    it('returns undefined for non-numeric', () => {
      process.env[ENV_NAME] = 'not-a-port';
      expect(envPort(ENV_NAME)).toBeUndefined();
    });

    it('returns undefined for negative or zero ports', () => {
      process.env[ENV_NAME] = '0';
      expect(envPort(ENV_NAME)).toBeUndefined();
      process.env[ENV_NAME] = '-1';
      expect(envPort(ENV_NAME)).toBeUndefined();
    });
  });
});
