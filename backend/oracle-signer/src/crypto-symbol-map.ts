/**
 * Parser for the `CRYPTO_SYMBOL_MAP` env var.
 *
 * Accepts two shapes (in this priority):
 *   1. JSON object: `{"WETH":"0x...","USDC":"0x..."}`
 *   2. KEY=ADDR comma list: `WETH=0x..,USDC=0x..`
 *
 * Resolution is case-insensitive (eToro emits both `WETH` and `weth`).
 * Addresses are validated with `ethers.isAddress`; bad entries are dropped
 * silently — the service prints the accepted symbols at startup so the
 * operator can spot a typo.
 *
 * No signer-key handling lives here; this module is pure & deterministic.
 */

import { ethers } from 'ethers';

export class CryptoSymbolMap {
  private readonly entries: Map<string, string> = new Map(); // KEY (UPPER) → checksum address

  set(symbol: string, address: string): boolean {
    const key = (symbol ?? '').trim();
    if (!key) return false;
    if (!ethers.isAddress(address)) return false;
    this.entries.set(key.toUpperCase(), ethers.getAddress(address));
    return true;
  }

  resolve(symbol: string): string | null {
    if (!symbol) return null;
    return this.entries.get(symbol.toUpperCase()) ?? null;
  }

  has(symbol: string): boolean {
    return this.resolve(symbol) !== null;
  }

  symbols(): string[] {
    return Array.from(this.entries.keys());
  }

  get size(): number {
    return this.entries.size;
  }
}

export function parseCryptoSymbolMap(raw?: string): CryptoSymbolMap {
  const m = new CryptoSymbolMap();
  if (raw === undefined || raw === null) return m;
  const trimmed = raw.trim();
  if (!trimmed) return m;

  // JSON form first.
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') m.set(k, v);
        }
        return m;
      }
    } catch {
      // Fall through; we treat malformed JSON as "no entries" rather than
      // surprising the operator with a KEY=ADDR re-parse of `{not-json}`.
      return m;
    }
  }

  for (const pair of trimmed.split(',')) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const k = pair.slice(0, eq);
    const v = pair.slice(eq + 1).trim();
    m.set(k, v);
  }
  return m;
}
