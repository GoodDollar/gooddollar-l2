import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor } from './hedge-executor';
import { CapEnforcer, CapSnapshot } from './cap-enforcer';
import { KillSwitchProbe } from './kill-switch';
import {
  HedgeEngineConfig,
  HedgeResult,
  ReconciliationSnapshot,
  StockSymbol,
} from './types';

export interface HedgeEngineDeps {
  capEnforcer?: CapEnforcer;
  killSwitch?: KillSwitchProbe;
}

/**
 * Main hedge engine loop. Each tick:
 * 1. Read on-chain exposure from UnifiedRiskEngine
 * 2. Read current eToro positions
 * 3. Compute residual delta
 * 4. Run safety gates (cap enforcer + kill switch) per order
 * 5. Execute approved hedge orders
 * 6. Log reconciliation snapshot
 */
export class HedgeEngine {
  private readonly reader: ExposureReader;
  private readonly calculator: DeltaCalculator;
  private readonly executor: HedgeExecutor;
  private readonly config: HedgeEngineConfig;
  private readonly capEnforcer?: CapEnforcer;
  private readonly killSwitch?: KillSwitchProbe;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private tickInProgress = false;

  private lastSnapshot: ReconciliationSnapshot | null = null;

  constructor(
    reader: ExposureReader,
    calculator: DeltaCalculator,
    executor: HedgeExecutor,
    config: HedgeEngineConfig,
    deps: HedgeEngineDeps = {},
  ) {
    this.reader = reader;
    this.calculator = calculator;
    this.executor = executor;
    this.config = config;
    this.capEnforcer = deps.capEnforcer;
    this.killSwitch = deps.killSwitch;
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

      // Tick-start kill-switch probe — short-circuits the whole tick.
      const killEngagedAtStart = this.killSwitch?.isEngaged() ?? false;

      let hedgesExecuted: HedgeResult[] = [];
      if (orders.length === 0) {
        hedgesExecuted = [];
      } else if (killEngagedAtStart) {
        hedgesExecuted = orders.map((order) => ({
          order,
          success: false,
          error: 'kill_switch',
          timestamp: Date.now(),
        }));
      } else if (this.capEnforcer) {
        this.capEnforcer.startCycle();
        for (const order of orders) {
          const decision = this.capEnforcer.evaluate(order);
          if (!decision.approved) {
            hedgesExecuted.push({
              order,
              success: false,
              error: decision.reason ?? 'cap_rejected',
              timestamp: Date.now(),
            });
            continue;
          }
          const result = await this.executor.execute(order);
          if (result.success) this.capEnforcer.recordFill(order);
          hedgesExecuted.push(result);
        }
      } else {
        hedgesExecuted = await this.executor.executeAll(orders);
      }

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

  getCapSnapshot(): CapSnapshot | null {
    return this.capEnforcer ? this.capEnforcer.snapshot() : null;
  }

  isKillSwitchEngaged(): boolean {
    return this.killSwitch?.isEngaged() ?? false;
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

// Re-export StockSymbol to satisfy `import { StockSymbol } from './engine'`
// callers (no current ones, but keeps the surface stable for future moves).
export type { StockSymbol };
