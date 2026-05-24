import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor } from './hedge-executor';
import { CapEnforcer, CapSnapshot } from './cap-enforcer';
import { KillSwitchProbe } from './kill-switch';
import { CircuitBreakers, BreakerState } from './circuit-breakers';
import { ReceiptStore, HedgeReceipt } from './receipt-store';
import { ProofWriter } from './proof-writer';
import {
  HedgeEngineConfig,
  HedgeResult,
  OnChainExposure,
  ReconciliationSnapshot,
  StockSymbol,
  HedgeOrder,
} from './types';

export interface HedgeEngineDeps {
  capEnforcer?: CapEnforcer;
  killSwitch?: KillSwitchProbe;
  circuitBreakers?: CircuitBreakers;
  receiptStore?: ReceiptStore;
  proofWriter?: ProofWriter;
  /** Used for "afterExposure" re-read. Defaults to the same provider used at tick start. */
  blockNumberFn?: () => Promise<number>;
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
  private readonly breakers?: CircuitBreakers;
  private readonly receiptStore?: ReceiptStore;
  private readonly proofWriter?: ProofWriter;
  private readonly blockNumberFn?: () => Promise<number>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private tickInProgress = false;
  private firstTickEmittedProof = false;
  private receiptsThisTick: HedgeReceipt[] = [];

