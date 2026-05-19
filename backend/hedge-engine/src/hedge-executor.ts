import { HedgeOrder, HedgeResult, EtoroPosition, StockSymbol } from './types';

/**
 * Adapter interface so we can inject the real eToro client or a mock.
 * Maps to a subset of EtoroClient.trading + EtoroClient.account.
 */
export interface EtoroAdapter {
  openPosition(params: {
    symbol: string;
    instrumentId: string;
    side: 'buy' | 'sell';
    amount: number;
    leverage?: number;
  }): Promise<{ orderId: string; status: string }>;

  closePosition(positionId: string): Promise<{ orderId: string }>;

  getPositions(): Promise<
    Array<{
      positionId: string;
      symbol: string;
      side: 'buy' | 'sell';
      amount: number;
    }>
  >;
}

/**
 * Executes hedge orders on eToro and reads current eToro positions.
 * Wraps all calls in try/catch to produce HedgeResult.
 */
export class HedgeExecutor {
  private readonly adapter: EtoroAdapter;
  private readonly instrumentMap: Map<StockSymbol, string>;
  private readonly dryRun: boolean;

  constructor(
    adapter: EtoroAdapter,
    instrumentMap: Map<StockSymbol, string>,
    dryRun = false,
  ) {
    this.adapter = adapter;
    this.instrumentMap = instrumentMap;
    this.dryRun = dryRun;
  }

  async fetchPositions(): Promise<EtoroPosition[]> {
    const raw = await this.adapter.getPositions();
    return raw.map((p) => ({
      symbol: p.symbol,
      quantity: p.side === 'sell' ? -p.amount : p.amount,
      positionId: p.positionId,
    }));
  }

  async execute(order: HedgeOrder): Promise<HedgeResult> {
    const ts = Date.now();

    if (this.dryRun) {
      console.log(`[DRY-RUN] Would hedge ${order.symbol}: delta=${order.deltaToHedge} (${order.reason})`);
      return { order, success: true, etoroOrderId: 'dry-run', timestamp: ts };
    }

    const instrumentId = this.instrumentMap.get(order.symbol);
    if (!instrumentId) {
      return {
        order,
        success: false,
        error: `No instrument ID mapped for symbol ${order.symbol}`,
        timestamp: ts,
      };
    }

    try {
      const side: 'buy' | 'sell' = order.deltaToHedge > 0 ? 'buy' : 'sell';
      const amount = Math.abs(order.deltaToHedge);

      const result = await this.adapter.openPosition({
        symbol: order.symbol,
        instrumentId,
        side,
        amount,
      });

      return {
        order,
        success: true,
        etoroOrderId: result.orderId,
        timestamp: Date.now(),
      };
    } catch (err) {
      return {
        order,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      };
    }
  }

  async executeAll(orders: HedgeOrder[]): Promise<HedgeResult[]> {
    const results: HedgeResult[] = [];
    for (const o of orders) {
      results.push(await this.execute(o));
    }
    return results;
  }
}
