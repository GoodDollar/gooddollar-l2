#!/usr/bin/env node
// Self-contained price-service stand-in used by `lane3-oracle-publishing-smoke.sh`.
//
// Boots two servers:
//   - WebSocket  on PRICE_WS_PORT     (default 9301) — pushes NormalizedQuote
//     envelopes `{ type: 'quote', data: <NormalizedQuote> }` once per second.
//   - HTTP       on PRICE_HTTP_PORT   (default 9300) — answers `/status/quotes`
//     with the same envelope the real price-service emits, so the frontend
//     status route can be exercised end-to-end.
//
// Quotes are deterministic (seeded PRNG, monotonic ms-resolution timestamps,
// 0.1% step on each tick). Asset class tagging matches the dispatch rules in
// `backend/oracle-signer`:
//   - AAPL, TSLA   → assetClass: 'equity'   → stocks rail
//   - WETH, USDC   → assetClass: 'crypto'   → crypto rail
//
// This script intentionally does NOT import the real price-service package
// (avoids ts-node + transitive build setup for a smoke). The wire envelope
// and the `/status/quotes` shape both match the real implementations.

import http from 'node:http';
import { WebSocketServer } from 'ws';
import process from 'node:process';

const WS_PORT   = Number(process.env.PRICE_WS_PORT   ?? 9301);
const HTTP_PORT = Number(process.env.PRICE_HTTP_PORT ?? 9300);
const TICK_MS   = Number(process.env.MOCK_TICK_MS    ?? 1000);

// Deterministic PRNG (mulberry32).
function makePrng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makePrng(Number(process.env.MOCK_SEED ?? 1));

const seedQuotes = [
  { symbol: 'AAPL', mid: 191.50, assetClass: 'equity' },
  { symbol: 'TSLA', mid: 178.30, assetClass: 'equity' },
  { symbol: 'WETH', mid: 3500.00, assetClass: 'crypto' },
  { symbol: 'USDC', mid: 1.0000, assetClass: 'crypto' },
];

let tickN = 0;
const state = new Map();
for (const q of seedQuotes) state.set(q.symbol, { ...q, instrumentId: q.symbol, last: q.mid });

function step() {
  tickN += 1;
  const now = Date.now();
  const quotes = [];
  for (const [, q] of state) {
    // 0.1% random walk — well within StockOracleV2's 10% deviation guard.
    const delta = (rng() - 0.5) * 0.002 * q.mid;
    q.mid = q.mid + delta;
    q.last = q.mid;
    quotes.push({
      source: 'etoro',
      symbol: q.symbol,
      instrumentId: q.symbol,
      bid: q.mid * 0.9995,
      ask: q.mid * 1.0005,
      mid: q.mid,
      last: q.mid,
      timestamp: now,
      sessionState: 'open',
      confidence: 95,
      assetClass: q.assetClass,
      currency: q.assetClass === 'crypto' ? 'USD' : 'USD',
      stale: false,
    });
  }
  return quotes;
}

// ---- HTTP server ----
const httpServer = http.createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/status/quotes') {
    res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  const quotes = Array.from(state.values()).map((q) => ({
    symbol: q.symbol,
    lastUpdateMs: Date.now(),
    sessionState: 'open',
    confidence: 95,
  }));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    healthy: true,
    freshCount: quotes.length,
    totalCount: quotes.length,
    quotes,
    timestamp: Date.now(),
  }));
});
httpServer.listen(HTTP_PORT, () => console.log(`[mock] HTTP /status/quotes on :${HTTP_PORT}`));

// ---- WS server ----
const wss = new WebSocketServer({ port: WS_PORT });
wss.on('listening', () => console.log(`[mock] WS on :${WS_PORT}`));
wss.on('connection', (ws) => {
  console.log('[mock] WS client connected');
  // Burst initial quotes so the signer's buffer is non-empty on first tick.
  for (const q of step()) ws.send(JSON.stringify({ type: 'quote', data: q }));
  ws.on('close', () => console.log('[mock] WS client disconnected'));
});

const interval = setInterval(() => {
  const quotes = step();
  const msgs = quotes.map((q) => JSON.stringify({ type: 'quote', data: q }));
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    for (const m of msgs) client.send(m);
  }
  if (tickN % 5 === 0) {
    console.log(`[mock] tick #${tickN} pushed ${quotes.length} quotes to ${wss.clients.size} client(s)`);
  }
}, TICK_MS);

function shutdown() {
  console.log('[mock] shutting down');
  clearInterval(interval);
  for (const client of wss.clients) try { client.close(); } catch {}
  wss.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
