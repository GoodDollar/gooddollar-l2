import { EtoroAdapter } from './hedge-executor';

/**
 * Subset of the @goodchain/etoro-client API the adapter needs. Declared as a
 * structural interface so the hedge-engine package doesn't have to take a
 * hard dependency on etoro-client.
 */
export interface EtoroClientLike {
  getMode?: () => string;
  trading: {
    openPosition(params: {
      symbol: string;
      instrumentId: string;
      side: 'buy' | 'sell';
      amount: number;
      leverage?: number;
    }): Promise<{ orderId: string; status: 'filled' | 'pending' | 'rejected' | string }>;
    closePosition(positionId: string): Promise<{ orderId: string }>;
    getOpenPositions(): Promise<
      Array<{
        positionId: string;
        symbol: string;
        side: 'buy' | 'sell';
        amount: number;
      }>
    >;
  };
}

/**
 * Wraps a real EtoroClient (or any object implementing `EtoroClientLike`)
 * as a hedge-executor adapter.
 *
 * Calls `assertDemoMode` before EACH openPosition — this is the *second*
 * layer of the source-level safety fence (the trading module is the first).
 * Cap enforcement still happens inside `TradingModule`.
 *
 * `assertDemoMode` is injected so the harness can verify the call without
 * needing the cross-package import.
 */
export interface CreateEtoroAdapterOpts {
  /** Asserts demo mode and throws if real-trading is hardcoded off. */
  assertDemoMode?: (mode: 'sandbox' | 'real' | string) => void;
}

export function createEtoroAdapter(
  client: EtoroClientLike,
  opts: CreateEtoroAdapterOpts = {},
): EtoroAdapter {
  const assertDemoMode = opts.assertDemoMode ?? defaultAssertDemoMode;

  return {
    async openPosition(params) {
      assertDemoMode(client.getMode?.() ?? 'demo-trading');
      const result = await client.trading.openPosition(params);
      return { orderId: result.orderId, status: String(result.status) };
    },
    async closePosition(positionId) {
      assertDemoMode(client.getMode?.() ?? 'demo-trading');
      const result = await client.trading.closePosition(positionId);
      return { orderId: result.orderId };
    },
    async getPositions() {
      const positions = await client.trading.getOpenPositions();
      return positions.map((p) => ({
        positionId: p.positionId,
        symbol: p.symbol,
        side: p.side,
        amount: p.amount,
      }));
    },
  };
}

/**
 * Same mirror as in hedge-executor — duplicated here so adapter-only callers
 * (e.g. CLI mode without instantiating an executor) still get the fence.
 */
const REAL_TRADING_ENABLED_MIRROR: false = false;


export class ReadOnlyAdapterError extends Error {
  constructor(operation: string) {
    super(`Read-only eToro adapter: refusing ${operation}`);
    this.name = 'ReadOnlyAdapterError';
  }
}

export function createReadOnlyAdapter(): EtoroAdapter {
  return {
    async openPosition() {
      throw new ReadOnlyAdapterError('openPosition');
    },
    async closePosition() {
      throw new ReadOnlyAdapterError('closePosition');
    },
    async getPositions() {
      return [];
    },
  };
}

export const createEtoroBackedAdapter = createEtoroAdapter;

function defaultAssertDemoMode(mode: string): void {
  if (mode === 'real' && (REAL_TRADING_ENABLED_MIRROR as boolean) !== true) {
    throw new Error(
      'Refusing real-mode eToro adapter: REAL_TRADING_ENABLED is hardcoded ' +
        '`false` (see backend/etoro-client/src/safety.ts). Use sandbox mode.',
    );
  }
}
