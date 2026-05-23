import { EtoroClient } from '@goodchain/etoro-client';
import { EtoroAdapter } from './hedge-executor';

/**
 * Thin field-projection wrapper around `EtoroClient.trading`. Backs the
 * hedge-engine's `EtoroAdapter` contract with the official demo trading
 * endpoints (per task 0017's `/trading/execution/demo/market-open-orders/by-amount`
 * etc.). No business logic — the adapter exists solely so `HedgeExecutor`
 * can stay testable against a small interface while production calls
 * land at `EtoroClient.trading.*`.
 */
export function createEtoroBackedAdapter(client: EtoroClient): EtoroAdapter {
  return {
    async openPosition(params) {
      const result = await client.trading.openPosition({
        instrumentId: params.instrumentId,
        symbol: params.symbol,
        side: params.side,
        amount: params.amount,
        leverage: params.leverage ?? 1,
      });
      return { orderId: result.orderId, status: result.status };
    },
    async closePosition(positionId) {
      const result = await client.trading.closePosition(positionId);
      return { orderId: result.orderId };
    },
    async getPositions() {
      const raw = await client.trading.getOpenPositions();
      return raw.map((p) => ({
        positionId: p.positionId,
        symbol: p.symbol,
        side: p.side,
        amount: p.amount,
      }));
    },
  };
}

/**
 * Read-only sentinel adapter for `demo-readonly` / `real-disabled` /
 * disabled-trading paths. Returns an empty position book and throws
 * loudly on any mutation. This is the "fail closed at the adapter
 * boundary" pattern — if the executor's `readOnly` flag is ever bypassed
 * by a future code path, the adapter still refuses to issue orders.
 */
export class ReadOnlyAdapterError extends Error {
  constructor(action: 'openPosition' | 'closePosition') {
    super(
      `hedge-engine refuses to ${action}: adapter is read-only ` +
      '(ETORO_MODE is not demo-trading, or HEDGE_TRADING_ENABLED is false)',
    );
    this.name = 'ReadOnlyAdapterError';
  }
}

export function createReadOnlyAdapter(): EtoroAdapter {
  return {
    async openPosition() { throw new ReadOnlyAdapterError('openPosition'); },
    async closePosition() { throw new ReadOnlyAdapterError('closePosition'); },
    async getPositions() { return []; },
  };
}
