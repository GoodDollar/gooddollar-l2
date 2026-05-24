import { HedgeEngine } from '../engine';
import { ExposureReader } from '../exposure-reader';
import { DeltaCalculator } from '../delta-calculator';
import { HedgeExecutor } from '../hedge-executor';
import { HedgeEngineConfig, OnChainExposure } from '../types';

jest.useFakeTimers();

function makeConfig(overrides?: Partial<HedgeEngineConfig>): HedgeEngineConfig {
  return {
    rpcUrl: 'http://localhost:8545',
    riskEngineAddress: '0x' + '1'.repeat(40),
    symbols: ['AAPL', 'TSLA'],
    deltaThresholdUsd: 5000,
    deltaThresholdPct: 2,
    pollIntervalMs: 10000,
    dryRun: true,
    mode: 'mock',
    tradingEnabled: false,
    ...overrides,
  };
}

function makeExposure(symbol: string, netDelta: number): OnChainExposure {
  return {
    symbol,
    netDelta,
    absExposure: Math.abs(netDelta),
    blockNumber: 100,
    readTimestamp: Date.now(),
  };
}

describe('HedgeEngine', () => {
  let mockReader: jest.Mocked<ExposureReader>;
  let calculator: DeltaCalculator;
  let mockExecutor: jest.Mocked<HedgeExecutor>;

  beforeEach(() => {
    mockReader = {
      getAllExposures: jest.fn().mockResolvedValue([
        makeExposure('AAPL', 10000),
        makeExposure('TSLA', -8000),
      ]),
      getExposure: jest.fn(),
    } as unknown as jest.Mocked<ExposureReader>;

    calculator = new DeltaCalculator({ deltaThresholdUsd: 5000, deltaThresholdPct: 2 });

    mockExecutor = {
      fetchPositions: jest.fn().mockResolvedValue([]),
      executeAll: jest.fn().mockResolvedValue([
        {
          order: { symbol: 'AAPL', deltaToHedge: -10000, reason: 'new_symbol' },
          success: true,
          etoroOrderId: 'dry-run',
          timestamp: Date.now(),
        },
        {
          order: { symbol: 'TSLA', deltaToHedge: 8000, reason: 'new_symbol' },
          success: true,
          etoroOrderId: 'dry-run',
          timestamp: Date.now(),
        },
      ]),
      execute: jest.fn(),
    } as unknown as jest.Mocked<HedgeExecutor>;
  });

  it('tick reads exposures, calculates, and executes hedges', async () => {
    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    const snapshot = await engine.tick();

    expect(mockReader.getAllExposures).toHaveBeenCalledWith(['AAPL', 'TSLA']);
    expect(mockExecutor.fetchPositions).toHaveBeenCalled();
    expect(mockExecutor.executeAll).toHaveBeenCalled();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.exposures).toHaveLength(2);
    expect(snapshot!.hedgesExecuted).toHaveLength(2);
  });

  it('stores last snapshot', async () => {
    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    expect(engine.getLastSnapshot()).toBeNull();
    await engine.tick();
    expect(engine.getLastSnapshot()).not.toBeNull();
  });

  it('start/stop controls the loop', () => {
    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    expect(engine.isRunning()).toBe(false);
    engine.start();
    expect(engine.isRunning()).toBe(true);
    engine.stop();
    expect(engine.isRunning()).toBe(false);
  });

  it('does not double-start', () => {
    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    engine.start();
    engine.start();
    expect(engine.isRunning()).toBe(true);
    engine.stop();
  });

  it('skips concurrent tick when previous tick is still in-flight', async () => {
    let resolveExposures: (value: OnChainExposure[]) => void;
    const slowExposures = new Promise<OnChainExposure[]>((resolve) => {
      resolveExposures = resolve;
    });

    mockReader.getAllExposures.mockReturnValue(slowExposures as any);

    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    const tick1 = engine.tick();
    const tick2Result = await engine.tick();

    expect(tick2Result).toBeNull();
    expect(mockReader.getAllExposures).toHaveBeenCalledTimes(1);

    resolveExposures!([makeExposure('AAPL', 10000), makeExposure('TSLA', -8000)]);
    const tick1Result = await tick1;
    expect(tick1Result).not.toBeNull();
    expect(tick1Result!.exposures).toHaveLength(2);
  });

  it('allows next tick after previous completes', async () => {
    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    const first = await engine.tick();
    expect(first).not.toBeNull();

    const second = await engine.tick();
    expect(second).not.toBeNull();
    expect(mockReader.getAllExposures).toHaveBeenCalledTimes(2);
  });

  it('releases tick lock even when tick throws', async () => {
    mockReader.getAllExposures.mockRejectedValueOnce(new Error('RPC down'));

    const config = makeConfig();
    const engine = new HedgeEngine(mockReader, calculator, mockExecutor, config);

    await expect(engine.tick()).rejects.toThrow('RPC down');

    mockReader.getAllExposures.mockResolvedValue([
      makeExposure('AAPL', 10000),
      makeExposure('TSLA', -8000),
    ]);
    const snap = await engine.tick();
    expect(snap).not.toBeNull();
  });
});
