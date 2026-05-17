/**
 * Canonical contract address loader for the monitor service.
 *
 * Non-negotiable #7 (from initiative 0004 spec):
 *   "Canonical contract addresses come from `op-stack/addresses.json`;
 *    no stale hardcoded fallbacks."
 *
 * Behavior:
 *   - Read the addresses file (JSON), pull `.contracts`, and return only
 *     the subset of names the monitor cares about as [name, address] tuples.
 *   - If the file is missing, unreadable, malformed, or has no `.contracts`,
 *     return `[]` and log a warning. The monitor will then report 0
 *     contract checks instead of falsely reporting failures against
 *     non-existent (devnet-only) addresses.
 *   - If a specific monitored name isn't in the file (e.g. not yet deployed
 *     after a redeploy), skip it silently — better partial coverage than
 *     no monitor at all.
 */
import { readFileSync, existsSync } from 'node:fs';

/** Names the monitor is configured to check. Keep in sync with checks.ts call sites. */
export const MONITORED_CONTRACTS = [
  'GoodDollarToken',
  'UBIFeeSplitter',
  'PerpEngine',
  'MarginVault',
  'MarketFactory',
  'ConditionalTokens',
  'SyntheticAssetFactory',
  'CollateralVault',
] as const;

export type MonitoredContractName = (typeof MONITORED_CONTRACTS)[number];

/**
 * Load monitored contract addresses from the canonical addresses file.
 * Returns [name, address] tuples in the same shape the old hardcoded
 * `CONTRACTS` constant used, for drop-in compatibility.
 */
export function loadContracts(addressesPath: string): [string, string][] {
  if (!existsSync(addressesPath)) {
    console.warn(
      `[addresses] addresses file not found at ${addressesPath} — monitor will run with 0 contract checks`,
    );
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(addressesPath, 'utf8');
  } catch (err) {
    console.warn(`[addresses] failed to read ${addressesPath}:`, err);
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.warn(`[addresses] failed to parse JSON at ${addressesPath}:`, err);
    return [];
  }

  if (!parsed || typeof parsed !== 'object') return [];
  const contracts = (parsed as { contracts?: unknown }).contracts;
  if (!contracts || typeof contracts !== 'object') {
    console.warn(`[addresses] no \`contracts\` object in ${addressesPath}`);
    return [];
  }

  const map = contracts as Record<string, string>;
  const result: [string, string][] = [];
  for (const name of MONITORED_CONTRACTS) {
    const addr = map[name];
    if (typeof addr === 'string' && addr.length > 0) {
      result.push([name, addr]);
    }
  }
  return result;
}
