/**
 * Minimal HTTP health check server for daemon-style backend services.
 *
 * CANONICAL SOURCE — copied into each service's src/healthServer.ts.
 * After editing, run: bash backend/scripts/check-health-server-sync.sh
 * to verify all copies match.
 *
 * Usage:
 *   import { startHealthServer } from './healthServer';
 *   startHealthServer({ name: 'swap-oracle', port: 9100 });
 *
 * GET /health → 200 { status, service, uptime, timestamp, chain? }
 * If chainCheck returns a rejected promise, responds 503.
 */

import * as http from 'http';

export interface HealthServerOptions {
  name: string;
  port: number;
  chainCheck?: () => Promise<number>; // resolves with latest block number
}

const startedAt = Date.now();

export function startHealthServer(opts: HealthServerOptions): http.Server {
  const { name, port, chainCheck } = opts;

  const server = http.createServer(async (req, res) => {
    if (req.url !== '/health' || req.method !== 'GET') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    try {
      const requestedStatus = process.env.SERVICE_HEALTH_STATUS;
      const status = requestedStatus === 'degraded' || requestedStatus === 'health-only'
        ? requestedStatus
        : 'ok';
      const body: Record<string, unknown> = {
        status,
        service: name,
        uptime: Math.floor((Date.now() - startedAt) / 1000),
        timestamp: new Date().toISOString(),
      };

      if (status !== 'ok') {
        body.mode = process.env.SERVICE_HEALTH_MODE ?? 'disabled';
        body.reason = process.env.SERVICE_DISABLED_REASON ?? 'service loop disabled';
      }

      if (chainCheck) {
        try {
          const blockNumber = await chainCheck();
          body.chainBlock = blockNumber;
        } catch {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'error',
            service: name,
            error: 'chain unreachable',
            timestamp: new Date().toISOString(),
          }));
          return;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', service: name, error: String(err) }));
    }
  });

  server.listen(port, () => {
    console.log(`[${name}] Health endpoint at http://localhost:${port}/health`);
  });

  return server;
}
