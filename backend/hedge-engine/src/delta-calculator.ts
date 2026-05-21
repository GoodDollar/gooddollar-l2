import {
  OnChainExposure,
  EtoroPosition,
  HedgeOrder,
  StockSymbol,
  HedgeEngineConfig,
} from './types';

/**
 * Computes which hedge orders to place on eToro given current on-chain
 * exposure and existing eToro positions.
 *
 * Hedge logic:
 *   residual = onChainDelta + etoroPosition
 *   If |residual| > threshold → place order to zero out the residual.
 *
 * The on-chain delta is positive when the protocol is net long users
 * (i.e. users hold net long synthetic exposure, so the protocol must
 * hedge by going short on eToro, meaning a negative eToro position).
 *
 * Desired eToro position = -onChainDelta
 * Residual = currentEtoroPosition - (-onChainDelta) = currentEtoro + onChainDelta
 * Order = -residual  (to bring residual to zero)
 */
export class DeltaCalculator {
  constructor(private readonly config: Pick<HedgeEngineConfig, 'deltaThresholdUsd' | 'deltaThresholdPct'>) {}

  /**
   * Builds a map of symbol → current eToro quantity from an array of positions.
   */
  private buildPositionMap(positions: EtoroPosition[]): Map<StockSymbol, number> {
    const map = new Map<StockSymbol, number>();
    for (const p of positions) {
      map.set(p.symbol, (map.get(p.symbol) ?? 0) + p.quantity);
    }
    return map;
  }

  /**
   * Calculate hedge orders needed.
   * Returns only orders that breach the configured thresholds.
   */
  calculate(
    exposures: OnChainExposure[],
    etoroPositions: EtoroPosition[],
  ): HedgeOrder[] {
    const posMap = this.buildPositionMap(etoroPositions);
    const orders: HedgeOrder[] = [];

    for (const exp of exposures) {
      const currentEtoro = posMap.get(exp.symbol) ?? 0;
      const residual = currentEtoro + exp.netDelta;
      const absResidual = Math.abs(residual);

      const breachesUsd = absResidual >= this.config.deltaThresholdUsd;
      const breachesPct =
        exp.absExposure > 0 &&
        absResidual / exp.absExposure >= this.config.deltaThresholdPct / 100;

      if (!breachesUsd && !breachesPct) continue;

      const isNewSymbol = currentEtoro === 0 && exp.netDelta !== 0;

      orders.push({
        symbol: exp.symbol,
        deltaToHedge: -residual,
        reason: isNewSymbol ? 'new_symbol' : 'threshold_breach',
      });
    }

    return orders;
  }

  /**
   * Returns the residual delta per symbol (for monitoring / alerting).
   */
  getResiduals(
    exposures: OnChainExposure[],
    etoroPositions: EtoroPosition[],
  ): Map<StockSymbol, number> {
    const posMap = this.buildPositionMap(etoroPositions);
    const residuals = new Map<StockSymbol, number>();

    for (const exp of exposures) {
      const currentEtoro = posMap.get(exp.symbol) ?? 0;
      residuals.set(exp.symbol, currentEtoro + exp.netDelta);
    }

    return residuals;
  }
}
