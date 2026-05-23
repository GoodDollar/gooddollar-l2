import type { EtoroAdapter } from './hedge-executor';

/**
 * Minimal slice of @goodchain/etoro-client's EtoroClient that we need.
 * Typed locally so the hedge-engine package does not require the etoro-client
 * package as a build-time dep — the runtime wire happens via a relative
 * `require('../../etoro-client/src/index')` in `index.ts`, matching the
 * established pattern in `backend/price-service`.
 */
export interface EtoroClientLike {
  trading: {
    openPosition(req: {
      symbol: string;
      instrumentId: string;
      side: 'buy' | 'sell';
      amount: number;
      leverage?: number;
    }): Promise<{ orderId: string; status: string; executionPrice?: number }>;
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
  getMode(): string;
  authenticate?: () => Promise<unknown>;
}

/**
 * Thin wrapper that maps EtoroClient.trading -> the hedge-engine's
 * EtoroAdapter interface used by HedgeExecutor.
 *
 * Constructed with dependency injection for tests; `create()` is the
 * production path that builds a real `createEtoroClient()` instance.
 */
export class EtoroClientAdapter implements EtoroAdapter {
  private readonly client: EtoroClientLike;

  constructor(client: EtoroClientLike) {
    this.client = client;
  }

  getMode(): string {
    return this.client.getMode();
  }

  async openPosition(params: {
    symbol: string;
    instrumentId: string;
    side: 'buy' | 'sell';
    amount: number;
    leverage?: number;
  }): Promise<{ orderId: string; status: string; executionPrice?: number }> {
    const result = await this.client.trading.openPosition({
      symbol: params.symbol,
      instrumentId: params.instrumentId,
      side: params.side,
      amount: params.amount,
      leverage: params.leverage,
    });
    return {
      orderId: result.orderId,
      status: result.status,
      executionPrice: result.executionPrice,
    };
  }

  async closePosition(positionId: string): Promise<{ orderId: string }> {
    const result = await this.client.trading.closePosition(positionId);
    return { orderId: result.orderId };
  }

  async getPositions(): Promise<
    Array<{
      positionId: string;
      symbol: string;
      side: 'buy' | 'sell';
      amount: number;
    }>
  > {
    const positions = await this.client.trading.getOpenPositions();
    return positions.map((p) => ({
      positionId: p.positionId,
      symbol: p.symbol,
      side: p.side,
      amount: p.amount,
    }));
  }

  /**
   * Production constructor — lazily requires the etoro-client package so
   * tests can swap the adapter without pulling in axios/ws at import time.
   */
  static async create(): Promise<EtoroClientAdapter> {
    const mod = require('../../etoro-client/src/index') as {
      createEtoroClient: (config?: unknown) => EtoroClientLike;
    };
    const client = mod.createEtoroClient();
    if (client.authenticate) {
      await client.authenticate();
    }
    return new EtoroClientAdapter(client);
  }
}
