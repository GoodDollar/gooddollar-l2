/**
 * Hedge-specific HTTP surface. Runs on its OWN port — never on the
 * shared healthServer (which is bytes-identical across services).
 *
 * Routes:
 *   GET /hedge/snapshot          200 { snapshot, capSnapshot, breakerState, killSwitchEngaged }
 *                                503 before the first tick
 *   GET /hedge/receipts?limit=N  200 { receipts: HedgeReceipt[] } (newest first)
 *                                400 if limit is not a positive integer
 *   GET /hedge/proof/latest      200 { path, timestamp, summary }
 *                                404 when no proof artifact exists yet
 *   * everything else            404
 *   non-GET                      405
 */

import * as http from 'http';
import { ReconciliationSnapshot } from './types';
import { CapSnapshot } from './cap-enforcer';
import { BreakerState } from './circuit-breakers';
import { HedgeReceipt } from './receipt-store';

export interface ProofPointer {
  path: string;
  timestamp: number;
  summary: string;
}

export interface HedgeStatusProvider {
  getLastSnapshot(): ReconciliationSnapshot | null;
  getCapSnapshot(): CapSnapshot | null;
  getBreakerState(): BreakerState;
  isKillSwitchEngaged(): boolean;
  readReceipts(limit: number): Promise<HedgeReceipt[]>;
  readLatestProof(): Promise<ProofPointer | null>;
}

export interface HedgeStatusServerOptions {
  port: number;
  provider: HedgeStatusProvider;
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return value;
}

function writeJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, jsonReplacer));
}

export function startHedgeStatusServer(opts: HedgeStatusServerOptions): http.Server {
  const { port, provider } = opts;

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET') {
      writeJson(res, 405, { error: 'method_not_allowed', method: req.method });
      return;
    }

    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    try {
      if (pathname === '/hedge/snapshot') {
        const snap = provider.getLastSnapshot();
        if (!snap) {
          writeJson(res, 503, { error: 'no_snapshot_yet' });
          return;
        }
        writeJson(res, 200, {
          snapshot: snap,
          capSnapshot: provider.getCapSnapshot(),
          breakerState: provider.getBreakerState(),
          killSwitchEngaged: provider.isKillSwitchEngaged(),
        });
        return;
      }

      if (pathname === '/hedge/receipts') {
        const limitRaw = url.searchParams.get('limit') ?? '10';
        const limit = Number.parseInt(limitRaw, 10);
        if (!Number.isInteger(limit) || limit <= 0) {
          writeJson(res, 400, { error: 'invalid_limit', got: limitRaw });
          return;
        }
        const receipts = await provider.readReceipts(limit);
        writeJson(res, 200, { receipts });
        return;
      }

      if (pathname === '/hedge/proof/latest') {
        const proof = await provider.readLatestProof();
        if (!proof) {
          writeJson(res, 404, { error: 'no_proof_yet' });
          return;
        }
        writeJson(res, 200, proof);
        return;
      }

      writeJson(res, 404, { error: 'not_found', path: pathname });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeJson(res, 500, { error: 'internal', detail: msg });
    }
  });

  server.listen(port, () => {
    const address = server.address();
    const bound = typeof address === 'object' && address ? address.port : port;
    console.log(`[hedge-engine] status endpoint at http://localhost:${bound}/hedge/snapshot`);
  });

  return server;
}
