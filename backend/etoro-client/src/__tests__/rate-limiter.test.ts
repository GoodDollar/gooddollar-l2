import { RateLimiter } from '../rate-limiter';

class ThrottleError extends Error {
  status = 429;
  constructor() {
    super('Rate limited');
    this.name = 'ThrottleError';
  }
}

describe('RateLimiter', () => {
  it('executes function on first attempt when no error', async () => {
    const limiter = new RateLimiter();
    const result = await limiter.executeWithRetry(async () => 42);
    expect(result).toBe(42);
    expect(limiter.getConsecutiveThrottles()).toBe(0);
  });

  it('retries on 429 errors with increasing backoff', async () => {
    const limiter = new RateLimiter({
      minBackoffMs: 10,
      maxBackoffMs: 100,
      multiplier: 2,
      maxRetries: 3,
    });

    let callCount = 0;
    const fn = async () => {
      callCount++;
      if (callCount < 3) throw new ThrottleError();
      return 'success';
    };

    const result = await limiter.executeWithRetry(fn);
    expect(result).toBe('success');
    expect(callCount).toBe(3);
  });

  it('throws after maxRetries exhausted', async () => {
    const limiter = new RateLimiter({
      minBackoffMs: 1,
      maxBackoffMs: 10,
      maxRetries: 2,
    });

    const fn = async () => {
      throw new ThrottleError();
    };

    await expect(limiter.executeWithRetry(fn)).rejects.toThrow('Rate limited');
  });

  it('does not retry non-429 errors', async () => {
    const limiter = new RateLimiter({ minBackoffMs: 1 });
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error('Network error');
    };

    await expect(limiter.executeWithRetry(fn)).rejects.toThrow('Network error');
    expect(callCount).toBe(1);
  });

  it('resets backoff after success', async () => {
    const limiter = new RateLimiter({ minBackoffMs: 10, maxBackoffMs: 100 });

    let callCount = 0;
    await limiter.executeWithRetry(async () => {
      callCount++;
      if (callCount === 1) throw new ThrottleError();
      return 'ok';
    });

    expect(limiter.getBackoffMs()).toBe(10);
    expect(limiter.getConsecutiveThrottles()).toBe(0);
  });

  it('caps backoff at maxBackoffMs', async () => {
    const limiter = new RateLimiter({
      minBackoffMs: 1,
      maxBackoffMs: 5,
      multiplier: 10,
      maxRetries: 5,
    });

    let callCount = 0;
    await limiter.executeWithRetry(async () => {
      callCount++;
      if (callCount <= 4) throw new ThrottleError();
      return 'done';
    });

    expect(callCount).toBe(5);
  });

  it('detects 429 from response.status', async () => {
    const limiter = new RateLimiter({
      minBackoffMs: 1,
      maxRetries: 1,
    });

    let callCount = 0;
    const fn = async () => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Request failed') as Error & { response: { status: number } };
        err.response = { status: 429 };
        throw err;
      }
      return 'ok';
    };

    const result = await limiter.executeWithRetry(fn);
    expect(result).toBe('ok');
  });
});

describe('RateLimiter.executeWithTelemetry', () => {
  function makeLimiter(overrides: Partial<{
    minBackoffMs: number;
    maxBackoffMs: number;
    multiplier: number;
    maxRetries: number;
  }> = {}, recordedSleeps?: number[]) {
    return new RateLimiter({
      minBackoffMs: 10,
      maxBackoffMs: 100,
      multiplier: 2,
      maxRetries: 3,
      sleepImpl: async (ms) => { recordedSleeps?.push(ms); },
      ...overrides,
    });
  }

  it('happy path returns attempts=1 and totalBackoffMs=0', async () => {
    const limiter = makeLimiter();
    const result = await limiter.executeWithTelemetry(async () => 'ok');
    expect(result).toEqual({ value: 'ok', attempts: 1, totalBackoffMs: 0 });
  });

  it('one 429 then 200 reports attempts=2 and the minBackoff delay', async () => {
    const sleeps: number[] = [];
    const limiter = makeLimiter({}, sleeps);
    let n = 0;
    const result = await limiter.executeWithTelemetry(async () => {
      n++;
      if (n === 1) throw new ThrottleError();
      return 42;
    });
    expect(result.value).toBe(42);
    expect(result.attempts).toBe(2);
    expect(result.totalBackoffMs).toBe(10);
    expect(sleeps).toEqual([10]);
  });

  it('429 → 429 → 200 sums backoffs across retries', async () => {
    const sleeps: number[] = [];
    const limiter = makeLimiter({}, sleeps);
    let n = 0;
    const result = await limiter.executeWithTelemetry(async () => {
      n++;
      if (n <= 2) throw new ThrottleError();
      return 'ok';
    });
    expect(result.attempts).toBe(3);
    expect(result.totalBackoffMs).toBe(10 + 20);
    expect(sleeps).toEqual([10, 20]);
  });

  it('5 consecutive 429s exhaust and rethrow, consecutiveThrottles=5', async () => {
    const sleeps: number[] = [];
    const limiter = makeLimiter({ maxRetries: 4 }, sleeps);
    await expect(limiter.executeWithTelemetry(async () => {
      throw new ThrottleError();
    })).rejects.toThrow('Rate limited');
    expect(limiter.getConsecutiveThrottles()).toBe(5);
    expect(sleeps).toHaveLength(4);
  });
});
