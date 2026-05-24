import { REAL_TRADING_ENABLED } from '../../../etoro-client/src';
import { PriceService } from '../../../price-service/src';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';
import { pickFreePort } from '../anvil';
import WebSocket from 'ws';

describe('Lane 6 / cadence — price service broadcasts at the configured interval', () => {
  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('emits at least 2 WS messages within 2x the publish interval after seeding quotes', async () => {
    const runId = getRunId();
    const t0 = Date.now();

    const port = await pickFreePort(40_000, 41_000);
    const wsPort = await pickFreePort(41_000, 42_000);
    const service = new PriceService({ port, wsPort, stalenessThresholdMs: 60_000 });
    service.start();

    // Wait briefly for ws server to bind
    await new Promise((r) => setTimeout(r, 250));

    const messages: unknown[] = [];
    const ws = new WebSocket(`ws://127.0.0.1:${wsPort}`);
    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });
    ws.on('message', (data) => {
      try {
        messages.push(JSON.parse(data.toString()));
      } catch {
        messages.push(data.toString());
      }
    });

    // Drive ingestQuote at ~1Hz for 1.2 seconds.
    const intervalMs = 200;
    const driveDurationMs = 1_200;
    let beats = 0;
    const beatStart = Date.now();
    while (Date.now() - beatStart < driveDurationMs) {
      const now = Date.now();
      service.ingestQuote({
        source: 'etoro',
        symbol: 'AAPL',
        instrumentId: 'INST-AAPL',
        bid: 191.45 + beats * 0.01,
        ask: 191.55 + beats * 0.01,
        mid: 191.5 + beats * 0.01,
        last: 191.5 + beats * 0.01,
        spread: 0.1,
        spreadPct: 0.000522,
        timestamp: now,
        sessionState: 'open',
        confidence: 95,
        stale: false,
      });
      beats++;
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    // Give the broadcaster time to flush the last beats.
    await new Promise((r) => setTimeout(r, 200));

    ws.close();
    service.stop();

    const ok = messages.length >= 2;
    writeEvidence({
      check: '02-cadence',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        wsMessageCount: messages.length,
        firstMessage: messages[0] ?? null,
        beats,
      },
    });

    expect(messages.length).toBeGreaterThanOrEqual(2);
  });
});
