import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor } from './hedge-executor';
import {
  HedgeEngineConfig,
  HedgeResult,
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

  async tick(): Promise<ReconciliationSnapshot> {
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
