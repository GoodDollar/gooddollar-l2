const DEFAULT_RPM = 60;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

/** Test-only helper to reset in-process state between tests. */
export function _resetBuckets(): void {
  buckets.clear();
  lastCleanup = Date.now();
}

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  cleanup();

  const rpm = Number(process.env.RATE_LIMIT_RPM) || DEFAULT_RPM;
  const now = Date.now();
  const refillRate = rpm / 60_000; // tokens per ms

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: rpm, lastRefill: now };
    buckets.set(ip, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(rpm, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const waitMs = (1 - bucket.tokens) / refillRate;
  return { allowed: false, retryAfterSeconds: Math.ceil(waitMs / 1000) };
}
