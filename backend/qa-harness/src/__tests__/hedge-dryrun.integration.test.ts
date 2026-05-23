import { REAL_TRADING_ENABLED, EtoroClient } from '../../../etoro-client/src';
import { HedgeExecutor } from '../../../hedge-engine/src/hedge-executor';
import { HedgeOrder } from '../../../hedge-engine/src/types';
import { createMockEtoro } from '../mock-etoro-server';
import { writeEvidence } from '../evidence';
import { getRunId } from '../run-id';

describe('Lane 6 / hedge-dryrun — dry-run hedge never touches the mock /trading endpoint', () => {
  it('REAL_TRADING_ENABLED is hardcoded false (precondition)', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('HedgeExecutor.execute in dry-run returns etoroOrderId="dry-run" with NO order on mock', async () => {
    const runId = getRunId();
    const t0 = Date.now();

    const client = new EtoroClient({
      credentials: {
        mode: 'sandbox',
        apiKey: 'sandbox-test-key',
        apiSecret: 'sandbox-test-secret',
        baseUrl: 'https://mock.etoro.local/sapi',
      },
    });
    const mock = createMockEtoro({ axios: client.getHttpClient() });

    // Adapter forwards to the client's TradingModule — but dry-run mode in the
    // executor should bypass the adapter entirely.
    const adapter = {
      async openPosition(p: { symbol: string; instrumentId: string; side: 'buy' | 'sell'; amount: number }) {
        const r = await client.trading.openPosition(p);
        return { orderId: r.orderId, status: r.status };
      },
      async closePosition(positionId: string) {
        const r = await client.trading.closePosition(positionId);
        return { orderId: r.orderId };
      },
      async getPositions() {
        const ps = await client.trading.getOpenPositions();
        return ps.map((p) => ({
          positionId: p.positionId,
          symbol: p.symbol,
          side: p.side,
          amount: p.amount,
        }));
      },
    };

    const instrumentMap = new Map([['AAPL', 'INST-AAPL']]);
    const executor = new HedgeExecutor(adapter, instrumentMap, {
      dryRun: true,
      safetyMode: 'sandbox',
    });

    const order: HedgeOrder = {
      symbol: 'AAPL',
      deltaToHedge: 50, // well under $100 demo cap
      reason: 'reconciliation',
    };
    const result = await executor.execute(order);

    const ok =
      result.success &&
      result.etoroOrderId === 'dry-run' &&
      mock.orders.length === 0;
    writeEvidence({
      check: '06-hedge-dryrun',
      ok,
      runId,
      details: {
        durationMs: Date.now() - t0,
        hedgeResult: {
          success: result.success,
          etoroOrderId: result.etoroOrderId,
          timestamp: result.timestamp,
          error: result.error ?? null,
        },
        mockOrderCount: mock.orders.length,
        realTradingEnabled: REAL_TRADING_ENABLED,
      },
    });

    mock.stop();

    expect(result.success).toBe(true);
    expect(result.etoroOrderId).toBe('dry-run');
    expect(mock.orders).toHaveLength(0);
  });
});
