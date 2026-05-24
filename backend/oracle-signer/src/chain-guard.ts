/**
 * Devnet chain-id allowlist guard.
 *
 * The oracle-signer holds a key that can sign and submit price updates to
 * whatever chain its RPC happens to point at. A misconfigured env var or an
 * accidental tunnel to mainnet would publish real on-chain submissions with
 * the keeper key. This guard is the last line of defence: before the service
 * starts its WS connection or submission interval, it queries the chain id
 * and refuses to proceed unless the id is in an explicit allowlist.
 *
 * Defaults to the two well-known local-devnet ids:
 *   31337 — anvil / hardhat default
 *   1337  — older geth/hardhat dev rigs
 *
 * Operators can override via `ORACLE_SIGNER_ALLOWED_CHAIN_IDS` (comma-separated).
 * Malformed values fall back to the defaults; never silently allow mainnet.
 */

export const DEFAULT_ALLOWED_CHAIN_IDS: number[] = [31337, 1337];

export function parseAllowedChainIds(raw?: string): Set<number> {
  const fallback = () => new Set<number>(DEFAULT_ALLOWED_CHAIN_IDS);

  if (raw === undefined || raw === null) return fallback();
  const trimmed = raw.trim();
  if (trimmed.length === 0) return fallback();

  const parsed: number[] = [];
  for (const tok of trimmed.split(',')) {
    const t = tok.trim();
    if (t.length === 0) continue;
    // Strict integer parse: reject "3.5", "0x...", "1e3", etc.
    if (!/^-?\d+$/.test(t)) continue;
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) continue;
    parsed.push(n);
  }

  if (parsed.length === 0) return fallback();
  return new Set<number>(parsed);
}

export interface ChainGuardResult {
  allowed: boolean;
  chainId: number;
}

export async function assertDevnetChain(
  getChainId: () => Promise<number>,
  allowed: Set<number>,
): Promise<ChainGuardResult> {
  const chainId = Number(await getChainId());
  return { allowed: allowed.has(chainId), chainId };
}
