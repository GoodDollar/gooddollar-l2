#!/usr/bin/env node
'use strict';

/**
 * Lane-7 internal-only price-service fixture.
 *
 * Purpose: prove the first hop of Yoni's required price-flow path without
 * touching production or real eToro credentials:
 *   safe fixture quote -> price-service REST/WS -> /status/quotes non-empty
 *
 * This is deliberately NOT a public-testnet proof. It is an internal bootstrap
 * source until demo eToro keys are provisioned. Real trading stays fenced.
 */

const { PriceService } = require('../../backend/price-service/dist/index.js');

const port = Number.parseInt(process.env.PRICE_SERVICE_PORT || '49300', 10);
const wsPort = Number.parseInt(process.env.PRICE_SERVICE_WS_PORT || '49301', 10);
const symbols = (process.env.ORACLE_SYMBOLS || 'AAPL,TSLA,NVDA,BTC,ETH')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

if (process.env.REAL_TRADING_ENABLED && process.env.REAL_TRADING_ENABLED !== 'false') {
  console.error('[lane7-price-fixture] refusing to start: REAL_TRADING_ENABLED must be unset or false');
  process.exit(2);
}

const service = new PriceService({
  port,
  wsPort,
  symbols,
  // Give the fixture long enough TTL for monitor smoke/probes while still
  // showing timestamp/freshness changes every refresh.
  stalenessThresholdMs: 120_000,
  cacheTtlMs: 120_000,
});

const basePrices = {
  AAPL: 212.45,
  TSLA: 178.6,
  NVDA: 141.2,
  BTC: 108500,
  ETH: 3840,
};

function quoteFor(symbol, index) {
  const base = basePrices[symbol] || 100 + index * 7;
  const wave = Math.sin(Date.now() / 30_000 + index) * base * 0.0005;
  const mid = Number((base + wave).toFixed(symbol === 'BTC' || symbol === 'ETH' ? 2 : 4));
  const spread = Math.max(mid * 0.0004, 0.01);
  return {
    source: 'etoro',
    symbol,
    instrumentId: `lane7-fixture-${symbol}`,
    bid: Number((mid - spread / 2).toFixed(4)),
    ask: Number((mid + spread / 2).toFixed(4)),
    mid,
    last: mid,
    timestamp: Date.now(),
    sessionState: symbol === 'BTC' || symbol === 'ETH' ? 'open' : 'unknown',
    confidence: 0.5,
    assetClass: symbol === 'BTC' || symbol === 'ETH' ? 'crypto' : 'equity',
    currency: 'USD',
    stale: false,
  };
}

function publish() {
  symbols.forEach((symbol, index) => {
    const result = service.ingestQuote(quoteFor(symbol, index));
    if (!result.accepted) {
      console.warn(`[lane7-price-fixture] quote rejected for ${symbol}: ${result.reason || 'unknown'}`);
    }
  });
}

service.start();
publish();
const timer = setInterval(publish, 10_000);

console.log(`[lane7-price-fixture] serving ${symbols.length} safe fixture quotes on REST :${port}, WS :${wsPort}`);
console.log('[lane7-price-fixture] real trading fenced; this is not a public-testnet/live-eToro proof');

function shutdown() {
  clearInterval(timer);
  service.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
