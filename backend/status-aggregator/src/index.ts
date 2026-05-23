/**
 * GoodDollar L2 Status Aggregator
 *
 * Polls all backend service health endpoints and exposes:
 *   GET /status.json — aggregated health of all services
 *   GET /health      — own health
 *
 * Each service entry reports: status (ok|degraded|error|timeout), uptime, chainBlock, latencyMs.
 */

import * as http from 'http';
import { parseHealthStatus } from './parseHealthStatus';
import { SERVICES, type ServiceConfig } from './services';
import { buildStatusJson, updateStatuses, type ServiceStatus } from './statusBuilder';

const PORT = parseInt(process.env.PORT ?? '9200', 10);
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? '15000', 10);
const TIMEOUT_MS = 5000;

const startedAt = Date.now();

async function checkService(svc: ServiceConfig): Promise<ServiceStatus> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(svc.url, { signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        name: svc.name,
        status: 'error',
        latencyMs,
        error: `HTTP ${res.status}`,
        lastChecked: new Date().toISOString(),
      };
    }

    const body = await res.json() as Record<string, unknown>;
    const svcStatus = parseHealthStatus(body);
    return {
      name: svc.name,
      status: svcStatus,
      latencyMs,
      uptime: typeof body.uptime === 'number' ? body.uptime : undefined,
      chainBlock: typeof body.chainBlock === 'number' ? body.chainBlock : undefined,
      error: svcStatus === 'error' ? String(body.error ?? 'unhealthy') : undefined,
      lastChecked: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const isTimeout = err.name === 'AbortError';
    return {
      name: svc.name,
      status: isTimeout ? 'timeout' : 'unreachable',
      latencyMs,
      error: isTimeout ? `timeout after ${TIMEOUT_MS}ms` : (err.message ?? 'unreachable'),
      lastChecked: new Date().toISOString(),
    };
  }
}

async function pollAll(): Promise<void> {
  const statuses = await Promise.all(SERVICES.map(checkService));
  updateStatuses(statuses);
  const operational = statuses.filter(s => s.status === 'ok' || s.status === 'degraded').length;
  console.log(
    `[status] ${operational}/${SERVICES.length} services operational @ ${new Date().toISOString()}`,
  );
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/status.json' && req.method === 'GET') {
    const status = buildStatusJson(SERVICES.length);
    const code = status.overall === 'down' ? 503 : 200;
    res.writeHead(code);
    res.end(JSON.stringify(status, null, 2));
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'status-aggregator',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   GoodDollar L2 Status Aggregator           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Port:     ${PORT.toString().padEnd(33)} ║`);
  console.log(`║  Services: ${SERVICES.length.toString().padEnd(33)} ║`);
  console.log(`║  Poll:     ${(POLL_INTERVAL_MS / 1000 + 's').padEnd(33)} ║`);
  console.log('╚══════════════════════════════════════════════╝');

  await pollAll();
  const pollTimer = setInterval(pollAll, POLL_INTERVAL_MS);

  server.listen(PORT, () => {
    console.log(`[status-aggregator] Serving at http://localhost:${PORT}/status.json`);
  });

  const shutdown = () => {
    console.log('[status-aggregator] Shutting down...');
    clearInterval(pollTimer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
