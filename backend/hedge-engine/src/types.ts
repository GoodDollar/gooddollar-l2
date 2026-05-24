import type { EtoroMode } from '@goodchain/etoro-client';

/** Symbols tracked for hedging (matches on-chain oracle keys). */
export type StockSymbol = string;

/**
 * Snapshot of net on-chain exposure for a single symbol, read from
 * UnifiedRiskEngine.getNetExposure(symbol). Units: 18-decimal fixed-point
 * converted to a floating-point USD-equivalent delta.
 */
export interface OnChainExposure {
  symbol: StockSymbol;
  /** Signed delta in base units (positive = protocol is long, needs short hedge). */
  netDelta: number;
  /** Absolute open interest across all products. */
  absExposure: number;
  /** Block number at which exposure was read. */
  blockNumber: number;
  /** Timestamp (ms) when the read happened. */
  readTimestamp: number;
}

/** Current eToro position for a symbol. */
export interface EtoroPosition {
  symbol: StockSymbol;
  /** Signed quantity — positive is long, negative is short. */
  quantity: number;
  /** eToro position ID (for close/modify calls). */
  positionId?: string;
}

/**
 * The computed hedge order that needs to be placed on eToro to offset
 * on-chain exposure.
 */
export interface HedgeOrder {
  symbol: StockSymbol;
  /** Signed quantity to execute on eToro: positive = buy, negative = sell. */
  deltaToHedge: number;
  /** Reason the hedge was triggered. */
  reason: 'threshold_breach' | 'new_symbol' | 'reconciliation';
}

/** Result of a single hedge execution attempt. */
export interface HedgeResult {
  order: HedgeOrder;
  success: boolean;
  etoroOrderId?: string;
  error?: string;
  timestamp: number;
}

/** Configuration for the hedge engine loop. */
export interface HedgeEngineConfig {
  /** RPC URL for reading on-chain state. */
  rpcUrl: string;
  /** Address of deployed UnifiedRiskEngine contract. */
  riskEngineAddress: string;
  /** Symbols to hedge (e.g. ['AAPL', 'TSLA', ...]). */
  symbols: StockSymbol[];
  /** Minimum residual delta (USD) before triggering a hedge. Default $5000. */
  deltaThresholdUsd: number;
  /** Minimum residual delta as % of OI before triggering a hedge. Default 2%. */
  deltaThresholdPct: number;
  /** Polling interval in milliseconds. Default 30_000 (30s). */
  pollIntervalMs: number;
  /** If true, log actions but don't execute real eToro trades. */
  dryRun: boolean;
  /**
   * Resolved eToro safety mode (`mock | demo-readonly | demo-trading |
   * real-disabled`). Drives adapter selection — see `selectAdapter`.
   */
  mode: EtoroMode;
  /**
   * Two-step trading gate. `true` only when `mode === 'demo-trading'`
   * AND `HEDGE_TRADING_ENABLED === 'true'`. Either-or fails closed —
   * `false` means the engine runs in read-only mode via the read-only
   * sentinel adapter.
   */
  tradingEnabled: boolean;
}

/** Snapshot of a full reconciliation cycle. */
export interface ReconciliationSnapshot {
  timestamp: number;
  exposures: OnChainExposure[];
  etoroPositions: EtoroPosition[];
  hedgesExecuted: HedgeResult[];
  residuals: Map<StockSymbol, number>;
}
