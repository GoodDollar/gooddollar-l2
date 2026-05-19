const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const BACKOFF_MULTIPLIER = 2;

export interface RateLimiterConfig {
  minBackoffMs?: number;
  maxBackoffMs?: number;
  multiplier?: number;
  maxRetries?: number;
}

export class RateLimiter {
  private readonly minBackoff: number;
  private readonly maxBackoff: number;
  private readonly multiplier: number;
  private readonly maxRetries: number;
  private currentBackoff: number;
  private consecutiveThrottles = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.minBackoff = config.minBackoffMs ?? MIN_BACKOFF_MS;
    this.maxBackoff = config.maxBackoffMs ?? MAX_BACKOFF_MS;
    this.multiplier = config.multiplier ?? BACKOFF_MULTIPLIER;
    this.maxRetries = config.maxRetries ?? 5;
    this.currentBackoff = this.minBackoff;
  }

  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isThrottleError(error) || attempt === this.maxRetries) {
          throw lastError;
        }

        const delay = this.onThrottle();
        await this.sleep(delay);
      }
    }

    throw lastError ?? new Error('Rate limiter exhausted retries');
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
