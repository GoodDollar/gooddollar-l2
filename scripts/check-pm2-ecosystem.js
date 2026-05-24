#!/usr/bin/env node
/**
 * Smoke check: backend/ecosystem.config.js must register every lane-1
 * service so `pm2 start backend/ecosystem.config.js` brings up the full
 * `eToro → price-service → oracle-signer → on-chain` pipeline without
 * the operator threading missing producers together by hand.
 *
 * Invoked from scripts/test-lane1-backend.sh before the per-package
 * jest loop.
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const ECOSYSTEM_PATH = path.resolve(__dirname, '..', 'backend', 'ecosystem.config.js');
const SDK_INSTRUMENTS_PATH = path.resolve(
  __dirname,
  '..',
  'backend',
  'etoro-client',
  'dist',
  'instruments',
);

const REQUIRED = [
  { name: 'price-service', script: /price-service\/dist\/index\.js$/, symbolVar: 'ORACLE_SYMBOLS' },
  { name: 'oracle-signer', script: /oracle-signer\/dist\/index\.js$/, symbolVar: 'ORACLE_SYMBOLS' },
  { name: 'hedge-engine',  script: /hedge-engine\/dist\/index\.js$/,  symbolVar: 'HEDGE_SYMBOLS' },
];

const cfg = require(ECOSYSTEM_PATH);
const apps = (cfg && cfg.apps) || [];

for (const { name, script } of REQUIRED) {
  const entry = apps.find((a) => a && a.name === name);
  assert.ok(entry, `[check-pm2-ecosystem] missing PM2 entry: ${name}`);
  assert.match(
    entry.script,
    script,
    `[check-pm2-ecosystem] wrong script for ${name}: ${entry.script}`,
  );
}

// Drift guard: every lane-1 entry's resolved symbol env var must contain
// only symbols the SDK can price/resolve. If the SDK isn't built yet we
// skip the assertion with an informative log — the literal fallback in
// `ecosystem.config.js` already mirrors the SDK contract.
let sdk;
try {
  sdk = require(SDK_INSTRUMENTS_PATH);
} catch (err) {
  if (err && err.code === 'MODULE_NOT_FOUND') {
    console.log(
      '[check-pm2-ecosystem] skip symbol partition — etoro-client/dist not built yet',
    );
  } else {
    throw err;
  }
}

if (sdk && typeof sdk.partitionLaneSymbols === 'function') {
  for (const { name, symbolVar } of REQUIRED) {
    const entry = apps.find((a) => a && a.name === name);
    const raw = entry && entry.env ? entry.env[symbolVar] : undefined;
    assert.ok(
      typeof raw === 'string' && raw.length > 0,
      `[check-pm2-ecosystem] ${name}: ${symbolVar} must resolve to a non-empty CSV`,
    );
    const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const { unknown } = sdk.partitionLaneSymbols(symbols);
    assert.equal(
      unknown.length,
      0,
      `[check-pm2-ecosystem] ${name}: ${symbolVar} contains symbols outside ` +
        `INSTRUMENT_MAP: [${unknown.join(', ')}]. Valid: ${sdk.INSTRUMENT_SYMBOLS.join(', ')}`,
    );
  }
}

console.log(
  '[check-pm2-ecosystem] ok — lane-1 PM2 entries present:',
  REQUIRED.map((r) => r.name).join(', '),
);
