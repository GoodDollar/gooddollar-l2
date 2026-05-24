import crypto from 'crypto';

const ENV_KEY = 'QA_HARNESS_RUN_ID';

export function getRunId(): string {
  const existing = process.env[ENV_KEY];
  if (existing) return existing;
  const fresh = newRunId();
  process.env[ENV_KEY] = fresh;
  return fresh;
}

export function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${stamp}-${suffix}`;
}
