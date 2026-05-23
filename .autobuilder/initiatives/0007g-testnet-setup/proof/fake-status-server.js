#!/usr/bin/env node
/**
 * Synthetic /api/status + /health server for lane-7 health-contract proofs
 * and the lane-local internal smoke. Lane 7 must NEVER hit the production
 * surfaces (`https://goodswap.goodclaw.org`, `https://rpc.goodclaw.org`),
 * so health-gate.sh and internal-smoke.sh both run against this fixture
 * via PUBLIC_BASE / LANE7_BASE overrides.
 *
 * Usage:
 *   node fake-status-server.js [port] [--profile <name>]
 *
 * Profiles control which services are reported and with which status.
 * The server intentionally has no external dependencies — pure stdlib.
 */
'use strict';

const http = require('node:http');

function parseArgs(argv) {
  const args = { port: 49207, profile: 'oracle-hedge-health-only' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--profile' && argv[i + 1]) {
      args.profile = argv[i + 1];
      i += 1;
    } else if (/^\d+$/.test(arg)) {
      args.port = parseInt(arg, 10);
    }
  }
  return args;
}

const PROFILES = {
  // Reproduces the EXCLUDED-but-ok / EXCLUDED branches for both new services.
  // REQUIRED services are all ok so the gate's only blockers are the public-
  // RPC + addresses.json probes which live outside this fixture's surface
  // (the proof artifact only needs the per-service classification rows).
  'oracle-hedge-health-only': {
    overall: 'ok',
    services: [
      { name: 'swap-oracle', status: 'ok' },
      { name: 'liquidator', status: 'ok' },
      { name: 'stocks-keeper', status: 'ok' },
      { name: 'rpc-balancer', status: 'ok' },
      { name: 'bridge-keeper', status: 'ok' },
      { name: 'perps', status: 'ok' },
      { name: 'predict', status: 'ok' },
      { name: 'activity-reporter', status: 'error' },
      { name: 'harvest-keeper', status: 'error' },
      { name: 'revenue-tracker', status: 'error' },
      { name: 'indexer', status: 'error' },
      { name: 'monitor', status: 'degraded' },
      { name: 'oracle-signer', status: 'health-only' },
      { name: 'hedge-engine', status: 'ok' },
    ],
  },
  'lane7-smoke-green': {
    overall: 'ok',
    services: [
      { name: 'price-service', status: 'ok' },
      { name: 'oracle-signer', status: 'health-only' },
      { name: 'hedge-engine', status: 'ok' },
      { name: 'status-aggregator', status: 'ok' },
    ],
  },
  'lane7-smoke-blocker': {
    overall: 'error',
    services: [
      { name: 'price-service', status: 'error' },
      { name: 'oracle-signer', status: 'unreachable' },
      { name: 'hedge-engine', status: 'unreachable' },
      { name: 'status-aggregator', status: 'error' },
    ],
  },
  // Returns HTTP 500 with an HTML body on every path. Used by task 0007
  // to verify the smoke surfaces the HTTP code, content-type, and a
  // redacted body snippet on probe failure (instead of collapsing the
  // diagnostic into a generic `status=unknown` line).
  'lane7-smoke-html-500': null,
};

function buildBody(profile) {
  const p = PROFILES[profile];
  if (!p || typeof p !== 'object') throw new Error(`unknown profile: ${profile}`);
  const services = p.services.map((s) => ({
    name: s.name,
    status: s.status,
    latencyMs: 1,
    lastChecked: new Date().toISOString(),
  }));
  return {
    overall: p.overall,
    healthy: services.filter((s) => s.status === 'ok').length,
    total: services.length,
    services,
  };
}

function send(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function main() {
  const { port, profile } = parseArgs(process.argv);
  if (!(profile in PROFILES)) {
    console.error(
      `unknown profile "${profile}" (known: ${Object.keys(PROFILES).join(', ')})`,
    );
    process.exit(2);
  }

  const isHtml500Profile = profile === 'lane7-smoke-html-500';

  const server = http.createServer((req, res) => {
    if (isHtml500Profile) {
      // Every path returns 500 + an HTML body so the smoke can exercise
      // the diagnostic-row path. Body intentionally contains a long
      // hex-ish token so the redaction pass has something to scrub.
      res.writeHead(500, { 'content-type': 'text/html' });
      res.end(
        '<html>Internal Server Error: token=Bearer abcdef0123456789abcdef0123456789</html>',
      );
      return;
    }
    const url = new URL(req.url || '/', `http://localhost:${port}`);
    if (url.pathname === '/api/status' || url.pathname === '/status.json') {
      return send(res, 200, buildBody(profile));
    }
    if (url.pathname === '/health') {
      const svc = url.searchParams.get('svc') || 'fixture';
      return send(res, 200, {
        service: svc,
        status: 'ok',
        chainBlock: 1,
        uptime: 1,
      });
    }
    if (url.pathname.startsWith('/page')) {
      // health-gate also hits public pages ("/", "/faucet", ...). Return 200
      // so those probes do not pollute the proof artifact with unrelated
      // failures. The status classification rows are the only thing the
      // proof captures.
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      return;
    }
    // Treat root + every public-page path as 200.
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(
      `fake-status-server listening on http://127.0.0.1:${port} (profile=${profile})`,
    );
  });
}

main();
