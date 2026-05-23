import { HedgeEngine } from '../engine';
import { ExposureReader } from '../exposure-reader';
import { DeltaCalculator } from '../delta-calculator';
import { HedgeExecutor } from '../hedge-executor';
import {
  HedgeEngineConfig,
  OnChainExposure,
  EtoroPosition,
  HedgeOrder,
  HedgeResult,
} from '../types';

/**
 * Integration test: full reconciliation loop
 *
 * Exercises Engine.tick() end-to-end with mock ExposureReader and HedgeExecutor,
 * using the REAL DeltaCalculator to prove orders are computed correctly.
 */

function makeConfig(overrides?: Partial<HedgeEngineConfig>): HedgeEngineConfig {
  return {
    rpcUrl: 'http://localhost:8545',
    riskEngineAddress: '0x' + 'a'.repeat(40),
    symbols: ['AAPL', 'TSLA', 'NVDA'],
    deltaThresholdUsd: 5000,
    deltaThresholdPct: 2,
    pollIntervalMs: 60_000,
    dryRun: true,
    mode: 'mock',
    tradingEnabled: false,
    ...overrides,
  };
}

function makeExposure(
  symbol: string,
  netDelta: number,
  absExposure?: number,
): OnChainExposure {
  return {
    symbol,
    netDelta,
    absExposure: absExposure ?? Math.abs(netDelta),
    blockNumber: 42,
    readTimestamp: Date.now(),
  };
}

function mockReader(exposures: OnChainExposure[]): jest.Mocked<ExposureReader> {
  return {
    getAllExposures: jest.fn().mockResolvedValue(exposures),
    getExposure: jest.fn(),
  } as unknown as jest.Mocked<ExposureReader>;
}

function mockExecutor(
  positions: EtoroPosition[],
): jest.Mocked<HedgeExecutor> {
  return {
    fetchPositions: jest.fn().mockResolvedValue(positions),
    executeAll: jest.fn().mockImplementation((orders: HedgeOrder[]) =>
      Promise.resolve(
        orders.map((o) => ({
          order: o,
          success: true,
          etoroOrderId: `dry-${o.symbol}-${Date.now()}`,
          timestamp: Date.now(),
        })),
      ),
    ),
    execute: jest.fn(),
  } as unknown as jest.Mocked<HedgeExecutor>;
}

