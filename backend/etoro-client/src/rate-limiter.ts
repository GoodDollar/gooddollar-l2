const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const BACKOFF_MULTIPLIER = 2;

export interface RateLimiterConfig {
  minBackoffMs?: number;
  maxBackoffMs?: number;
  multiplier?: number;
  maxRetries?: number;
  /**
   * Injectable sleep implementation (for tests that need to drive
   * backoff deterministically without real timers). Defaults to
   * `setTimeout`-based sleep.
   */
  sleepImpl?: (ms: number) => Promise<void>;
}

/**
 * Per-call retry telemetry returned by `executeWithTelemetry`. Surfaced
 * into every audit-log line for HTTP calls so operators can see whether
 * the SDK absorbed a 429 or not.
 */
export interface RetryTelemetry {
  /** `1` = no retry; `N` = `N-1` backoffs absorbed. */
  attempts: number;
  /** Sum (ms) of slept-for delays across this call's retries. */
  totalBackoffMs: number;
}

/**
 * Canonical dispatcher signature used by every HTTP-issuing module
 * (`AccountModule`, `TradingModule`, `MarketDataModule`) so the
 * `EtoroClient` rate-limiter is the single chokepoint for eToro 429s.
 * Modules that are constructed directly (without `EtoroClient`) get an
 * identity dispatcher by default — see `identityDispatcher`.
 */
export type HttpDispatcher = <T>(
  fn: () => Promise<T>,
) => Promise<{ value: T } & RetryTelemetry>;

/** No-retry dispatcher used as the default when modules are constructed standalone. */
export const identityDispatcher: HttpDispatcher = async <T>(fn: () => Promise<T>) => {
  const value = await fn();
  return { value, attempts: 1, totalBackoffMs: 0 };
};

export class RateLimiter {
  private readonly minBackoff: number;
  private readonly maxBackoff: number;
  private readonly multiplier: number;
  private readonly maxRetries: number;
  private readonly sleepImpl: (ms: number) => Promise<void>;
  private currentBackoff: number;
  private consecutiveThrottles = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.minBackoff = config.minBackoffMs ?? MIN_BACKOFF_MS;
    this.maxBackoff = config.maxBackoffMs ?? MAX_BACKOFF_MS;
    this.multiplier = config.multiplier ?? BACKOFF_MULTIPLIER;
    this.maxRetries = config.maxRetries ?? 5;
    this.sleepImpl = config.sleepImpl ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.currentBackoff = this.minBackoff;
  }

  /**
   * Run `fn` with the limiter's retry/backoff policy and return the
   * value along with retry telemetry. On exhaustion, rethrows the last
   * error.
   */
  async executeWithTelemetry<T>(fn: () => Promise<T>): Promise<{ value: T } & RetryTelemetry> {
    let lastError: Error | undefined;
    let totalBackoffMs = 0;

    for (let i = 0; i <= this.maxRetries; i++) {
      const attempts = i + 1;
      try {
        const value = await fn();
        this.onSuccess();
        return { value, attempts, totalBackoffMs };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!this.isThrottleError(error) || i === this.maxRetries) {
          throw lastError;
        }
        const delay = this.onThrottle();
        totalBackoffMs += delay;
        await this.sleepImpl(delay);
      }
    }
    throw lastError ?? new Error('Rate limiter exhausted retries');
  }

  /** Thin back-compat wrapper. New callers should prefer `executeWithTelemetry`. */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    const { value } = await this.executeWithTelemetry(fn);
    return value;
  }

  getBackoffMs(): number {
    return this.currentBackoff;
  }

  getConsecutiveThrottles(): number {
    return this.consecutiveThrottles;
  }

  private onSuccess(): void {
    this.currentBackoff = this.minBackoff;
    this.consecutiveThrottles = 0;
  }

  private onThrottle(): number {
    this.consecutiveThrottles++;
    const delay = this.currentBackoff;
    this.currentBackoff = Math.min(
      this.currentBackoff * this.multiplier,
      this.maxBackoff,
    );
    return delay;
  }

  private isThrottleError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const e = error as Record<string, unknown>;

    if (e.status === 429 || e.statusCode === 429) return true;

    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>;
      if (resp.status === 429) return true;
    }

    if (typeof e.message === 'string' && e.message.includes('429')) return true;

    return false;
  }
}
