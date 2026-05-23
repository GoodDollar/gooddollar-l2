import { REAL_TRADING_ENABLED } from '../../../etoro-client/src';
import { PriceService } from '../../../price-service/src';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

describe('Lane 6 / stale-rejection — risk filter rejects backdated quotes', () => {
  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('a quote older than stalenessThresholdMs is rejected with reason="stale: …" and excluded from getFresh', async () => {
    const runId = getRunId();
    const t0 = Date.now();

    const service = new PriceService({
      // No ports needed for this test — we drive ingestQuote directly.
      port: 0,
      wsPort: 0,
      stalenessThresholdMs: 1_000,
    });

    const staleAgeMs = 60_000;
    const result = service.ingestQuote({
      source: 'etoro',
      symbol: 'AAPL',
      instrumentId: 'INST-AAPL',
      bid: 191.45,
      ask: 191.55,
      mid: 191.5,
      last: 191.5,
      timestamp: Date.now() - staleAgeMs,
      sessionState: 'open',
      confidence: 95,
      stale: false,
    });

    const fresh = service.cache.getFresh();

    const ok = !result.accepted && /^stale:/.test(result.reason ?? '') && fresh.length === 0;
    writeEvidence({
      check: '03-stale-rejection',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        accepted: result.accepted,
        reason: result.reason,
        staleAgeMs,
        cacheFreshCount: fresh.length,
      },
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toMatch(/^stale:/);
    expect(fresh).toHaveLength(0);
  });
});
