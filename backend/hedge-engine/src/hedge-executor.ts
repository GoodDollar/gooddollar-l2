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

export type SafetyMode = 'sandbox' | 'real';

export interface HedgeExecutorOptions {
  dryRun?: boolean;
  /**
   * Constructor-injected safety mode for the hedge path. Defaults to
   * `'sandbox'`. When `'real'`, the executor calls the etoro-client
   * `assertDemoModeOrThrow` helper before any non-dry-run call, which fails
   * because the source-level `REAL_TRADING_ENABLED` constant is `false`.
   */
  safetyMode?: SafetyMode;
  /**
   * Injected guard so tests can verify the fence without depending on
   * etoro-client's package layout. Defaults to a function that imports the
   * real `assertDemoModeOrThrow` lazily.
   */
  assertDemoModeOrThrow?: (mode: SafetyMode) => void;
}

/**
 * Default safety assertion mirrors `assertDemoModeOrThrow` from
 * `@goodchain/etoro-client`. We duplicate the literal check here so hedge-engine
 * does not need a cross-package dependency just to enforce the fence; the
 * production wiring in `etoro-adapter.ts` (task 0004) calls into etoro-client's
 * assertion as defense-in-depth.
 *
 * The literal `false` below mirrors `REAL_TRADING_ENABLED` in
 * `backend/etoro-client/src/safety.ts`. Both must remain `false` in this lane.
 */
export const HEDGE_REAL_TRADING_ENABLED: false = false;

function defaultAssertDemoMode(mode: SafetyMode): void {
  if (mode === 'real' && (HEDGE_REAL_TRADING_ENABLED as boolean) !== true) {
    throw new Error(
      'Refusing real-mode hedge: HEDGE_REAL_TRADING_ENABLED is hardcoded `false`. ' +
        'Set safetyMode to `sandbox` (or run dry-run) — env vars cannot flip this.',
    );
  }
}

/**
 * Executes hedge orders on eToro and reads current eToro positions.
 * Wraps all calls in try/catch to produce HedgeResult.
 */
export class HedgeExecutor {
  private readonly adapter: EtoroAdapter;
  private readonly instrumentMap: Map<StockSymbol, string>;
  private readonly dryRun: boolean;
  private readonly safetyMode: SafetyMode;
  private readonly assertDemoMode: (mode: SafetyMode) => void;

  constructor(
    adapter: EtoroAdapter,
    instrumentMap: Map<StockSymbol, string>,
    dryRunOrOpts: boolean | HedgeExecutorOptions = false,
    _legacyOpts?: unknown,
  ) {
    this.adapter = adapter;
    this.instrumentMap = instrumentMap;
    if (typeof dryRunOrOpts === 'boolean') {
      this.dryRun = dryRunOrOpts;
      this.safetyMode = 'sandbox';
      this.assertDemoMode = defaultAssertDemoMode;
    } else {
      this.dryRun = dryRunOrOpts.dryRun ?? false;
      this.safetyMode = dryRunOrOpts.safetyMode ?? 'sandbox';
      this.assertDemoMode = dryRunOrOpts.assertDemoModeOrThrow ?? defaultAssertDemoMode;
    }
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
      // Source-level safety fence: every non-dry-run path goes through this.
      // It throws when the hedge engine is misconfigured into real mode.
      this.assertDemoMode(this.safetyMode);

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
