import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor } from './hedge-executor';
import { HedgeProof, HedgeProofRecorder, newProofRunId } from './hedge-proof';
import {
  HedgeEngineConfig,
  HedgeOrder,
  HedgeResult,
  OnChainExposure,
  ReconciliationSnapshot,
  StockSymbol,
} from './types';

/**
 * Main hedge engine loop. Each tick:
 * 1. Read on-chain exposure from UnifiedRiskEngine
 * 2. Read current eToro positions
 * 3. Compute residual delta
 * 4. Execute hedge orders that breach threshold
 * 5. Log reconciliation snapshot
 */
export class HedgeEngine {
  private readonly reader: ExposureReader;
  private readonly calculator: DeltaCalculator;
  private readonly executor: HedgeExecutor;
  private readonly config: HedgeEngineConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private tickInProgress = false;

  private lastSnapshot: ReconciliationSnapshot | null = null;

  constructor(
    reader: ExposureReader,
    calculator: DeltaCalculator,
    executor: HedgeExecutor,
    config: HedgeEngineConfig,
  ) {
    this.reader = reader;
    this.calculator = calculator;
    this.executor = executor;
    this.config = config;
  }

  async tick(): Promise<ReconciliationSnapshot | null> {
    if (this.tickInProgress) {
      console.warn('[HedgeEngine] Tick skipped — previous tick still in progress');
      return null;
    }

    this.tickInProgress = true;
    try {
      const exposures = await this.reader.getAllExposures(this.config.symbols);
      const etoroPositions = await this.executor.fetchPositions();

      const orders = this.calculator.calculate(exposures, etoroPositions);
      const hedgesExecuted: HedgeResult[] = orders.length
        ? await this.executor.executeAll(orders)
        : [];

      const residuals = this.calculator.getResiduals(exposures, etoroPositions);

      const snapshot: ReconciliationSnapshot = {
        timestamp: Date.now(),
        exposures,
        etoroPositions,
        hedgesExecuted,
        residuals,
      };

      this.lastSnapshot = snapshot;
      this.logSnapshot(snapshot);

      return snapshot;
    } finally {
      this.tickInProgress = false;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    console.log(
      `[HedgeEngine] Starting — poll every ${this.config.pollIntervalMs}ms, ` +
        `dryRun=${this.config.dryRun}, symbols=[${this.config.symbols.join(',')}]`,
    );

    this.timer = setInterval(async () => {
      try {
        await this.tick();
      } catch (err) {
        console.error('[HedgeEngine] Tick error:', err);
      }
    }, this.config.pollIntervalMs);

    this.tick().catch((err) => console.error('[HedgeEngine] Initial tick error:', err));
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    console.log('[HedgeEngine] Stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  getLastSnapshot(): ReconciliationSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Single-shot hedge for `symbol` with auditable proof. This is the verb
   * the release-gate script (task 0006) invokes and the qa-harness/CLI
   * use.
   *
   * Sequence:
   *   1. read exposure (before)
   *   2. compute delta vs current eToro positions
   *   3. execute the hedge (or dry-run)
   *   4. read exposure (after)
   *   5. write a `HedgeProof` JSON file and return it
   *
   * If the delta is below the configured thresholds, returns a proof with
   * `orderId='no-op'`, `notionalUsd=0`, side='buy' (sentinel) so the
   * pipeline still produces evidence.
   */
  async runOnce(symbol: StockSymbol, opts?: { recorder?: HedgeProofRecorder; etoroMode?: string }): Promise<HedgeProof> {
    const before = await this.reader.getExposure(symbol);
    const positions = await this.executor.fetchPositions();
    const order = this.computeSingleOrder(before, positions);

    let result: HedgeResult | null = null;
    if (order) {
      result = await this.executor.execute(order);
    }

    const after = await this.reader.getExposure(symbol);

    const runId = newProofRunId();
    const noOpOrderId = 'no-op';
    const orderId = result?.etoroOrderId ?? noOpOrderId;
    const delta = order?.deltaToHedge ?? 0;
    const proof: HedgeProof = {
      runId,
      orderId,
      symbol,
      side: delta >= 0 ? 'buy' : 'sell',
      notionalUsd: Math.abs(delta),
      timestamp: Date.now(),
      beforeExposure: {
        netDelta: before.netDelta,
        absExposure: before.absExposure,
        blockNumber: before.blockNumber,
      },
      afterExposure: {
        netDelta: after.netDelta,
        absExposure: after.absExposure,
        blockNumber: after.blockNumber,
      },
      dryRun: this.config.dryRun,
      etoroMode: opts?.etoroMode ?? 'sandbox',
      realTradingEnabled: false,
    };

    const recorder = opts?.recorder ?? new HedgeProofRecorder();
    await recorder.write(proof);
    return proof;
  }

  private computeSingleOrder(
    before: OnChainExposure,
    positions: { symbol: StockSymbol; quantity: number }[],
  ): HedgeOrder | null {
    const orders = this.calculator.calculate([before], positions);
    return orders.find((o) => o.symbol === before.symbol) ?? null;
  }

  private logSnapshot(snap: ReconciliationSnapshot): void {
    const symbols = snap.exposures.map((e) => e.symbol);
    const hedgeCount = snap.hedgesExecuted.length;
    const failCount = snap.hedgesExecuted.filter((h) => !h.success).length;

    const residualSummary: Record<string, number> = {};
    snap.residuals.forEach((v, k) => { residualSummary[k] = Math.round(v * 100) / 100; });

    console.log(
      `[HedgeEngine] Tick @ ${new Date(snap.timestamp).toISOString()} — ` +
        `symbols=${symbols.length}, hedges=${hedgeCount}, failures=${failCount}, ` +
        `residuals=${JSON.stringify(residualSummary)}`,
    );
  }
}
