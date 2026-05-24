import { CircuitBreakers, OracleFreshnessReader } from '../circuit-breakers';
import { OnChainExposure } from '../types';

function makeExposure(symbol: string, ageMs: number, now: number): OnChainExposure {
  return {
    symbol,
    netDelta: 0,
    absExposure: 0,
    blockNumber: 100,
    readTimestamp: now - ageMs,
  };
}

describe('CircuitBreakers', () => {
  const NOW = Date.UTC(2026, 4, 23, 12, 0, 0); // fixed clock

  it('returns { tripped: false } for fresh inputs', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
    });
    const result = breakers.evaluate({
      exposures: [makeExposure('AAPL', 1_000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    expect(result.tripped).toBe(false);
  });

  it('trips on stale exposure read (age > MAX_EXPOSURE_AGE_MS)', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
    });
    const result = breakers.evaluate({
      exposures: [makeExposure('AAPL', 20_000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    expect(result.tripped).toBe(true);
    expect(result.reason).toBe('exposure_stale');
  });

  it('trips on RPC lag — same block observed across the lag window', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
    });

    // First evaluate: block stays at 100, record the timestamp.
    breakers.evaluate({
      exposures: [makeExposure('AAPL', 1000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    // Second evaluate, 70s later, same block number — RPC has not advanced.
    const result = breakers.evaluate({
      exposures: [makeExposure('AAPL', 1000, NOW + 70_000)],
      lastBlockNumber: 100,
      now: NOW + 70_000,
    });
    expect(result.tripped).toBe(true);
    expect(result.reason).toBe('rpc_lag');
  });

  it('does NOT trip on RPC lag when the block advances', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
    });
    breakers.evaluate({
      exposures: [makeExposure('AAPL', 1000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    const result = breakers.evaluate({
      exposures: [makeExposure('AAPL', 1000, NOW + 70_000)],
      lastBlockNumber: 105, // advanced
      now: NOW + 70_000,
    });
    expect(result.tripped).toBe(false);
  });

  it('trips on chain_mismatch when explorer reports a block far ahead', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
      explorerBlockUrl: 'https://explorer.example/block',
      maxChainBlockLag: 10,
      fetchBlock: jest.fn().mockResolvedValue(500),
    });
    return breakers
      .evaluateAsync({
        exposures: [makeExposure('AAPL', 1000, NOW)],
        lastBlockNumber: 100, // 400 behind
        now: NOW,
      })
      .then((result) => {
        expect(result.tripped).toBe(true);
        expect(result.reason).toBe('chain_mismatch');
      });
  });

  it('does NOT trip on chain_mismatch when within MAX_CHAIN_BLOCK_LAG', async () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
      explorerBlockUrl: 'https://explorer.example/block',
      maxChainBlockLag: 10,
      fetchBlock: jest.fn().mockResolvedValue(105),
    });
    const result = await breakers.evaluateAsync({
      exposures: [makeExposure('AAPL', 1000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    expect(result.tripped).toBe(false);
  });

  it('oracle freshness breaker is disabled by default', async () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
    });
    expect(breakers.isOracleBreakerEnabled()).toBe(false);
  });

  it('oracle freshness trips when enabled and a price is stale', async () => {
    const oracleReader: OracleFreshnessReader = {
      isStale: jest.fn().mockResolvedValue(true),
    };
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 15_000,
      maxRpcLagMs: 60_000,
      oracleReader,
      oracleAddress: '0xORACLE',
    });
    const result = await breakers.evaluateAsync({
      exposures: [makeExposure('AAPL', 1000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    expect(result.tripped).toBe(true);
    expect(result.reason).toBe('oracle_stale');
  });

  it('getState reports the most recent evaluation (for the snapshot HTTP route)', () => {
    const breakers = new CircuitBreakers({
      maxExposureAgeMs: 1_000,
      maxRpcLagMs: 60_000,
    });
    breakers.evaluate({
      exposures: [makeExposure('AAPL', 5_000, NOW)],
      lastBlockNumber: 100,
      now: NOW,
    });
    const state = breakers.getState();
    expect(state.tripped).toBe(true);
    expect(state.reason).toBe('exposure_stale');
    expect(state.timestamp).toBe(NOW);
  });
});
