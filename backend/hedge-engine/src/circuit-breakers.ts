import { OnChainExposure } from './types';

/**
 * Reasons a circuit breaker may trip — surfaced verbatim in the
 * ReconciliationSnapshot and in `/hedge/snapshot` HTTP responses.
 */
export type BreakerReason =
  | 'exposure_stale'
  | 'rpc_lag'
  | 'chain_mismatch'
  | 'oracle_stale';

export interface BreakerState {
  tripped: boolean;
  reason?: BreakerReason;
  timestamp?: number;
  detail?: string;
}

export interface OracleFreshnessReader {
  isStale(): Promise<boolean>;
}

export interface CircuitBreakersConfig {
  /** Maximum age of the freshest exposure read (`Date.now() - readTimestamp`). */
  maxExposureAgeMs: number;
  /** Maximum time the chain may stay on the same block before tripping. */
  maxRpcLagMs: number;
  /** Optional explorer-block URL — disables chain_mismatch when absent. */
  explorerBlockUrl?: string;
  /** Maximum block-number gap between explorer and local RPC. */
  maxChainBlockLag?: number;
  /** Injectable fetcher for unit tests — defaults to global `fetch`. */
  fetchBlock?: (url: string) => Promise<number>;
  /** Optional address gate — only enables the oracle breaker if present. */
  oracleAddress?: string;
  /** Injected freshness reader — disables oracle_stale when undefined. */
  oracleReader?: OracleFreshnessReader;
}

export interface BreakerInput {
  exposures: OnChainExposure[];
  lastBlockNumber: number;
  now: number;
}

/**
 * Stateful circuit breaker layer that runs before DeltaCalculator on every
 * tick. Pure with the exception of (1) the `lastBlockSeen` cache used to
 * detect RPC lag and (2) the `state` snapshot exposed via `getState()`.
 *
 * Synchronous `evaluate()` covers the local-only breakers (exposure_stale,
 * rpc_lag). Use `evaluateAsync()` when the explorer-block or oracle-reader
 * breakers are configured — async work is opt-in to keep the hot path cheap
 * for the common case.
 */
export class CircuitBreakers {
  private readonly cfg: CircuitBreakersConfig;
  private lastBlockSeen: { block: number; ts: number } | null = null;
  private state: BreakerState = { tripped: false };

  constructor(cfg: CircuitBreakersConfig) {
    this.cfg = cfg;
  }

  isOracleBreakerEnabled(): boolean {
    return Boolean(this.cfg.oracleReader && this.cfg.oracleAddress);
  }

  isChainMismatchEnabled(): boolean {
    return Boolean(this.cfg.explorerBlockUrl);
  }

  evaluate(input: BreakerInput): BreakerState {
    const sync = this.checkLocalBreakers(input);
    this.state = sync;
    return sync;
  }

  async evaluateAsync(input: BreakerInput): Promise<BreakerState> {
    const sync = this.checkLocalBreakers(input);
    if (sync.tripped) {
      this.state = sync;
      return sync;
    }
    if (this.isChainMismatchEnabled()) {
      const fetcher = this.cfg.fetchBlock ?? defaultFetch;
      try {
        const remote = await fetcher(this.cfg.explorerBlockUrl!);
        const lag = remote - input.lastBlockNumber;
        if (lag > (this.cfg.maxChainBlockLag ?? 0)) {
          const tripped: BreakerState = {
            tripped: true,
            reason: 'chain_mismatch',
            timestamp: input.now,
            detail: `local=${input.lastBlockNumber} remote=${remote} lag=${lag}`,
          };
          this.state = tripped;
          return tripped;
        }
      } catch {
        // explorer outage is not a breaker trip — fall through.
      }
    }
    if (this.isOracleBreakerEnabled()) {
      try {
        const stale = await this.cfg.oracleReader!.isStale();
        if (stale) {
          const tripped: BreakerState = {
            tripped: true,
            reason: 'oracle_stale',
            timestamp: input.now,
          };
          this.state = tripped;
          return tripped;
        }
      } catch {
        // reader failure is not a breaker trip — fall through.
      }
    }
    this.state = { tripped: false };
    return this.state;
  }

  getState(): BreakerState {
    return this.state;
  }

  private checkLocalBreakers(input: BreakerInput): BreakerState {
    if (input.exposures.length > 0) {
      const newestRead = Math.max(...input.exposures.map((e) => e.readTimestamp));
      const ageMs = input.now - newestRead;
      if (ageMs > this.cfg.maxExposureAgeMs) {
        return {
          tripped: true,
          reason: 'exposure_stale',
          timestamp: input.now,
          detail: `oldest read age=${ageMs}ms`,
        };
      }
    }

    if (this.lastBlockSeen && this.lastBlockSeen.block === input.lastBlockNumber) {
      const stuckMs = input.now - this.lastBlockSeen.ts;
      if (stuckMs > this.cfg.maxRpcLagMs) {
        return {
          tripped: true,
          reason: 'rpc_lag',
          timestamp: input.now,
          detail: `block ${input.lastBlockNumber} stuck for ${stuckMs}ms`,
        };
      }
    } else {
      this.lastBlockSeen = { block: input.lastBlockNumber, ts: input.now };
    }

    return { tripped: false };
  }
}

async function defaultFetch(url: string): Promise<number> {
  const resp = await fetch(url);
  const json = (await resp.json()) as { block?: number; result?: number };
  return Number(json.block ?? json.result ?? 0);
}
