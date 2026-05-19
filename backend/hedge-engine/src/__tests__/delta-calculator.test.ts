import { DeltaCalculator } from '../delta-calculator';
import { OnChainExposure, EtoroPosition, HedgeOrder } from '../types';

function makeExposure(symbol: string, netDelta: number): OnChainExposure {
  return {
    symbol,
    netDelta,
    absExposure: Math.abs(netDelta),
    blockNumber: 100,
    readTimestamp: Date.now(),
  };
}

function makePosition(symbol: string, quantity: number, positionId = 'p1'): EtoroPosition {
  return { symbol, quantity, positionId };
}

describe('DeltaCalculator', () => {
  const calc = new DeltaCalculator({
    deltaThresholdUsd: 5000,
    deltaThresholdPct: 2,
  });

  it('returns empty when no exposure', () => {
    const orders = calc.calculate([], []);
    expect(orders).toEqual([]);
  });

  it('skips symbols with residual below threshold', () => {
    const exposures = [makeExposure('AAPL', 100)];
    const positions = [makePosition('AAPL', -100)];
    const orders = calc.calculate(exposures, positions);
    expect(orders).toEqual([]);
  });

  it('triggers hedge when USD threshold breached', () => {
    const exposures = [makeExposure('AAPL', 10000)];
    const positions: EtoroPosition[] = [];
    const orders = calc.calculate(exposures, positions);

    expect(orders).toHaveLength(1);
    expect(orders[0].symbol).toBe('AAPL');
    expect(orders[0].deltaToHedge).toBe(-10000);
    expect(orders[0].reason).toBe('new_symbol');
  });

  it('triggers hedge when pct threshold breached', () => {
    const exposures = [makeExposure('TSLA', 100000)];
    const positions = [makePosition('TSLA', -97000)];
    const orders = calc.calculate(exposures, positions);

    expect(orders).toHaveLength(1);
    expect(orders[0].symbol).toBe('TSLA');
    expect(orders[0].deltaToHedge).toBe(-3000);
    expect(orders[0].reason).toBe('threshold_breach');
  });

  it('correctly calculates hedge direction: protocol long → sell on eToro', () => {
    const exposures = [makeExposure('NVDA', 20000)];
    const positions: EtoroPosition[] = [];
    const orders = calc.calculate(exposures, positions);

    expect(orders[0].deltaToHedge).toBe(-20000);
  });

  it('correctly calculates hedge direction: protocol short → buy on eToro', () => {
    const exposures = [makeExposure('MSFT', -20000)];
    const positions: EtoroPosition[] = [];
    const orders = calc.calculate(exposures, positions);

    expect(orders[0].deltaToHedge).toBe(20000);
  });

  it('handles multiple symbols', () => {
    const exposures = [
      makeExposure('AAPL', 10000),
      makeExposure('TSLA', -8000),
      makeExposure('NVDA', 50),
    ];
    const positions = [
      makePosition('AAPL', -5000),
      makePosition('TSLA', 3000),
      makePosition('NVDA', -50),
    ];
    const orders = calc.calculate(exposures, positions);

    const aaplOrder = orders.find((o) => o.symbol === 'AAPL');
    const tslaOrder = orders.find((o) => o.symbol === 'TSLA');
    const nvdaOrder = orders.find((o) => o.symbol === 'NVDA');

    expect(aaplOrder).toBeDefined();
    expect(aaplOrder!.deltaToHedge).toBe(-5000);
    expect(tslaOrder).toBeDefined();
    expect(tslaOrder!.deltaToHedge).toBe(5000);
    expect(nvdaOrder).toBeUndefined();
  });

  it('aggregates multiple positions for same symbol', () => {
    const exposures = [makeExposure('META', 20000)];
    const positions = [
      makePosition('META', -8000, 'p1'),
      makePosition('META', -5000, 'p2'),
    ];
    const orders = calc.calculate(exposures, positions);

    expect(orders).toHaveLength(1);
    expect(orders[0].deltaToHedge).toBe(-7000);
  });

  describe('getResiduals', () => {
    it('computes residual per symbol', () => {
      const exposures = [
        makeExposure('AAPL', 10000),
        makeExposure('TSLA', -5000),
      ];
      const positions = [
        makePosition('AAPL', -8000),
        makePosition('TSLA', 3000),
      ];
      const residuals = calc.getResiduals(exposures, positions);
      expect(residuals.get('AAPL')).toBe(2000);
      expect(residuals.get('TSLA')).toBe(-2000);
    });
  });
});