describe('Hedge Reconciliation Loop Integration', () => {
  it('full cycle: 3 symbols with mixed exposures produce correct orders', async () => {
    // On-chain: AAPL +50k (protocol long), TSLA -20k (protocol short), NVDA +3k (below threshold)
    // NVDA absExposure is large (500k) so the 3k residual is only 0.6% — below both thresholds
    const exposures = [
      makeExposure('AAPL', 50_000),
      makeExposure('TSLA', -20_000),
      makeExposure('NVDA', 3_000, 500_000),
    ];

    // eToro already partially hedged: AAPL short -35k, TSLA none, NVDA none
    const etoroPositions: EtoroPosition[] = [
      { symbol: 'AAPL', quantity: -35_000 },
    ];

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig());

    const snapshot = await engine.tick();

    expect(snapshot).not.toBeNull();
    expect(reader.getAllExposures).toHaveBeenCalledWith(['AAPL', 'TSLA', 'NVDA']);
    expect(executor.fetchPositions).toHaveBeenCalled();

    // AAPL residual: etoroPos + onChainDelta = -35000 + 50000 = +15000 → |15000| > 5000 → order: -15000
    // TSLA residual: 0 + (-20000) = -20000 → |20000| > 5000 → order: +20000
    // NVDA residual: 0 + 3000 = +3000 → |3000| < 5000 → no order
    const executedOrders = executor.executeAll.mock.calls[0][0] as HedgeOrder[];
    expect(executedOrders).toHaveLength(2);

    const aaplOrder = executedOrders.find((o) => o.symbol === 'AAPL')!;
    expect(aaplOrder.deltaToHedge).toBe(-15_000);
    expect(aaplOrder.reason).toBe('threshold_breach');

    const tslaOrder = executedOrders.find((o) => o.symbol === 'TSLA')!;
    expect(tslaOrder.deltaToHedge).toBe(20_000);
    expect(tslaOrder.reason).toBe('new_symbol');

    // NVDA should NOT be in orders
    expect(executedOrders.find((o) => o.symbol === 'NVDA')).toBeUndefined();
  });

  it('all residuals below USD threshold → no orders executed', async () => {
    // Use large absExposure so pct threshold (2%) isn't breached either
    // Residuals: AAPL=1000 (0.5%), TSLA=-1000 (0.5%), NVDA=500 (0.25%) — all below $5k and 2%
    const exposures = [
      makeExposure('AAPL', 2_000, 200_000),
      makeExposure('TSLA', -1_500, 200_000),
      makeExposure('NVDA', 4_000, 200_000),
    ];

    // eToro positions roughly offset on-chain exposure
    const etoroPositions: EtoroPosition[] = [
      { symbol: 'AAPL', quantity: -1_000 },
      { symbol: 'TSLA', quantity: 500 },
      { symbol: 'NVDA', quantity: -3_500 },
    ];

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig());

    const snapshot = await engine.tick();

    expect(snapshot).not.toBeNull();
    // No orders should be placed (all residuals < $5k and < 2%)
    expect(executor.executeAll).not.toHaveBeenCalled();
    expect(snapshot!.hedgesExecuted).toHaveLength(0);
  });

  it('USD threshold breach triggers hedge order', async () => {
    const exposures = [makeExposure('AAPL', 40_000)];
    // eToro short -25k, residual = -25000 + 40000 = +15000 > 5000
    const etoroPositions: EtoroPosition[] = [{ symbol: 'AAPL', quantity: -25_000 }];

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig({ symbols: ['AAPL'] }));

    const snapshot = await engine.tick();

    const orders = executor.executeAll.mock.calls[0][0] as HedgeOrder[];
    expect(orders).toHaveLength(1);
    expect(orders[0].symbol).toBe('AAPL');
    expect(orders[0].deltaToHedge).toBe(-15_000);
  });

  it('percentage threshold breach triggers hedge order', async () => {
    // absExposure = 100k, residual = 3000, pct = 3% > 2% threshold
    const exposures = [makeExposure('AAPL', 50_000, 100_000)];
    // eToro -47k, residual = -47000 + 50000 = 3000. |3000| < $5000 USD threshold
    // But 3000/100000 = 3% > 2% pct threshold → triggers
    const etoroPositions: EtoroPosition[] = [{ symbol: 'AAPL', quantity: -47_000 }];

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig({ symbols: ['AAPL'] }));

    const snapshot = await engine.tick();

    const orders = executor.executeAll.mock.calls[0][0] as HedgeOrder[];
    expect(orders).toHaveLength(1);
    expect(orders[0].deltaToHedge).toBe(-3_000);
  });

  it('protocol long → eToro SELL (negative deltaToHedge)', async () => {
    // Protocol net long +20k (users are long, protocol needs short hedge)
    const exposures = [makeExposure('TSLA', 20_000)];
    const etoroPositions: EtoroPosition[] = []; // no hedge yet

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig({ symbols: ['TSLA'] }));

    await engine.tick();

    const orders = executor.executeAll.mock.calls[0][0] as HedgeOrder[];
    expect(orders[0].symbol).toBe('TSLA');
    expect(orders[0].deltaToHedge).toBe(-20_000); // sell on eToro
    expect(orders[0].reason).toBe('new_symbol');
  });

  it('protocol short → eToro BUY (positive deltaToHedge)', async () => {
    // Protocol net short -15k (users are short, protocol needs long hedge)
    const exposures = [makeExposure('NVDA', -15_000)];
    const etoroPositions: EtoroPosition[] = []; // no hedge yet

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig({ symbols: ['NVDA'] }));

    await engine.tick();

    const orders = executor.executeAll.mock.calls[0][0] as HedgeOrder[];
    expect(orders[0].symbol).toBe('NVDA');
    expect(orders[0].deltaToHedge).toBe(15_000); // buy on eToro
    expect(orders[0].reason).toBe('new_symbol');
  });

  it('reconciliation report contains all required fields', async () => {
    const exposures = [
      makeExposure('AAPL', 50_000),
      makeExposure('TSLA', -20_000),
    ];
    const etoroPositions: EtoroPosition[] = [
      { symbol: 'AAPL', quantity: -35_000 },
    ];

    const reader = mockReader(exposures);
    const executor = mockExecutor(etoroPositions);
    const calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });
    const engine = new HedgeEngine(reader, calculator, executor, makeConfig({ symbols: ['AAPL', 'TSLA'] }));

    const snapshot = await engine.tick();

    // Structural assertions on the report
    expect(snapshot!.timestamp).toBeGreaterThan(0);
    expect(snapshot!.exposures).toHaveLength(2);
    expect(snapshot!.etoroPositions).toHaveLength(1);
    expect(snapshot!.hedgesExecuted).toHaveLength(2);
    expect(snapshot!.residuals).toBeInstanceOf(Map);
    expect(snapshot!.residuals.get('AAPL')).toBe(15_000);
    expect(snapshot!.residuals.get('TSLA')).toBe(-20_000);

    // Verify hedge results have success flags
    for (const result of snapshot!.hedgesExecuted) {
      expect(result.success).toBe(true);
      expect(result.etoroOrderId).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    }
  });
});