  private lastSnapshot: ReconciliationSnapshot | null = null;
  private lastBlockNumber = 0;

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
    this.breakers = deps.circuitBreakers;
    this.receiptStore = deps.receiptStore;
    this.proofWriter = deps.proofWriter;
    this.blockNumberFn = deps.blockNumberFn;
  }

  async tick(): Promise<ReconciliationSnapshot | null> {
    if (this.tickInProgress) {
      console.warn('[HedgeEngine] Tick skipped — previous tick still in progress');
      return null;
    }

    this.tickInProgress = true;
    try {
      const exposuresBefore = await this.reader.getAllExposures(this.config.symbols);
      const etoroPositions = await this.executor.fetchPositions();

      const orders = this.calculator.calculate(exposuresBefore, etoroPositions);

      // Circuit breakers — local-only synchronous check; async breakers
      // (chain_mismatch, oracle_stale) are wired in once the production
      // boot path supplies the providers.
      let breakerState: BreakerState | undefined;
      if (this.breakers) {
        const now = Date.now();
        let lastBlock = this.lastBlockNumber;
        if (this.blockNumberFn) {
          try { lastBlock = await this.blockNumberFn(); } catch { /* keep last */ }
        }
        this.lastBlockNumber = lastBlock;
        breakerState = this.breakers.evaluate({
          exposures: exposuresBefore,
          lastBlockNumber: lastBlock,
          now,
        });
      }

      // Tick-start kill-switch probe — short-circuits the whole tick.
      const killEngagedAtStart = this.killSwitch?.isEngaged() ?? false;

      let hedgesExecuted: HedgeResult[] = [];

      const breakerTripped = breakerState?.tripped === true;

      if (breakerTripped) {
        // Emit a single `noop` halted receipt per symbol so the audit
        // trail names the breaker reason — but place no orders.
        hedgesExecuted = orders.map((order) => ({
          order,
          success: false,
          error: `breaker_${breakerState!.reason}`,
          timestamp: Date.now(),
          notionalUsd: Math.abs(order.deltaToHedge),
        }));
      } else if (orders.length === 0) {
        hedgesExecuted = [];
      } else if (killEngagedAtStart) {
        hedgesExecuted = orders.map((order) => ({
          order,
          success: false,
          error: 'kill_switch',
          timestamp: Date.now(),
          notionalUsd: Math.abs(order.deltaToHedge),
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
              notionalUsd: Math.abs(order.deltaToHedge),
            });
            continue;
          }
          const result = await this.executor.execute(order);
          if (result.success) this.capEnforcer.recordFill(order);
          hedgesExecuted.push({
            ...result,
            notionalUsd: Math.abs(order.deltaToHedge),
          });
        }
      } else {
        hedgesExecuted = await this.executor.executeAll(orders);
      }

      // Re-read exposures AFTER orders so the receipt store can carry
      // before/after numbers. Tolerate failures — never crash a tick on
      // an audit-side read error.
      let exposuresAfter: OnChainExposure[] = exposuresBefore;
      this.receiptsThisTick = [];
      if (this.receiptStore && (orders.length > 0 || breakerTripped)) {
        try {
          exposuresAfter = await this.reader.getAllExposures(this.config.symbols);
        } catch {
          // keep the "before" reading
        }
        await this.persistReceipts(orders, hedgesExecuted, exposuresBefore, exposuresAfter, breakerState);
      }

      const residuals = this.calculator.getResiduals(exposuresAfter, etoroPositions);

      const snapshot: ReconciliationSnapshot = {
        timestamp: Date.now(),
        exposures: exposuresAfter,
        etoroPositions,
        hedgesExecuted,
        residuals,
      };

      this.lastSnapshot = snapshot;
      this.logSnapshot(snapshot);

      // Proof artifact: always for the first tick of a session (dry-run
      // baseline), then only when receipts were actually emitted so we
      // don't pile up identical no-op files.
      if (this.proofWriter) {
        const shouldWrite =
          !this.firstTickEmittedProof || this.receiptsThisTick.length > 0;
        if (shouldWrite) {
          try {
            await this.proofWriter.writeProof({
              snapshot,
              capSnapshot: this.getCapSnapshot(),
              breakerState: this.getBreakerState(),
              killSwitchEngaged: this.isKillSwitchEngaged(),
              mode: this.normalizedMode(),
              dryRun: this.config.dryRun,
              receipts: this.receiptsThisTick,
            });
            this.firstTickEmittedProof = true;
          } catch (err) {
            console.warn('[HedgeEngine] failed to write proof artifact', err);
          }
        }
      }

      return snapshot;
    } finally {
      this.tickInProgress = false;
    }
  }

  private normalizedMode(): 'sandbox' | 'real' | 'demo' | 'unknown' {
    const m = this.config.etoroMode;
    return m === 'sandbox' || m === 'real' || m === 'demo' ? m : 'unknown';
  }

  private async persistReceipts(
    orders: HedgeOrder[],
    results: HedgeResult[],
    before: OnChainExposure[],
    after: OnChainExposure[],
    breakerState: BreakerState | undefined,
  ): Promise<void> {
    if (!this.receiptStore) return;
    const beforeBySymbol = new Map(before.map((e) => [e.symbol, e.netDelta]));
    const afterBySymbol = new Map(after.map((e) => [e.symbol, e.netDelta]));
    const mode = this.config.etoroMode;

    // Source of truth: a result exists for every order we considered AND
    // an explicit noop entry for breaker-halted ticks. `results` already
    // covers both paths.
    const ts = Date.now();
    for (const result of results) {
      const sym = result.order.symbol;
      const notional = result.notionalUsd ?? Math.abs(result.order.deltaToHedge);
      const side: HedgeReceipt['side'] = breakerState?.tripped
        ? 'noop'
        : result.order.deltaToHedge > 0
          ? 'buy'
          : 'sell';
      const receipt: HedgeReceipt = {
        v: 1,
        id: `${ts}-${sym}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: result.timestamp,
        symbol: sym,
        side,
        notionalUsd: notional,
        etoroOrderId: result.etoroOrderId,
        executionPrice: result.executionPrice,
        success: result.success,
        error: result.error,
        beforeExposure: beforeBySymbol.get(sym) ?? 0,
        afterExposure: afterBySymbol.get(sym) ?? beforeBySymbol.get(sym) ?? 0,
        dryRun: this.config.dryRun,
        mode: mode === 'sandbox' || mode === 'real' || mode === 'demo' ? mode : 'unknown',
      };
      try {
        await this.receiptStore.append(receipt);
        this.receiptsThisTick.push(receipt);
      } catch (err) {
        console.warn('[HedgeEngine] failed to persist receipt', err);
      }
    }
    void orders; // referenced for future symbol-set audit; kept in signature.
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

  getBreakerState(): BreakerState {
    return this.breakers ? this.breakers.getState() : { tripped: false };
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
